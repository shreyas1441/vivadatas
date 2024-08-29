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

const repeat_check = 30;
// UI Elements
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const modeCheckbox = document.getElementById('mode-checkbox');
const toggleLabel = document.getElementById('toggle-label');

const alertDeviceRef = ref(database, 'AlertDevice/isalert');
const commandRef = ref(database, 'command');  // Reference for the command node
const callcmd = ref(database, 'call');  // Reference for the command node

const abc = false;
let lastBubble = null;

const commandRef2 = ref(database, 'personaldata');  // Reference for the command node
// Initialize the toggle state

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
            console.log('ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.error('ServiceWorker registration failed:', error);
        });
}

// Request notification permission
Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
        console.log('Notification permission granted.');
    } else {
        console.log('Notification permission denied.');
    }
});




modeCheckbox.addEventListener('change', () => {
    toggleLabel.textContent = modeCheckbox.checked ? 'Activate VIVA' : 'Activate Personal';
});


// Trigger a push notification (for testing)
function sendTestNotification(call_name) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.getRegistration().then((registration) => {
            registration.showNotification('Incoming Call', {
                body: 'You have an incoming call from ' + call_name,
                icon: 'icon.png',
                actions: [
                    {
                        action: 'pick-up',
                        title: 'Pick Up Call'
                    },
                    {
                        action: 'end-call',
                        title: 'End Call'
                    }
                ],
                data: {
                    message: 'call_from'
                }
            });
        });
    }
}

setupDatabaseListener();

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

function commandCall(command) {
    set(callcmd, {
        call_name_no: command
    }).then(() => {
        console.log("Done");
    }).catch((error) => {
        console.error("Error sending command:", error);
    });
}

function extractNameOrNumber(input) {
    // Trim the input to remove any extra spaces at the beginning or end
    input = input.trim();

    // Check if the input starts with 'call'
    if (input.toLowerCase().startsWith('call')) {
        // Remove the 'call' keyword from the input
        const extracted = input.substring(4).trim();

        // Return the extracted name or number
        return extracted;
    } else {
        // If the input doesn't start with 'call', return null or handle as needed
        return null;
    }
}


function typeMessage2(message, isUser) {
    return new Promise(resolve => {
        // Create the message element
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isUser ? 'user' : 'bot');

        // Create the bubble element with a new background color
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.style.backgroundColor = isUser ? '#00000000' : '#00000000'; // Blue for user, green for bot
        bubble.style.color = 'white'; // Text color
        bubble.style.padding = '10px'; // Padding inside the bubble
        bubble.style.borderRadius = '15px'; // Rounded corners
        bubble.style.maxWidth = '60%'; // Limit the width of the bubble
        bubble.style.position = 'relative'; // Position relative for typing effect

        // Append the bubble to the message element
        messageElement.appendChild(bubble);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Initialize the typing effect
        let index = 0;
        const typingInterval = setInterval(() => {
            if (index < message.length) {
                // Adding text character by character
                bubble.innerHTML += message.charAt(index);

                // Create a typing animation with fade-in effect
                bubble.style.opacity = 0;
                bubble.style.transition = 'opacity 0.1s ease-in-out';
                bubble.style.opacity = 1;

                // Adding a "typing dot" effect during typing
                if (index % 3 === 0) {
                    bubble.innerHTML += '<span class="typing-dot">.</span>';
                }
                index++;
            } else {
                clearInterval(typingInterval);

                // Remove typing dots after completion
                bubble.innerHTML = message;
                resolve();
            }
        }, 50); // Adjust the speed for more effect
    });
}



async function typeMessage(message, isUser, update = false) {
    return new Promise(resolve => {
        if (update && lastBubble) {
            // Update existing bubble with futuristic animation
            const bubble = lastBubble.querySelector('.bubble');
            bubble.classList.remove('glow');
            bubble.classList.add('update');
            bubble.innerHTML = message;

            // Remove the class after animation ends to prevent repeated animations
            bubble.addEventListener('animationend', () => {
                bubble.classList.remove('update');
                resolve();
            });
            return;
        }

        // Create new message bubble
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isUser ? 'user' : 'bot');

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.classList.add('glow'); // Add glow effect initially
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
                lastBubble = messageElement; // Track the last bubble
                resolve();
            }
        }, 5); // Adjust speed as needed
    });
}

