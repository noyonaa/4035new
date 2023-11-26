import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const express = require("express");
const port = 3000;
const bodyparser = require("body-parser");
const firebaseAdmin = require("firebase-admin");
const path = require("path");
const app = express();
const exphbs = require("express-handlebars");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.databaseURL,
});

// Use Handlebars as the view engine
app.engine("hbs", exphbs({ extname: "hbs" }));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyparser.json());
// Serve static files (HTML, CSS, etc.)
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ entended: false }));

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");
const firebaseConfig = require("./firebaseConfig");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://proj-2535e.firebaseio.com/",
  // Replace with your Firebase project URL
});

const firestore = admin.firestore();

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  const idToken = req.header("Authorization");
  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Unauthorized" });
    });
};

// Serve the home page for authenticated users
app.get("/", isAuthenticated, (req, res) => {
  const user = req.user;

  // Retrieve student details from Firestore
  firestore
    .collection("students")
    .doc(user.uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const studentDetails = doc.data();
        res.sendFile(path.join(__dirname, "public", "home.html"));
      } else {
        res.status(404).send("Student details not found.");
      }
    })
    .catch((error) => {
      console.error("Error retrieving student details:", error);
      res.status(500).send("Internal Server Error");
    });
});

// Serve the home page with login buttons
app.get("/", (req, res) => {
  res.render("home");
});

// Serve the registration pages
app.get("/register/student", (req, res) => {
  res.render("students/student-registration");
});

app.get("/register/lecturer", (req, res) => {
  res.render("admin/lecturer-registration");
});

// Serve the login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Serve the student dashboard
app.get("/dashboard/student", isAuthenticated, (req, res) => {
  res.render("students/st-dash");
  // Additional logic for the student dashboard can be added here
});

// Serve the lecturer dashboard
app.get("/dashboard/lecturer", isAuthenticated, (req, res) => {
  res.render("lecturers/grade-students");
  // Additional logic for the lecturer dashboard can be added here
});

// Serve the course selection page for students
app.get("/select-courses", isAuthenticated, (req, res) => {
  res.render("students/st-select");
  // Implement course selection logic here
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
