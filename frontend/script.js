// Global variable to store provider details for appointment
let selectedProvider = {};

// Toggling between Search Providers and Book Appointment sections
document.getElementById("search-toggle").addEventListener("click", function() {
    document.getElementById("search").style.display = "block"; // Show search section
    document.getElementById("appointments-toggle").style.fontWeight = "normal";  // Unhighlight the other menu item
    document.getElementById("search-toggle").style.fontWeight = "bold";  // Highlight current menu item
    document.getElementById("no-results").style.display = "none";  // Hide "No results" message
    document.getElementById("results").style.display = "none";  // Hide results table
    document.getElementById("appointment-modal").style.display = "none"; // Hide modal if open
});

document.getElementById("appointments-toggle").addEventListener("click", function() {
    document.getElementById("search").style.display = "none"; // Hide search section
    document.getElementById("appointments-toggle").style.fontWeight = "bold";  // Highlight current menu item
    document.getElementById("search-toggle").style.fontWeight = "normal";  // Unhighlight the other menu item
    document.getElementById("appointment-modal").style.display = "block"; // Show modal
});

// Search button event listener
document.getElementById("search-button").addEventListener("click", async () => {
    const medical_condition = document.getElementById("medical_condition").value.toLowerCase();
    const doctor = document.getElementById("doctor").value.toLowerCase();
    const hospital = document.getElementById("hospital").value.toLowerCase();
    const insurance_provider = document.getElementById("insurance_provider").value.toLowerCase();
    const location = document.getElementById("location").value.toLowerCase();

    try {
        const response = await fetch("http://127.0.0.1:3000/api/providers");
        if (!response.ok) {
            throw new Error("Failed to fetch providers");
        }
  
        const providers = await response.json();
  
        // Filter results based on the search input
        const filteredProviders = providers.filter(provider => 
            provider.medical_condition.toLowerCase().includes(medical_condition) &&
            provider.doctor.toLowerCase().includes(doctor) &&
            provider.hospital.toLowerCase().includes(hospital) &&
            provider.insurance_provider.toLowerCase().includes(insurance_provider) &&
            provider.location.toLowerCase().includes(location)

        );
  
        // Display the results in the table
        const tableBody = document.getElementById("results-table").getElementsByTagName("tbody")[0];
        const noResultsMessage = document.getElementById("no-results");
        tableBody.innerHTML = ""; // Clear previous results
        noResultsMessage.style.display = "none"; // Hide the "No results" message

        if (filteredProviders.length === 0) {
            noResultsMessage.style.display = "block";
        } else {
            document.getElementById("results").style.display = "block";  // Show results section
            filteredProviders.forEach(provider => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${provider.medical_condition}</td>
                    <td>${provider.doctor}</td>
                    <td>${provider.hospital}</td>
                    <td>${provider.insurance_provider}</td>
                    <td>${provider.location}</td>                   
                    <td><a href="#" class="book-appointment-link" data-provider-id="${provider.id}">Book Appointment</a></td>
                `;
            });
        }
    } catch (error) {
        console.error("Error fetching providers:", error);
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = `<p>Error loading data. Please try again later.</p>`;
    }
});

// Open the modal when "Book Appointment" is clicked
document.addEventListener("click", function(event) {
    if (event.target && event.target.classList.contains("book-appointment-link")) {
        event.preventDefault(); // Prevent the default anchor behavior
        const providerId = event.target.getAttribute("data-provider-id");
        openModal(providerId);
    }
});

// Open the modal and store provider details
function openModal(providerId) {
    const row = document.querySelector(`[data-provider-id="${providerId}"]`).parentElement.parentElement;
    selectedProvider = {
        medical_condition: row.cells[0].textContent,
        doctor: row.cells[1].textContent,
        hospital: row.cells[2].textContent,
        insurance_provider: row.cells[3].textContent,
        location: row.cells[4].textContent,
    };
    document.getElementById("appointment-modal").style.display = "block"; // Show modal
}

// Close the modal when the close button or outside of the modal is clicked
document.getElementById("close-modal").addEventListener("click", closeModal);
window.addEventListener("click", function(event) {
    if (event.target === document.getElementById("appointment-modal")) {
        closeModal();
    }
});

// Close the modal
function closeModal() {
    document.getElementById("appointment-modal").style.display = "none"; // Hide modal
}

// Event listener for "Book Appointment" button
document.getElementById("book-appointment-button").addEventListener("click", async (event) => {
    event.preventDefault();

    // Gather form data
    const appointmentData = {
        full_name: document.getElementById("full-name").value,
        age: parseInt(document.getElementById("age").value.trim(), 10), // Convert to integer
        gender: document.getElementById("gender").value,
        blood_group: document.getElementById("blood-group").value,
        phone_number: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        urgency: document.getElementById("urgency").value,
        ...selectedProvider, // Include the selected provider details
    };
        alert(JSON.stringify(appointmentData));
    try {
        const response = await fetch("http://127.0.0.1:3000/api/save_appointment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(appointmentData),
        });

        if (response.ok) {
            alert("Appointment booked successfully!");
            closeModal(); // Close modal after successful booking
        } else {
            const error = await response.text();
            alert("Error booking appointment: " + error);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while saving the appointment.");
    }
});