async function generateAndSaveKeyword(message) {
    // Generate keyword using the model
    const result = await model.generateContent("For this user input:- " + message + ", generate and return a 'keyword' only using nouns separated, for example suppose user input as 'My birthdate is on 5th march' so in this example keyword is 'my_birthday', likewise extract the keyword from --> '" + message + "'");
    const response = await result.response;
    let processedText = await response.text(); // The generated keyword

    // Save the message with the generated keyword
    const keyword = processedText.trim();

    // Get the existing data from the database
    const existingDataSnapshot = await get(commandRef2);
    const existingData = existingDataSnapshot.val() || {};

    // Add the new data without deleting the previous data
    const updatedData = {
        ...existingData,
        [keyword]: message
    };

    set(commandRef2, updatedData)
        .then(() => {
            console.log("Message saved with keyword:", keyword);
        })
        .catch((error) => {
            console.error("Error saving message:", error);
        });
}


function setupDatabaseListener() {
    const commandRef = ref(database, 'command/comm');

    onValue(commandRef, (snapshot) => {
        const commandStatus = snapshot.val();
        console.log('Command Status:', commandStatus); // For debugging

        if (commandStatus === 'call_received') {
            sendTestNotification("Mom");
            commandDevice("call_notification_sent");
        }
    }, {
        onlyOnce: false // Keep listening to changes
    });
}


