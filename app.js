import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqbN85D9YioADOiVMW6f34Rkyhlr1SjPQ",
    authDomain: "viva-smarts-project.firebaseapp.com",
    databaseURL: "https://viva-smarts-project-default-rtdb.firebaseio.com",
    projectId: "viva-smarts-project",
    storageBucket: "viva-smarts-project.appspot.com",
    messagingSenderId: "719723351731",
    appId: "1:719723351731:web:0e4db74ceb6f05f561eac6",
    measurementId: "G-6T73ES0WQX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dataRef = ref(db, 'VIVALoca');
const silentModeRef = ref(db, 'VIVALoca/Silent Mode');
const alertDeviceRef = ref(db, 'AlertDevice/isalert'); // New reference for alert device

// Update the UI with the retrieved data
function updateData(data) {
    const container = document.getElementById('data-container');
    container.innerHTML = ''; // Clear previous content

    for (const [key, value] of Object.entries(data)) {
        const card = document.createElement('div');
        card.classList.add('card');

        const title = document.createElement('div');
        title.classList.add('card-title');
        title.textContent = key;

        const content = document.createElement('div');
        content.classList.add('card-content');

        // Special handling for the Google Map link
        if (key === 'google_map_link') {
            content.innerHTML = `<a class="google-map-link" href="${value}" target="_blank">View on Google Maps</a>`;
        } else if (key === 'Battery Percentage') {
            // Handle battery percentage as a visual bar
            content.innerHTML = `
                <div class="battery">
                    <div class="battery-level" style="width: ${value};">${value}</div>
                </div>`;
        } else if (key === 'Charging Status' && value.toLowerCase() === 'charging') {
            // Handle charging status with a lightning animation
            content.innerHTML = `<div class="charging-status">⚡ Charging</div>`;
        } else {
            // Handle other content with a fixed height for truncation
            content.textContent = value;
        }

        card.appendChild(title);
        card.appendChild(content);
        container.appendChild(card);
    }
}

// Function to toggle the silent mode
function toggleSilentMode() {
    onValue(silentModeRef, (snapshot) => {
        const currentValue = snapshot.val();
        const newValue = currentValue === 'Silent' ? 'Not Silent' : 'Silent';
        set(silentModeRef, newValue); // Update the value in Firebase
    }, { onlyOnce: true });
}

// Update the silent mode button UI based on the current state
function updateSilentModeButton(state) {
    const silentModeBtn = document.getElementById('silent-mode-btn');
    if (state === 'Silent') {
        silentModeBtn.textContent = '🔕';
    } else {
        silentModeBtn.textContent = '🔔';
    }
}

// Listen for changes in the silent mode key
onValue(silentModeRef, (snapshot) => {
    const silentModeState = snapshot.val();
    updateSilentModeButton(silentModeState);
});

// Listen for changes in the overall Firebase data
onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    updateData(data);
});

// Handle user authentication and session
if (localStorage.getItem('loggedIn') !== 'true') {
    // Redirect to the login page if not logged in
    window.location.href = 'index.html';
}

// Logout function to clear session and redirect
function logout() {
    localStorage.removeItem('loggedIn'); // Clear the login status
    window.location.href = 'index.html'; // Redirect to the login page
}

// Add event listener to the silent mode button
document.getElementById('silent-mode-btn').addEventListener('click', toggleSilentMode);

// Function to toggle alert device
function toggleAlertDevice() {
    onValue(alertDeviceRef, (snapshot) => {
        const currentValue = snapshot.val();
        const newValue = !currentValue; // Toggle between true and false
        set(alertDeviceRef, newValue); // Update the value in Firebase
    }, { onlyOnce: true });
}

// Update the alert device button UI based on the current state
function updateAlertDeviceButton(state) {
    const alertDeviceBtn = document.getElementById('alert-device-btn');
    if (state) {
        alertDeviceBtn.textContent = 'Alert True';
    } else {
        alertDeviceBtn.textContent = 'Alert False';
    }
}

// Listen for changes in the alert device key
onValue(alertDeviceRef, (snapshot) => {
    const alertDeviceState = snapshot.val();
    updateAlertDeviceButton(alertDeviceState);
});

// Add event listener to the alert device button
document.getElementById('alert-device-btn').addEventListener('click', toggleAlertDevice);

const ramUsageRef = ref(db, 'VIVALoca/Ram Usage'); // Corrected reference for RAM usage

// Function to create and append the RAM usage card
function createRamUsageCard() {
    const dataContainer = document.getElementById('data-container');

    // Create card element
    const card = document.createElement('div');
    card.className = 'card';

    // Create title element
    const cardTitle = document.createElement('h2');
    cardTitle.className = 'card-title';
    cardTitle.textContent = 'RAM Usage';

    // Create canvas for Chart.js
    const canvas = document.createElement('canvas');
    canvas.id = 'ramUsageChart';

    // Append elements to card
    card.appendChild(cardTitle);
    card.appendChild(canvas);

    // Append card to data container
    dataContainer.appendChild(card);

    // Initialize Chart.js
    const ctx = canvas.getContext('2d');

    const ramUsageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Timestamps
            datasets: [{
                label: 'RAM Usage (%)',
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                data: [], // RAM usage values
                fill: true
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'realtime',
                    realtime: {
                        duration: 20000,
                        refresh: 1000,
                        delay: 2000,
                        onRefresh: function (chart) {
                            ramUsageRef.once('value').then(snapshot => {
                                const ramUsage = snapshot.val();
                                const now = Date.now();
                                if (ramUsage !== null) {
                                    chart.data.labels.push(now);
                                    chart.data.datasets[0].data.push(ramUsage);

                                    if (chart.data.labels.length > 20) {
                                        chart.data.labels.shift();
                                        chart.data.datasets[0].data.shift();
                                    }

                                    chart.update();
                                }
                            });
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: 100
                }
            }
        }
    });
}

// Call the function to create the RAM usage card when the page loads
window.onload = createRamUsageCard;
