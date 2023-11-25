import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const express = require("express");
const port = 3000;
const bodyparser = require("body-parser");
const firebaseAdmin = require("firebase-admin");
const path = require('path');
const app = express();
app.use(bodyparser.json());
// Serve static files (HTML, CSS, etc.)
app.use(express.static('public'));
app.use(bodyparser.urlencoded({ entended: false }));

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
const firebaseConfig = require('./firebaseConfig');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://proj-2535e.firebaseio.com/"
  // Replace with your Firebase project URL
});

const firestore = admin.firestore();

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  const idToken = req.header('Authorization');
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  admin.auth().verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Unauthorized' });
    });
};

// Serve the home page for authenticated users
app.get('/', isAuthenticated, (req, res) => {
  const user = req.user;

  // Retrieve student details from Firestore
  firestore.collection('students').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists) {
        const studentDetails = doc.data();
        res.sendFile(path.join(__dirname, 'public', 'home.html'));
      } else {
        res.status(404).send('Student details not found.');
      }
    })
    .catch((error) => {
      console.error('Error retrieving student details:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Serve the registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the page for selecting courses
app.get('/select-courses', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'select-courses.html'));
  // Implement course selection logic here
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});