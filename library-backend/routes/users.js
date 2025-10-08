// routes/users.js
const pool = require("../db");

function handleUsers(req, res, path) {
  // GET /users → list all users
  if (req.method === "GET") {
    pool.query("SELECT * FROM users", (err, results) => {
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      } else {
        res.end(JSON.stringify(results));
      }
    });
  }

  // POST /users → add a new user
  else if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      const { name, email } = JSON.parse(body);
      pool.query(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        [name, email],
        (err, results) => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          } else {
            res.end(JSON.stringify({ id: results.insertId, name, email }));
          }
        }
      );
    });
  }

  // PUT /users/:id → update user
  else if (req.method === "PUT") {
    const id = path.split("/")[2];
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      const { name, email } = JSON.parse(body);
      pool.query(
        "UPDATE users SET name=?, email=? WHERE id=?",
        [name, email, id],
        (err) => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          } else {
            res.end(JSON.stringify({ message: "User updated" }));
          }
        }
      );
    });
  }

  // DELETE /users/:id → delete user
  else if (req.method === "DELETE") {
    const id = path.split("/")[2];
    pool.query("DELETE FROM users WHERE id=?", [id], (err) => {
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      } else {
        res.end(JSON.stringify({ message: "User deleted" }));
      }
    });
  }

  else {
    res.writeHead(405);
    res.end(JSON.stringify({ message: "Method Not Allowed" }));
  }
}

module.exports = handleUsers;
