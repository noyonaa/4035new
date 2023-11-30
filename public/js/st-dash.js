async function getStudentInfo() {
  console.log("this has been done");
  const url = "/get-session-user-student";
  try {
    const response = await fetch(url, { method: "GET" });
    console.log("Response received: ", response); // Log the raw response
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const studentDetails = await response.json();
    console.log("Student details: ", studentDetails); // Log the parsed data
    populateStudentDetails(studentDetails);
  } catch (error) {
    console.error("Error fetching student details: ", error);
  }
}

function populateStudentDetails(details) {
  document.getElementById("student-id").textContent = details.id;
  document.getElementById("student-first-name").textContent = details.firstName;
  document.getElementById("student-last-name").textContent = details.lastName;
  document.getElementById("student-email").textContent = details.email;
  // Additional fields can be populated here ia:\ Ensure that the session data is correctly being set and contains the necessary student inf needed
}

document.addEventListener("DOMContentLoaded", getStudentInfo);
