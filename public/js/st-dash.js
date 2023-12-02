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

function createCourseCard(course, courseNumber) {
  // Create card elements
  const card = document.createElement("div");
  card.className = "card mt-3";

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  // Add course title
  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = `Course ${courseNumber}: ${course}`;
  cardBody.appendChild(title);

  // Add course details (e.g., description, assignments, CATs)
  // Repeat the following for each detail you want to display
  const description = document.createElement("p");
  description.className = "card-text";
  description.innerHTML = `Description: <span>${course.description}</span>`;
  cardBody.appendChild(description);

  // Append card body to card
  card.appendChild(cardBody);

  return card;
}

function populateStudentDetails(details) {
  document.getElementById("student-id").textContent = details.id;
  document.getElementById("student-first-name").textContent = details.firstName;
  document.getElementById("student-last-name").textContent = details.lastName;
    document.getElementById("student-email").textContent = details.email;
    
  const coursesContainer = document.getElementById("courses-container");
  coursesContainer.innerHTML = ""; // Clear existing content

  details.courses.forEach((course, index) => {
    const courseCard = createCourseCard(course, index + 1);
    coursesContainer.appendChild(courseCard);
  });
  // Additional fields can be populated here ia:\ Ensure that the session data is correctly being set and contains the necessary student inf needed
}

document.addEventListener("DOMContentLoaded", getStudentInfo);