// Function to handle user message
async function handleUserMessage() {
    const message = userInput.value.trim().toLowerCase();
    if (message === '') return;

    userInput.value = '';



    await typeMessage(message, true); // Display user message


    const result = await model.generateContent(
        "Consider the user input: '" + message + "'.\n" + " For example only:" +
        "1. If the input is a direct question (e.g., 'What is your name?' or 'Is it raining today?'), respond with 'yes'.\n" +
        "2. If the input contains personal information about the user or another person, and it is not a question containing WH-words like 'who, what, where, when, why, how', respond with 'no'. For example:\n" +
        "   - 'My name is John.' should return 'no'.\n" +
        "   - 'I live in New York.' should return 'no'.\n" +
        "   - 'When is your birthday?' should return 'yes'.\n" +
        "   - 'How old are you?' should return 'yes'.\n" +
        "Please follow these rules strictly and return only 'yes' or 'no' based on the conditions above."
    );



    const response3 = await result.response;
    let processedText = await response3.text();






    if (processedText.trim() === 'yes') {
        //typeMessage("The user input is a question.", true);
        // Add your code here to handle the case when the input is a question.
    } else if (processedText.trim() === 'no') {
        //typeMessage("The user input contains personal information.", true);
        typeMessage2('Saving data', true);
        generateAndSaveKeyword(message);
        // Add your code here to handle the case when the input contains personal information.
    } else {
        typeMessage("Unexpected response:", processedText, true);
        // Handle unexpected responses if needed.
    }


    if ([('stop alert')].includes(message)) {
        AlertFalse();
        await typeMessage('Stopping Alert...', false);
        return;
    }

    if (['start alert', 'start ring'].includes(message)) {
        AlertTrue();
        await typeMessage('Starting Alert...', false);
        return;
    }


    if (message === 'volume up the device') {
        commandDevice('unmute');

        await typeMessage("Making Contact with device, sending command, taking feedback", false);

        let successMessageSent = false;

        for (let i = 0; i < repeat_check; i++) {
            await new Promise(resolve => setTimeout(resolve, i * 1000)); // Delay between each check

            const commandRef = ref(database, 'command/comm');
            const snapshot = await get(commandRef);
            const commandStatus = snapshot.val();

            if (commandStatus === 'done_volume_up') {
                if (!successMessageSent) {
                    await typeMessage('Unmuted successfully...', false, true);
                    successMessageSent = true;
                }
                break; // Exit the loop if unmuting is successful
            }
        }

        if (!successMessageSent) {
            // Only send this message if the success message was not sent
            await typeMessage('Unable to Unmute the device, Try Again', false, true);
            commandDevice("error");

        }

        return;
    }



    if (message.toLowerCase().startsWith('call')) {
        const extracted = message.substring(4).trim();
        typeMessage("Calling " + extracted, false, false);
        commandCall(extracted);
        return;
    }

    if (message === 'mute the device') {
        commandDevice('silent');


        await typeMessage("Making Contact with device, sending command, taking feedback", false);

        let successMessageSent = false;

        for (let i = 0; i < repeat_check; i++) {
            await new Promise(resolve => setTimeout(resolve, i * 100)); // Delay between each check

            const commandRef = ref(database, 'command/comm');
            const snapshot = await get(commandRef);
            const commandStatus = snapshot.val();

            if (commandStatus === 'done_silent') {
                if (!successMessageSent) {
                    await typeMessage('Muted successfully...', false, true);
                    successMessageSent = true;
                }
                break; // Exit the loop if muting is successful
            }
        }

        if (!successMessageSent) {
            // Only send this message if the success message was not sent
            await typeMessage('Unable to Mute the device, Try Again', false, true);
            commandDevice("error");
        }

        return;
    }


    if (message === 'unblock screen') {
        commandDevice('unblock_screen');

        await typeMessage("Making Contact with device, sending command, taking feedback", false);

        let successMessageSent = false;

        for (let i = 0; i < repeat_check; i++) {
            await new Promise(resolve => setTimeout(resolve, i * 100)); // Delay between each check

            const commandRef = ref(database, 'command/comm');
            const snapshot = await get(commandRef);
            const commandStatus = snapshot.val();

            if (commandStatus === 'done_unblock') {
                if (!successMessageSent) {
                    await typeMessage('Screen Unblocked successfully...', false, true);
                    successMessageSent = true;
                }
                break; // Exit the loop if muting is successful
            }
        }

        if (!successMessageSent) {
            // Only send this message if the success message was not sent
            await typeMessage('Unable to Unblock the screen, Try Again', false, true);
            commandDevice("error");
        }

        return;
    }



    if (message === 'block screen') {
        commandDevice('block_screen');

        await typeMessage("Making Contact with device, sending command, taking feedback", false);

        let successMessageSent = false;

        for (let i = 0; i < repeat_check; i++) {
            await new Promise(resolve => setTimeout(resolve, i * 100)); // Delay between each check

            const commandRef = ref(database, 'command/comm');
            const snapshot = await get(commandRef);
            const commandStatus = snapshot.val();

            if (commandStatus === 'done_block') {
                if (!successMessageSent) {
                    await typeMessage('Screen Blocked successfully...', false, true);
                    successMessageSent = true;
                }
                break; // Exit the loop if muting is successful
            }
        }

        if (!successMessageSent) {
            // Only send this message if the success message was not sent
            await typeMessage('Unable to Block the screen, Try Again', false, true);
            commandDevice("error");
        }

        return;
    }




    if (message === 'lock device') {
        commandDevice('lock_device');


        await typeMessage("Making Contact with device, sending command, taking feedback", false);


        let successMessageSent = false;

        for (let i = 0; i < repeat_check; i++) {
            await new Promise(resolve => setTimeout(resolve, i * 100)); // Delay between each check

            const commandRef = ref(database, 'command/comm');
            const snapshot = await get(commandRef);
            const commandStatus = snapshot.val();

            if (commandStatus === 'done_lock') {
                if (!successMessageSent) {
                    await typeMessage('Device Locked successfully...', false, true);
                    successMessageSent = true;
                }
                break; // Exit the loop if muting is successful
            }
        }

        if (!successMessageSent) {
            // Only send this message if the success message was not sent
            await typeMessage('Unable to Lock the Device, Try Again', false, true);
            commandDevice("error");
        }

        return;
    }












    let context = '';
    let data = '';
    let final_data = '';
    if (modeCheckbox.checked) {
        context = await getFirebaseContext();
        data = await getFirebasePersonal();
        final_data = context + data;

    }
    else {
        final_data = "search anywhere on web"
    }

    const response = await processUserInput(message, final_data);
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

        const result = await model.generateContent("Using the context data: '" + context + "', and the user question: '" + userInput + "', analyze the context to provide a relevant and accurate reply. The context always contains the answer to the user's question, but the question may be asked directly or indirectly. Ensure that your response is humanized and appropriately reflects the context, even if the relationship between the context and the question is indirect. Use complete context to reply");


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


async function getFirebasePersonal() {
    try {
        const snapshot = await get(ref(database, 'personaldata'));
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
