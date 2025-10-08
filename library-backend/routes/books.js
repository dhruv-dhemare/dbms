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
        const { title, author, isbn, total_copies } = JSON.parse(body);

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

        // Default empty values if not provided
        const safeAuthor = author || "";
        const safeIsbn = isbn || null;

        pool.query(
          "INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)",
          [title, safeAuthor, safeIsbn, totalCopiesInt, totalCopiesInt],
          (err, results) => {
            if (err) {
              console.error("MySQL INSERT error:", err); // 🔴 See exact issue here
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
    const id = path.split("/")[2];
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { title, author, isbn, total_copies, available_copies } =
          JSON.parse(body);

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
