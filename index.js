import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const express = require("express");
const port = 3000;
const bodyparser = require("body-parser");
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ entended: false }));

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACKZfkStXagJ_R9E1DthxDqcSkF4r-ENI",
  authDomain: "studentcourses-8452f.firebaseapp.com",
  projectId: "studentcourses-8452f",
  storageBucket: "studentcourses-8452f.appspot.com",
  messagingSenderId: "799305562180",
  appId: "1:799305562180:web:68cd18754f90d6fdc7e411",
  measurementId: "G-KMNX27ZFSW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);