// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

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
const database = getDatabase(app);

// Initialize Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyDe-HxyBqtzid8KAnfEeQflT6qVucx1_iY");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// UI Elements
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const modeCheckbox = document.getElementById('mode-checkbox');
const toggleLabel = document.getElementById('toggle-label');

const alertDeviceRef = ref(database, 'AlertDevice/isalert');
const commandRef = ref(database, 'command');  // Reference for the command node

// Initialize the toggle state
modeCheckbox.addEventListener('change', () => {
    toggleLabel.textContent = modeCheckbox.checked ? 'Activate VIVA' : 'Activate Personal';
});

// Function to toggle alert device
function AlertTrue() {
    onValue(alertDeviceRef, (snapshot) => {
        set(alertDeviceRef, true); // Update the value in Firebase
    }, { onlyOnce: true });
}

function AlertFalse() {
    onValue(alertDeviceRef, (snapshot) => {
        set(alertDeviceRef, false); // Update the value in Firebase
    }, { onlyOnce: true });
}

// Function to lock the device
function commandDevice(command) {
    set(commandRef, {
        comm: command
    }).then(() => {
        console.log("Done");
    }).catch((error) => {
        console.error("Error sending command:", error);
    });
}

// Type message function
function typeMessage(message, isUser) {
    return new Promise(resolve => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isUser ? 'user' : 'bot');

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        messageElement.appendChild(bubble);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        let index = 0;
        const typingInterval = setInterval(() => {
            if (index < message.length) {
                bubble.innerHTML += message.charAt(index);
                index++;
            } else {
                clearInterval(typingInterval);
                resolve();
            }
        }, 1);
    });
}

// Function to handle user message
async function handleUserMessage() {
    const message = userInput.value.trim().toLowerCase();
    if (message === '') return;

    userInput.value = '';

    await typeMessage(message, true); // Display user message

    if ([('stop alert')].includes(message)) {
        AlertFalse();
        await typeMessage('Stopping Alert...', false);
        return;
    }

    if (['alert', 'ring', 'volume up'].includes(message)) {
        AlertTrue();
        await typeMessage('Starting Alert...', false);
        return;
    }

    if (message === 'lock') {
        // Lock the device when the command is 'lock'
        commandDevice('lock_device');

        // Wait for 1 second before checking the status
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Now check the 'done' status after 1 second
        const commandRef = ref(database, 'command/comm');
        const snapshot = await get(commandRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data == 'done') {
                await typeMessage('Device Locked sucessfully...', false);
            } else {
                await typeMessage('Unable to lock the device...', false);
            }
        } else {
            await typeMessage('No response from the device...', false);
        }

        return;
    }



    if (message === 'unblock screen') {
        // Lock the device when the command is 'lock'
        commandDevice('unblock_screen');

        await typeMessage("Screen Unblocked!");
        return;
    }




    if (message === 'block screen') {
        // Lock the device when the command is 'lock'
        commandDevice('block_screen');

        await typeMessage("Screen Blocked!");

        return;
    }


    const numberMatch = message.match(/^call (\d+)$/);
    if (numberMatch) {
        const number = numberMatch[1];
        const command = `call_${number}`;
        commandDevice(command);
        await typeMessage(`Calling ${number}...`, false);
        return;
    }

    // Handle 'call <name>' command
    const nameMatch = message.match(/^call (\w+)$/);
    if (nameMatch) {
        const name = nameMatch[1];
        const command = `call_${name}`;
        commandDevice(command);
        await typeMessage(`Calling ${name}...`, false);
        return;
    }

    if (message === 'on wifi') {
        commandDevice('on_wifi');  // Lock the device when the command is 'lock'
        await typeMessage('Turning on the wifi', false);
        return;
    }

    if (message === 'mute') {
        commandDevice('mute_device');  // Lock the device when the command is 'lock'
        await typeMessage('Muting the device...', false);
        return;
    }

    if (message == 'volume up') {
        commandDevice('unmute_device');  // Lock the device when the command is 'lock'
        await typeMessage('Unmuting the device...', false);
        return;
    }

    if (message === 'flashlight on' || message === 'torch on') {
        commandDevice('torch_on');
        await typeMessage('Turning on flashlight...', false);
        return;
    }

    // 8. Turn off flashlight
    if (message === 'flashlight off' || message === 'torch off') {
        commandDevice('torch_off');
        await typeMessage('Turning off flashlight...', false);
        return;
    }

    if (message === 'brightness up') {
        commandDevice('increase_brightness');
        await typeMessage('Increasing screen brightness...', false);
        return;
    }

    // 13. Decrease screen brightness
    if (message === 'brightness down') {
        commandDevice('decrease_brightness');
        await typeMessage('Decreasing screen brightness...', false);
        return;
    }

    if (message === 'airplane mode on') {
        commandDevice('airplane_mode_on');
        await typeMessage('Turning on airplane mode...', false);
        return;
    }

    // 15. Airplane mode off
    if (message === 'airplane mode off') {
        commandDevice('airplane_mode_off');
        await typeMessage('Turning off airplane mode...', false);
        return;
    }

    if (message === 'lock rotation') {
        commandDevice('lock_rotation');
        await typeMessage('Locking screen rotation...', false);
        return;
    }

    // 18. Unlock screen rotation
    if (message === 'unlock rotation') {
        commandDevice('unlock_rotation');
        await typeMessage('Unlocking screen rotation...', false);
        return;
    }

    if (message === 'enable dnd' || message === 'do not disturb on') {
        commandDevice('enable_dnd');
        await typeMessage('Enabling Do Not Disturb...', false);
        return;
    }

    // 2. Disable Do Not Disturb
    if (message === 'disable dnd' || message === 'do not disturb off') {
        commandDevice('disable_dnd');
        await typeMessage('Disabling Do Not Disturb...', false);
        return;
    }

    // 3. Clear notifications
    if (message === 'clear notifications') {
        commandDevice('clear_notifications');
        await typeMessage('Clearing all notifications...', false);
        return;
    }

    if (message === 'enable battery saver') {
        commandDevice('enable_battery_saver');
        await typeMessage('Turning on battery saver...', false);
        return;
    }

    // 16. Turn off battery saver
    if (message === 'disable battery saver') {
        commandDevice('disable_battery_saver');
        await typeMessage('Turning off battery saver...', false);
        return;
    }


    if (message === 'send message') {
        commandDevice('send_message');
        await typeMessage('Turning off battery saver...', false);
        return;
    }


    let context = '';
    if (modeCheckbox.checked) {
        context = await getFirebaseContext();
    }

    const response = await processUserInput(message, context);
    const formatted_res = processText(response);
    await typeMessage(formatted_res, false);
}

