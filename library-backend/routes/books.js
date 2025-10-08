const pool = require("../db");

function handleBooks(req, res, path) {
  // GET /books → list all books
  if (req.method === "GET") {
    pool.query("SELECT * FROM books", (err, results) => {
      if (err) {
        console.error("MySQL GET error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      }
    });
  }

  // POST /books → add a new book
  else if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        // CHANGED: Deconstruct category_id from the request body
        const { title, author, isbn, total_copies, category_id } = JSON.parse(body);

        // Validation
        if (!title || !total_copies) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: "Title and total_copies are required" })
          );
        }

        const totalCopiesInt = parseInt(total_copies);
        if (isNaN(totalCopiesInt) || totalCopiesInt < 1) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: "total_copies must be a positive number" })
          );
        }

        // CHANGED: Safely handle category_id (it can be null)
        const safeCategoryId = category_id ? parseInt(category_id, 10) : null;
        if (category_id && isNaN(safeCategoryId)) {
             res.writeHead(400, { "Content-Type": "application/json" });
             return res.end(JSON.stringify({ error: "category_id must be a number" }));
        }

        const safeAuthor = author || "";
        const safeIsbn = isbn || null;

        // CHANGED: Update SQL query to include category_id
        const sql = "INSERT INTO books (title, author, isbn, total_copies, available_copies, category_id) VALUES (?, ?, ?, ?, ?, ?)";
        
        // CHANGED: Add safeCategoryId to the parameters array
        const params = [title, safeAuthor, safeIsbn, totalCopiesInt, totalCopiesInt, safeCategoryId];

        pool.query(sql, params, (err, results) => {
            if (err) {
              console.error("MySQL INSERT error:", err);
              if (err.code === "ER_DUP_ENTRY") {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "ISBN already exists" }));
              } else {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              }
            } else {
              res.writeHead(201, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  id: results.insertId,
                  title,
                  author: safeAuthor,
                  isbn: safeIsbn,
                  total_copies: totalCopiesInt,
                  available_copies: totalCopiesInt,
                  category_id: safeCategoryId, // CHANGED: Include category_id in the response
                })
              );
            }
          }
        );
      } catch (err) {
        console.error("Invalid JSON in POST /books:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  // PUT /books/:id → update book
  else if (req.method === "PUT") {
    // NOTE: You may want to update this PUT handler to also handle category_id in the future.
    // This example only modifies the POST handler as requested.
    const id = path.split("/")[2];
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { title, author, isbn, total_copies, available_copies } = JSON.parse(body);
        const totalCopiesInt = parseInt(total_copies);
        const availableCopiesInt = parseInt(available_copies);
        pool.query(
          "UPDATE books SET title=?, author=?, isbn=?, total_copies=?, available_copies=? WHERE id=?",
          [title, author || "", isbn || null, totalCopiesInt, availableCopiesInt, id],
          (err) => {
            if (err) {
              console.error("MySQL UPDATE error:", err);
              if (err.code === "ER_DUP_ENTRY") {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "ISBN already exists" }));
              } else {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              }
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Book updated" }));
            }
          }
        );
      } catch (err) {
        console.error("Invalid JSON in PUT /books:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  // DELETE /books/:id → delete book
  else if (req.method === "DELETE") {
    const id = path.split("/")[2];
    pool.query("DELETE FROM books WHERE id=?", [id], (err) => {
      if (err) {
        console.error("MySQL DELETE error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Book deleted" }));
      }
    });
  }

  // Anything else
  else {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Method Not Allowed" }));
  }
}

module.exports = handleBooks;