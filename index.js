// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
const express = require("express");
const bodyparser = require("body-parser");
const session = require("express-session");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const path = require("path");
const exphbs = require("express-handlebars");
const port = 3000; // Corrected variable name
const bcrypt = require("bcrypt");
const saltRounds = 10; // Salt rounds for bcrypt (adjust as needed)
//add cookie parser
const cookieParser = require("cookie-parser");
const filestore = require("session-file-store")(session);
const handlebars = require("handlebars");
const cors = require("cors");
const oneDay = 1000 * 60 * 60 * 24;
const oneHour = 1000 * 60 * 60;
const oneMinute = 1000 * 60;

// Define the custom helper function
handlebars.registerHelper("inc", function (value) {
  return parseInt(value) + 1;
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "https://proj-2535e-default-rtdb.firebaseio.com",
  // Replace with your Firebase project URL
});
const firestore = admin.firestore();

// Configure Firestore for local emulator in development environment
// if (process.env.NODE_ENV !== "production") {
//   admin.firestore().settings({ host: "localhost:8080", ssl: false });
// }

const app = express(); // Create an instance of the Express app

// Configure Handlebars
const hbs = exphbs.create({
  extname: ".hbs", // Set the file extension for handlebars files
  layoutsDir: "views/layouts", // Set the layouts directory
  defaultLayout: "main", // Specify the default layout file
  // Add any other configuration options you need
});

// Use Handlebars as the view engine
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", "views");

// cookie parser middleware
app.use(cookieParser());
app.use(cors());