function processText(text) {
    let formattedText = text.trim();

    if (formattedText.match(/<\/strong>:<br>/)) {
        formattedText = formattedText
            .replace(/<br>/g, '\n')
            .replace(/<\/?strong>/g, '')
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/(\w+):\n/g, '\n$1:\n')
            .trim();
    } else if (formattedText.includes("\n")) {
        formattedText = formattedText
            .replace(/\n+/g, '\n')
            .replace(/^(\d+\.|\-|\•)/gm, (match) => `<li>${match.trim()}</li>`)
            .replace(/\n/g, '\n- ')
            .trim();
    } else {
        formattedText = formattedText
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return formattedText;
}

// Function to process user input and generate response
async function processUserInput(userInput, context) {
    try {
        const prompt = context ? `${context}. User: ${userInput}` : userInput;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let processedText = await response.text();

        const boldWordsRegex = /\*\*(.*?)\*\*/g;
        processedText = processedText.replace(boldWordsRegex, '<br><strong>$1</strong>:<br>');
        processedText = processedText.replace(/\*\*/g, '');

        return processedText;
    } catch (error) {
        console.error('Error generating content:', error);
        return 'Sorry, something went wrong.';
    }
}

// Function to fetch context data from Firebase
async function getFirebaseContext() {
    try {
        const snapshot = await get(ref(database, 'VIVALoca'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const contextArray = Object.entries(data).map(([key, value]) => `${key}: ${value}`);
            return contextArray.join('\n\n');
        } else {
            console.error('No data available in VIVALoca');
            return '';
        }
    } catch (error) {
        console.error('Error fetching Firebase data:', error);
        return '';
    }
}

// Event listeners
sendButton.addEventListener('click', handleUserMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleUserMessage();
    }
});
