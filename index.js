// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
const express = require("express");
const bodyparser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");
const path = require("path");
const exphbs = require("express-handlebars");
const port = 3000; // Corrected variable name

// Initialize Firebase Admin SDK
const firebaseConfig = require("./firebaseConfig.js");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://proj-2535e-default-rtdb.firebaseio.com",
  // Replace with your Firebase project URL
});
const firestore = admin.firestore();

// Configure Firestore for local emulator in development environment
if (process.env.NODE_ENV !== "production") {
  admin.firestore().settings({ host: "localhost:8080", ssl: false });
}

const app = express(); // Create an instance of the Express app

// Use Handlebars as the view engine
app.engine("hbs", exphbs({ extname: "hbs" }));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Configure session
app.use(
  session({
    secret: "SHus#wjj3ye439723ui0AJ48w&*^@sji", // Change this to a secret key
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyparser.urlencoded({ extended: false })); // Corrected typo in "extended"
app.use(bodyparser.json());

// Serve static files (HTML, CSS, etc.)
app.use(express.static("public"));
// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    // Redirect to login if the user is not authenticated
    res.redirect("/login");
  } else {
    next();
  }
};

// Serve the home page with login buttons
app.get("/", (req, res) => {
  res.render("home");
});

// Serve the registration pages
//Student
app.get("/register/student", (req, res) => {
  res.render("admin/student-registration");
});

app.post("/register/student", async (req, res) => {
  try {
    console.log("Received POST request to /register/student");
    const { firstName, lastName, idNumber, email, password } = req.body;
    console.log("Received data:", {
      firstName,
      lastName,
      idNumber,
      email,
      password,
    });

    // Set the student's ID number as the document ID
    const studentRef = firestore.collection("students").doc(idNumber);

    // Save student data to Firestore
    await studentRef.set({
      firstName,
      lastName,
      idNumber,
      email,
      password,
    });

    // Redirect to student dashboard after successful registration
    console.log("Student registered successfully");
    res.redirect("/dashboard/student");
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).send("Internal Server Error");
  }
});


//Lecturer
app.get("/register/lecturer", (req, res) => {
  res.render("admin/lecturer-registration");
});

app.post("/register/lecturer", (req, res) => {
  const { firstName, lastName, idNumber, email, password, course } = req.body;

  const lecturerRef = admin.firestore().collection("lecturers").doc(idNumber);

  lecturerRef
    .set({
      firstName,
      lastName,
      idNumber,
      email,
      password, // Consider storing a hashed version of the password
      course,
    })
    .then(() => {
      console.log("Lecturer registered successfully");
      res.redirect("/some-success-page"); // Redirect or send a response as needed
    })
    .catch((error) => {
      console.error("Error registering lecturer:", error);
      res.status(500).send("Internal Server Error");
    });
});

//Course
app.get("/register/course", (req, res) => {
  res.render("admin/course-registration");
});

// Serve the login page
app.get("/login", (req, res) => {
  res.render("login");
});
// Handle login form submission
app.post("/login", (req, res) => {
  const { email, password, userType } = req.body;

  // Add logic to authenticate user based on userType
  if (
    email === "admin@usiu.ac.ke" &&
    password === "admin1234" &&
    userType === "lecturer"
  ) {
    // Redirect to admin home page
    res.render("admin/admin-home");
  } else if (userType === "student") {
    // Handle student login
    // ...
  } else if (userType === "lecturer") {
    // Handle lecturer login
    // ...
  } else {
    // Invalid user type
    res.status(400).send("Invalid user type");
  }
});

//Serve admin stuff
// Assuming you have an admin home route
app.get("/admin-home", isAuthenticated, (req, res) => {
  res.render("admin/admin-home");
});

//Fetching student data
app.get("/fetch-students", async (req, res) => {
  try {
    const students = [];
    const querySnapshot = await admin.firestore().collection("students").get();
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Serve the student dashboard
app.get("/dashboard/student", (req, res) => {
  res.render("students/st-dash");
  // Additional logic for the student dashboard can be added here
});

// Serve the lecturer dashboard
app.get("/dashboard/lecturer", (req, res) => {
  res.render("lecturers/grade-students");
  // Additional logic for the lecturer dashboard can be added here
});

// Serve the course selection page for students
app.get("/select-courses", (req, res) => {
  res.render("students/st-select");
  // Implement course selection logic here
});

// Logout route
app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // Redirect to login after successful logout
      res.redirect("/login");
    }
  });
});

//Listen to port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
