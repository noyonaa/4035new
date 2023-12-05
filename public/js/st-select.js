const data = ["APP4080", "APP4035", "APT1050"];

function populateSelect(selectOptions) {
  // Populate the select dropdown with data from an array of objects.
  var select = document.getElementById("courseCode");

  selectOptions.forEach((options) => {
    const option = document.createElement("option");
    option.value = options;
    option.innerText = options;

    select.appendChild(option);
  });
}

populateSelect(data);
