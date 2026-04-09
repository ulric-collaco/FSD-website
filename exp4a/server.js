const express = require("express");
const morgan = require("morgan");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Lab routes
app.get("/", (req, res) => {
  res.send("Welcome to the Student Information Server");
});

app.get("/about", (req, res) => {
  res.send("Name: John Doe\nRoll No: 23\nCourse: Computer Engineering");
});

app.get("/contact", (req, res) => {
  res.send("Email: student@example.com");
});

app.post("/register", (req, res) => {
  res.status(201).send("Created");
});

app.put("/update", (req, res) => {
  res.status(200).send("Updated");
});

// Post-Lab Exercise 1
app.post("/submit-form", (req, res) => {
  const { studentName, branch, year } = req.body;

  res.send(`
    <h1>Submitted Student Information</h1>
    <p>Student Name: ${studentName || "N/A"}</p>
    <p>Branch: ${branch || "N/A"}</p>
    <p>Year: ${year || "N/A"}</p>
    <a href="/form.html">Back to Form</a>
  `);
});

// Post-Lab Exercise 2
app.get("/profile", (req, res) => {
  res.render("profile", {
    name: "Joshua",
    branch: "Computer Engineering",
    year: "SE"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
