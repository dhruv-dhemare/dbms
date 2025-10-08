// routes/borrow.js
const pool = require("../db");

function handleBorrow(req, res, path) {
  // Helper to send JSON response
  const sendJSON = (status, obj) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  // --- BORROW A BOOK ---
  if (path === "/borrow" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { user_id, book_id } = JSON.parse(body);

        if (!user_id || !book_id) return sendJSON(400, { message: "user_id and book_id are required" });

        // Check book availability
        pool.query("SELECT available_copies FROM books WHERE id = ?", [book_id], (err, results) => {
          if (err) return sendJSON(500, { error: err.message });
          if (results.length === 0) return sendJSON(404, { message: "Book not found" });
          if (results[0].available_copies <= 0) return sendJSON(400, { message: "No copies available" });

          // Insert borrow record
          pool.query(
            "INSERT INTO borrow_records (user_id, book_id, borrow_date, returned, fine_amount) VALUES (?, ?, NOW(), FALSE, 0)",
            [user_id, book_id],
            (err, result) => {
              if (err) return sendJSON(500, { error: err.message });

              // Decrease available copies
              pool.query(
                "UPDATE books SET available_copies = available_copies - 1 WHERE id = ?",
                [book_id],
                updateErr => {
                  if (updateErr) return sendJSON(500, { error: updateErr.message });

                  sendJSON(200, {
                    message: "Book borrowed successfully",
                    record_id: result.insertId
                  });
                }
              );
            }
          );
        });
      } catch (err) {
        sendJSON(400, { message: "Invalid JSON input" });
      }
    });
  }

  // --- RETURN A BOOK ---
  else if (path === "/return" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const { record_id, fine_amount } = JSON.parse(body);

        if (!record_id) return sendJSON(400, { message: "record_id is required" });

        // Get borrow record
        pool.query(
          "SELECT book_id, borrow_date, returned FROM borrow_records WHERE id = ?",
          [record_id],
          (err, results) => {
            if (err) return sendJSON(500, { error: err.message });
            if (results.length === 0) return sendJSON(404, { message: "Borrow record not found" });
            if (results[0].returned) return sendJSON(400, { message: "Book already returned" });

            const bookId = results[0].book_id;
            let fine = 0;

            // Fine calculation
            if (fine_amount && !isNaN(fine_amount)) {
              fine = parseInt(fine_amount);
            } else {
              const borrowDate = new Date(results[0].borrow_date);
              const returnDate = new Date();
              const diffTime = returnDate.getTime() - borrowDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays > 30) fine = (diffDays - 30) * 15;
              else if (diffDays > 20) fine = (diffDays - 20) * 5;
            }

            // Update borrow record
            pool.query(
              "UPDATE borrow_records SET returned = 1, return_date = NOW(), fine_amount = ? WHERE id = ?",
              [fine, record_id],
              updateErr => {
                if (updateErr) return sendJSON(500, { error: updateErr.message });

                // Increase available copies
                pool.query(
                  "UPDATE books SET available_copies = available_copies + 1 WHERE id = ?",
                  [bookId],
                  bookErr => {
                    if (bookErr) return sendJSON(500, { error: bookErr.message });

                    const notification = fine > 0
                      ? `⚠️ You have a fine of ₹${fine}.`
                      : "✅ No fine! Thank you for returning on time.";

                    sendJSON(200, {
                      message: "Book returned successfully",
                      fine,
                      notification
                    });
                  }
                );
              }
            );
          }
        );
      } catch (err) {
        sendJSON(400, { message: "Invalid JSON input" });
      }
    });
  }

  // --- GET BORROW HISTORY ---
  else if (path === "/borrow-records" && req.method === "GET") {
    pool.query(
      `SELECT 
         br.id,
         u.name AS user_name,
         b.title AS book_title,
         br.borrow_date,
         br.return_date,
         br.returned,
         br.fine_amount
       FROM borrow_records br
       JOIN users u ON br.user_id = u.id
       JOIN books b ON br.book_id = b.id
       ORDER BY br.borrow_date DESC`,
      (err, results) => {
        if (err) return sendJSON(500, { error: err.message });
        sendJSON(200, results);
      }
    );
  }

  // --- INVALID PATH/METHOD ---
  else {
    sendJSON(405, { message: "Method Not Allowed" });
  }
}

module.exports = handleBorrow;
