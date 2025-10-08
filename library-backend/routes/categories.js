// routes/categories.js
const categories = [
  { id: 1, name: "Fiction" },
  { id: 2, name: "Non-fiction" },
  { id: 3, name: "Science" },
  { id: 4, name: "History" },
  { id: 5, name: "Biography" },
];

function handleCategories(req, res, path) {
  if (req.method === "GET" && path === "/categories") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(categories));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not Found" }));
  }
}

module.exports = handleCategories;
