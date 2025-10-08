const http = require("http");
const url = require("url");
require("dotenv").config();

const handleBooks = require("./routes/books");
const handleUsers = require("./routes/users");
const handleBorrow = require("./routes/borrow");
const handleCategories = require("./routes/categories");

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const reqUrl = url.parse(req.url, true);
  // Normalize path: remove trailing slash
  let path = reqUrl.pathname.replace(/\/$/, "");

  // Route handling
  if (path.startsWith("/books")) {
    handleBooks(req, res, path);
  } else if (path.startsWith("/users")) {
    handleUsers(req, res, path);
  } else if (
    path.startsWith("/borrow") ||
    path === "/borrow-records" ||
    path === "/return"
  ) {
    handleBorrow(req, res, path);
  } else if (path.startsWith("/categories")) {
    handleCategories(req, res, path);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not Found" }));
  }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