// Configure session
app.use(
  session({
    secret: "SHus#wjj3ye439723ui0AJ48w&*^@sji", // Change this to a secret key
    saveUninitialized: false,
    cookie: { maxAge: oneDay, httpOnly: false },
    resave: false,
    store: new filestore({ logFn: function () {} }),
    path: "/sessions/",
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

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Set the student's ID number as the document ID

    // Save student data to Firestore
    await firestore.collection("Students").doc(idNumber).set({
      firstName,
      lastName,
      idNumber,
      email,
      hashedPassword,
      courses: [],
    });
    // Redirect to student dashboard after successful registration
    console.log("Student registered successfully");
    res.redirect("/admin-home");
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Lecturer
app.get("/register/lecturer", (req, res) => {
  res.render("admin/lecturer-registration");
});

app.post("/register/lecturer", async (req, res) => {
  try {
    const { firstName, lastName, idNumber, email, password, course } = req.body;

    console.log("Received data:", {
      firstName,
      lastName,
      idNumber,
      email,
      password,
      course,
    });

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await firestore.collection("Lecturers").doc(idNumber).set({
      firstName,
      lastName,
      idNumber,
      email,
      hashedPassword, // Consider storing a hashed version of the password
      course,
    });

    console.log("Lecturer registered successfully");
    res.redirect("/admin-home"); // Redirect or send a response as needed
  } catch (error) {
    console.error("Error registering lecturer:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Course
app.get("/register/course", (req, res) => {
  res.render("admin/course-registration");
});

app.post("/register/course", async (req, res) => {
  try {
    const { courseCode, courseDescription } = req.body;

    await firestore.collection("Courses").doc(courseCode).set({
      courseCode,
      courseDescription,
    });

    console.log("course registered successfully");
    res.redirect("/admin-home"); // Redirect or send a response as needed
  } catch (error) {
    console.error("Error registering lecturer:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Serve the login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Handle login form submission
app.post("/login", async (req, res) => {
  const { id, password, userType } = req.body;

  if (id === "123" && password === "admin123" && userType === "lecturer") {
    req.session.userId = id;
    res.redirect("/admin-home");
  }

  try {
    let userDoc;
    if (userType === "student") {
      userDoc = await firestore.collection("Students").doc(id).get();
      req.session.user = {
        id: userDoc.id,
        userType: "student",
        firstName: userDoc.data().firstName,
        lastName: userDoc.data().lastName,
        email: userDoc.data().email,
        courses: userDoc.data().courses,
        // Include other necessary fields but exclude sensitive data like hashedPassword
      };
    } else if (userType === "lecturer") {
      userDoc = await firestore.collection("Lecturers").doc(id).get();
      req.session.user = {
        id: userDoc.id,
        userType: "lecturer",
        firstName: userDoc.data().firstName,
        lastName: userDoc.data().lastName,
        email: userDoc.data().email,
        course: userDoc.data().course,
        // Include other necessary fields but exclude sensitive data like hashedPassword
      };
    } else {
      return res.status(400).send("Invalid user type");
    }

    if (!userDoc.exists) {
      return res.status(404).send("User not found");
    }

    const userData = userDoc.data();
    const isPasswordMatch = await bcrypt.compare(
      password,
      userData.hashedPassword
    );

    if (isPasswordMatch) {
      req.session.userId = id;
      req.session.userType = userType;

      if (userType === "student") {
        res.redirect("/dashboard/student");
      } else if (userType === "lecturer") {
        res.redirect("/dashboard/lecturer");
      }
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Serve admin stuff
// Assuming you have an admin home route
app.get("/admin-home", (req, res) => {
  res.render("admin/admin-home");
});

app.get("/fetch-passed", async (req, res) => {
  try {
    const students = [];
    const querySnapshot = await admin.firestore().collection("Students").get();
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Fetching student data
app.get("/fetch-students", async (req, res) => {
  try {
    const students = [];
    const querySnapshot = await admin.firestore().collection("Students").get();
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

app.get("/fetch-course-students", async (req, res) => {
  try {
    const course = req.session.user.course;
    const students = [];
    const querySnapshot = await admin
      .firestore()
      .collection("Courses")
      .doc(course)
      .collection("stList")
      .get();

    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });

    console.log(students); // Corrected this line
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to update student grades
app.post("/update-student-grades", async (req, res) => {
  const { id, assignment1, assignment2, CAT1, CAT2, Exam } = req.body;
  const course = req.session.user.course;

  try {
    // Make sure these values are correctly being received
    console.log("Received grades to update:", {
      id,
      assignment1,
      assignment2,
      CAT1,
      CAT2,
      Exam,
    });

    await admin
      .firestore()
      .collection("Courses")
      .doc(course)
      .collection("stList")
      .doc(id)
      .update({
        assignment1,
        assignment2,
        CAT1,
        CAT2,
        Exam,
      });
    console.log("Grades updated successfully");
    res.render("lecturers/grade-students");
  } catch (error) {
    console.error("Error updating student grades:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Serve the course selection page for students
// Route to display available courses
app.get("/student/selectcourses", async (req, res) => {
  try {
    const coursesSnapshot = await firestore.collection("Courses").get();
    const courses = [];
    coursesSnapshot.forEach((doc) => {
      courses.push(doc.data());
    });

    res.render("students/st-select", { courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/student/enroll-course", async (req, res) => {
  const { courseCode } = req.body;
  const studentId = req.session.userId;

  if (!studentId) {
    return res.status(401).send("Not authenticated");
  }

  try {
    // Fetch the student's document
    const studentDocRef = firestore.collection("Students").doc(studentId);
    const studentDoc = await studentDocRef.get();

    if (!studentDoc.exists) {
      return res.status(404).send("Student not found");
    }

    // Add the new course to the student's courses list
    const currentCourses = studentDoc.data().courses || [];
    if (!currentCourses.includes(courseCode)) {
      await studentDocRef.update({
        courses: [...currentCourses, courseCode],
      });

      await firestore
        .collection("Courses")
        .doc(courseCode)
        .collection("stList")
        .doc(studentId)
        .set({
          firstName: studentDoc.data().firstName,
          lastName: studentDoc.data().lastName,
          idNumber: studentId,
          email: studentDoc.data().email,
          assignment1: null,
          assignment2: null,
          CAT1: null,
          CAT2: null,
          Exam: null,
        });
    }

    res.redirect("/dashboard/student");
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/reports", (req, res) => {
  res.render("admin/report-generation");
  // Additional logic for the student dashboard can be added here
});

//getting user sessions

app.get("/get-session-user-student", async (request, response) => {
  if (request.session && request.session.userId) {
    try {
      const userDoc = await firestore
        .collection("Students")
        .doc(request.session.userId)
        .get();

      if (!userDoc.exists) {
        return response.status(404).send("Student not found");
      }

      response.json({
        id: userDoc.id,
        userType: "student",
        firstName: userDoc.data().firstName,
        lastName: userDoc.data().lastName,
        email: userDoc.data().email,
        courses: userDoc.data().courses,
      });
    } catch (error) {
      console.error("Error fetching student data: ", error);
      response.status(500).send("Internal Server Error");
    }
  } else {
    response.status(401).send("No session user data found");
  }
});

app.get("/get-session-user-lecturer", async (request, response) => {
  if (request.session && request.session.userId) {
    try {
      const userDoc = await firestore
        .collection("lecturers")
        .doc(request.session.userId)
        .get();

      if (!userDoc.exists) {
        return response.status(404).send("Lecturer not found");
      }

      response.json({
        id: userDoc.id,
        userType: "lecturer",
        firstName: userDoc.data().firstName,
        lastName: userDoc.data().lastName,
        email: userDoc.data().email,
        course: userDoc.data().course,
      });
    } catch (error) {
      console.error("Error fetching student data: ", error);
      response.status(500).send("Internal Server Error");
    }
  } else {
    response.status(401).send("No session user data found");
  }
});

app.get("/path-to-get-course/:courseId", async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const courseDoc = await admin
      .firestore()
      .collection("Courses")
      .doc(courseId)
      .get();
    if (!courseDoc.exists) {
      return res.status(404).send("Course not found");
    }

    const courseData = courseDoc.data();
    res.json({ id: courseId, ...courseData });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/generate-course-report", async (req, res) => {
  try {
    const courses = [];
    const coursesSnapshot = await firestore.collection("Courses").get();

    for (const courseDoc of coursesSnapshot.docs) {
      const studentsList = [];
      const studentsSnapshot = await courseDoc.ref.collection("stList").get();

      studentsSnapshot.forEach((studentDoc) => {
        studentsList.push({ id: studentDoc.id, ...studentDoc.data() });
      });

      courses.push({
        courseCode: courseDoc.id,
        courseDescription: courseDoc.data().courseDescription,
        students: studentsList,
      });
    }

    // Render the report template with the fetched courses and their students
    res.render("admin/report-generation", { courses });
  } catch (error) {
    console.error("Error generating course report:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/generate-pass-report", async (req, res) => {
  try {
    const courses = [];
    const coursesSnapshot = await firestore.collection("Courses").get();

    for (const courseDoc of coursesSnapshot.docs) {
      const studentsList = [];
      const studentsSnapshot = await courseDoc.ref.collection("stList").get();

      studentsSnapshot.forEach((studentDoc) => {
        const studentData = studentDoc.data();
        if (
          parseInt(studentData.assignment1) > 8 &&
          parseInt(studentData.assignment2) > 8 &&
          parseInt(studentData.CAT1) > 15 &&
          parseInt(studentData.CAT2) > 15 &&
          parseInt(studentData.Exam) > 25
        ) {
          studentsList.push({ id: studentDoc.id, ...studentData });
        }
      });

      if (studentsList.length > 0) {
        courses.push({
          courseCode: courseDoc.id,
          courseDescription: courseDoc.data().courseDescription,
          students: studentsList,
        });
      }
    }

    res.render("admin/pass-report", { courses });
  } catch (error) {
    console.error("Error generating pass report:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/generate-fail-report", async (req, res) => {
  try {
    const courses = [];
    const coursesSnapshot = await firestore.collection("Courses").get();

    for (const courseDoc of coursesSnapshot.docs) {
      const studentsList = [];
      const studentsSnapshot = await courseDoc.ref.collection("stList").get();

      studentsSnapshot.forEach((studentDoc) => {
        const studentData = studentDoc.data();
        if (
          parseInt(studentData.assignment1) <= 8 ||
          parseInt(studentData.assignment2) <= 8 ||
          parseInt(studentData.CAT1) <= 15 ||
          parseInt(studentData.CAT2) <= 15 ||
          parseInt(studentData.Exam) <= 25
        ) {
          studentsList.push({ id: studentDoc.id, ...studentData });
        }
      });

      if (studentsList.length > 0) {
        courses.push({
          courseCode: courseDoc.id,
          courseDescription: courseDoc.data().courseDescription,
          students: studentsList,
        });
      }
    }

    res.render("admin/fail-report", { courses });
  } catch (error) {
    console.error("Error generating fail report:", error);
    res.status(500).send("Internal Server Error");
  }
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
