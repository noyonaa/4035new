import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const express = require("express");
const port = 3000;
const bodyparser = require("body-parser");
const firebaseAdmin = require("firebase-admin");
const path = require('path');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ entended: false }));

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);