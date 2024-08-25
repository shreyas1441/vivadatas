// Import the required Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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
const dbRef = ref(getDatabase(app));

document.getElementById('next-btn').addEventListener('click', handleNext);
document.getElementById('login-btn').addEventListener('click', handleLogin);

function handleNext() {
    const usernameInput = document.getElementById('username').value.trim();
    const promptText = document.getElementById('prompt');
    const passwordField = document.getElementById('password');
    const nextBtn = document.getElementById('next-btn');
    const loginBtn = document.getElementById('login-btn');

    // Fetch data from Firebase
    get(child(dbRef, `users`)).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.un === usernameInput) {
                promptText.textContent = 'Enter your password';
                document.getElementById('username').disabled = true;
                passwordField.style.display = 'block';
                nextBtn.style.display = 'none';
                loginBtn.style.display = 'block';
                passwordField.focus();
            } else {
                promptText.textContent = 'Username not found. Try again!';
                document.getElementById('username').value = '';
                document.getElementById('username').focus();
            }
        } else {
            promptText.textContent = 'No data available';
        }
    }).catch((error) => {
        promptText.textContent = 'Error fetching data: ' + error;
    });
}

function handleLogin() {
    const passwordInput = document.getElementById('password').value.trim();
    const promptText = document.getElementById('prompt');

    get(child(dbRef, `users`)).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.pas === passwordInput) {
                // Set a session token
                localStorage.setItem('loggedIn', 'true');
                window.location.href = 'home.html';  // Redirect to home page
            } else {
                promptText.textContent = 'Incorrect password. Try again!';
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }
        } else {
            promptText.textContent = 'No data available';
        }
    }).catch((error) => {
        promptText.textContent = 'Error fetching data: ' + error;
    });
}

