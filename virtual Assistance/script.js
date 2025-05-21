let btn = document.querySelector('#btn');
let content = document.querySelector('#content');
let voice = document.querySelector('#voice');
let responseText = document.querySelector('#response-text');
let historyBtn = document.querySelector('#history-btn');
let historyModal = document.querySelector('#history-modal');
let closeBtn = document.querySelector('.close-btn');
let historyList = document.querySelector('#history-list');
let themeIcon = document.querySelector('#theme-icon');
let html = document.documentElement;

// Store conversation history
let conversationHistory = [];
// Track current language (default to English)
let currentLanguage = 'en';

function speak(text) {
    // Show the text with typing animation
    typeResponse(text);
    
    let text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.pitch = 1;
    text_speak.volume = 1;
    
    // Set language based on detected language
    if (currentLanguage === 'hi') {
        text_speak.lang = "hi-IN";
    } else {
        text_speak.lang = "en-GB";
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(text_speak);
    } else {
        console.log('Speech synthesis is not supported in this browser.');
    }
}

// Typing animation for response
function typeResponse(text) {
    responseText.textContent = '';
    responseText.classList.add('typing');
    
    let i = 0;
    const typingInterval = setInterval(() => {
        if (i < text.length) {
            responseText.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
            responseText.classList.remove('typing');
        }
    }, 30);
}

function wishMe() {
    let day = new Date();
    let hours = day.getHours();
    let greeting = '';
    
    if (currentLanguage === 'hi') {
        if (hours >= 0 && hours < 12) {
            greeting = "सुप्रभात, मैं आपकी कैसे सहायता कर सकती हूँ?";
        } else if (hours >= 12 && hours < 16) {
            greeting = "नमस्कार, मैं आपकी कैसे सहायता कर सकती हूँ?";
        } else {
            greeting = "शुभ संध्या, मैं आपकी कैसे सहायता कर सकती हूँ?";
        }
    } else {
        if (hours >= 0 && hours < 12) {
            greeting = "Good Morning Sir";
        } else if (hours >= 12 && hours < 16) {
            greeting = "Good Afternoon Sir";
        } else {
            greeting = "Good Evening Sir";
        }
    }
    
    speak(greeting);
    return greeting;
}

// Initialize when window loads
window.addEventListener('load', () => {
    const greeting = wishMe();
    // Add first interaction to history
    addToHistory("(Assistant startup)", greeting);
});

let speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new speechRecognition();

// Function to detect language and set recognition language
function detectLanguage(text) {
    // Simple language detection - check if text contains Devanagari script
    const hindiPattern = /[\u0900-\u097F]/; // Unicode range for Devanagari script
    
    if (hindiPattern.test(text)) {
        currentLanguage = 'hi';
        recognition.lang = 'hi-IN';
        return 'hi';
    } else {
        currentLanguage = 'en';
        recognition.lang = 'en-US';
        return 'en';
    }
}

recognition.onresult = (event) => {
    let currentIndex = event.resultIndex;
    let transcript = event.results[currentIndex][0].transcript;
    content.innerText = transcript;
    
    // Detect language from input
    detectLanguage(transcript);
    
    takeCommand(transcript.toLowerCase());
};

btn.addEventListener("click", () => {
    recognition.start();
    btn.style.display = "none";
    voice.style.display = "block";
    responseText.textContent = currentLanguage === 'hi' ? "सुन रही हूँ..." : "Listening...";
});

// Add to history function
function addToHistory(query, response) {
    const historyItem = {
        query: query,
        response: response,
        timestamp: new Date().toLocaleString()
    };
    
    conversationHistory.unshift(historyItem); // Add to beginning of array
    
    // Limit history to last 20 conversations
    if (conversationHistory.length > 20) {
        conversationHistory.pop();
    }
    
    // Save to local storage
    localStorage.setItem('shifraHistory', JSON.stringify(conversationHistory));
}

// Load history from local storage
function loadHistory() {
    const savedHistory = localStorage.getItem('shifraHistory');
    if (savedHistory) {
        conversationHistory = JSON.parse(savedHistory);
    }
}

// Display history in modal
function displayHistory() {
    historyList.innerHTML = '';
    
    if (conversationHistory.length === 0) {
        historyList.innerHTML = '<li>No conversation history yet</li>';
        return;
    }
    
    conversationHistory.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="timestamp">${item.timestamp}</span>
            <span class="user-query"><strong>You:</strong> ${item.query}</span>
            <span class="assistant-response"><strong>Shifra:</strong> ${item.response}</span>
        `;
        historyList.appendChild(li);
    });
}

// History button click
historyBtn.addEventListener('click', () => {
    displayHistory();
    historyModal.style.display = 'block';
});

// Close modal
closeBtn.addEventListener('click', () => {
    historyModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

// Theme toggle
themeIcon.addEventListener('click', () => {
    if (html.className === 'dark-mode') {
        html.className = 'light-mode';
        themeIcon.className = 'fas fa-sun';
    } else {
        html.className = 'dark-mode';
        themeIcon.className = 'fas fa-moon';
    }
});

// Get weather data
async function getWeather(city) {
    try {
        const apiKey = 'YOUR_API_KEY'; // Replace with your actual OpenWeatherMap API key
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        const temp = data.main.temp;
        const description = data.weather[0].description;
        
        if (currentLanguage === 'hi') {
            return `${city} में मौसम वर्तमान में ${description} है और तापमान ${temp}°C है।`;
        } else {
            return `The weather in ${city} is currently ${description} with a temperature of ${temp}°C.`;
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
        return currentLanguage === 'hi' 
            ? "क्षमा करें, मैं इस समय मौसम की जानकारी नहीं प्राप्त कर सकती।" 
            : "Sorry, I couldn't fetch the weather information at the moment.";
    }
}

// Translations for common responses
const translations = {
    greeting: {
        en: "Hello Sir, what can I help you with?",
        hi: "नमस्ते, मैं आपकी क्या सहायता कर सकती हूँ?"
    },
    whoAreYou: {
        en: "I am a virtual assistant, created by Dheeraj Sonkar.",
        hi: "मैं एक आभासी सहायक हूं, जिसे धीरज सोनकर द्वारा बनाया गया है।"
    },
    name: {
        en: "I am Sipra, your personal virtual assistant.",
        hi: "मैं शिप्रा हूं, आपकी व्यक्तिगत आभासी सहायक।"
    },
    opening: {
        en: "Opening",
        hi: "खोल रही हूं"
    },
    joke: [
        {
            en: "Why don't scientists trust atoms? Because they make up everything!",
            hi: "वैज्ञानिक परमाणुओं पर भरोसा क्यों नहीं करते? क्योंकि वे सब कुछ बना देते हैं!"
        },
        {
            en: "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
            hi: "क्या आपने उस गणितज्ञ के बारे में सुना है जो नकारात्मक संख्याओं से डरता है? उन्हें बचाने के लिए वह कुछ भी करेगा!"
        },
        {
            en: "Why did the scarecrow win an award? Because he was outstanding in his field!",
            hi: "भूसे का पुतला को पुरस्कार क्यों मिला? क्योंकि वह अपने क्षेत्र में उत्कृष्ट था!"
        }
    ],
    historyCleared: {
        en: "Conversation history has been cleared.",
        hi: "वार्तालाप इतिहास साफ कर दिया गया है।"
    },
    themeChanged: {
        en: "Changed to",
        hi: "बदल दिया गया"
    },
    lightTheme: {
        en: "light theme.",
        hi: "हल्के थीम में।"
    },
    darkTheme: {
        en: "dark theme.",
        hi: "गहरे थीम में।"
    },
    searchResult: {
        en: "This is what I found on the internet regarding",
        hi: "यह मुझे इंटरनेट पर इसके बारे में मिला"
    }
};

function takeCommand(message) {
    btn.style.display = "flex";
    voice.style.display = "none";
    
    let response = "";
    
    // Detect language from the message
    detectLanguage(message);
    
    if (message.includes("hello") || message.includes("hey") || message.includes("नमस्ते") || message.includes("हैलो")) {
        response = translations.greeting[currentLanguage];
        speak(response);
    } else if (message.includes("who are you") || message.includes("तुम कौन हो") || message.includes("आप कौन हैं")) {
        response = translations.whoAreYou[currentLanguage];
        speak(response);
    } else if (message.includes("what's your name") || message.includes("तुम्हारा नाम क्या है") || message.includes("आपका नाम क्या है")) {
        response = translations.name[currentLanguage];
        speak(response);
    } else if (message.includes("open youtube") || message.includes("यूट्यूब खोलो")) {
        response = `${translations.opening[currentLanguage]} YouTube...`;
        speak(response);
        window.open("https://www.youtube.com");
    } else if (message.includes("open google") || message.includes("गूगल खोलो")) {
        response = `${translations.opening[currentLanguage]} Google...`;
        speak(response);
        window.open("https://www.google.com");
    } else if (message.includes("open instagram") || message.includes("इंस्टाग्राम खोलो")) {
        response = `${translations.opening[currentLanguage]} Instagram...`;
        speak(response);
        window.open("https://www.instagram.com");
    } else if (message.includes("open whatsapp") || message.includes("व्हाट्सएप खोलो")) {
        response = `${translations.opening[currentLanguage]} WhatsApp...`;
        speak(response);
        window.open("https://web.whatsapp.com");
    } else if (message.includes("open facebook") || message.includes("फेसबुक खोलो")) {
        response = `${translations.opening[currentLanguage]} Facebook...`;
        speak(response);
        window.open("https://www.facebook.com");
    } else if (message.includes("open calculator") || message.includes("कैलकुलेटर खोलो")) {
        response = `${translations.opening[currentLanguage]} Calculator...`;
        speak(response);
        window.open("calculator://");
    } else if (message.includes("time") || message.includes("समय") || message.includes("क्या समय हुआ है")) {
        let time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        response = currentLanguage === 'hi' ? `अभी समय है ${time}` : `The time is ${time}`;
        speak(response);
    } else if (message.includes("date") || message.includes("तारीख") || message.includes("दिनांक")) {
        let date = new Date().toLocaleString(currentLanguage === 'hi' ? 'hi-IN' : 'en-US', 
            { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        response = currentLanguage === 'hi' ? `आज है ${date}` : `Today is ${date}`;
        speak(response);
    } else if (message.includes("weather") || message.includes("मौसम")) {
        // Extract city name from the message
        let city = currentLanguage === 'hi' ? "दिल्ली" : "Delhi"; // Default city
        
        if (currentLanguage === 'hi') {
            const cityMatchHindi = message.match(/मौसम\s+(.+?)(?:\s+में|\s+का|$)/);
            if (cityMatchHindi && cityMatchHindi[1]) {
                city = cityMatchHindi[1].trim();
            }
        } else {
            const cityMatch = message.match(/weather in ([a-zA-Z\s]+)/);
            if (cityMatch && cityMatch[1]) {
                city = cityMatch[1].trim();
            }
        }
        
        // Get weather data
        getWeather(city).then(weatherInfo => {
            speak(weatherInfo);
            addToHistory(message, weatherInfo);
        });
        
        return; // Return early as we're handling the response asynchronously
    } else if (message.includes("tell me a joke") || message.includes("joke") || message.includes("चुटकुला") || message.includes("जोक")) {
        const jokeIndex = Math.floor(Math.random() * translations.joke.length);
        response = translations.joke[jokeIndex][currentLanguage];
        speak(response);
    } else if (message.includes("clear history") || message.includes("इतिहास साफ करो")) {
        conversationHistory = [];
        localStorage.removeItem('shifraHistory');
        response = translations.historyCleared[currentLanguage];
        speak(response);
    } else if (message.includes("change theme") || message.includes("थीम बदलो")) {
        if (html.className === 'dark-mode') {
            html.className = 'light-mode';
            themeIcon.className = 'fas fa-sun';
            response = `${translations.themeChanged[currentLanguage]} ${translations.lightTheme[currentLanguage]}`;
        } else {
            html.className = 'dark-mode';
            themeIcon.className = 'fas fa-moon';
            response = `${translations.themeChanged[currentLanguage]} ${translations.darkTheme[currentLanguage]}`;
        }
        speak(response);
    } else {
        // Web search for other queries
        let query = message
            .replace("shipra", "")
            .replace("shifra", "")
            .replace("शिप्रा", "");
            
        response = `${translations.searchResult[currentLanguage]} ${query}`;
        speak(response);
        window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }
    
    // Add to history (if not already handled by async functions)
    if (response) {
        addToHistory(message, response);
    }
}

// Load history on startup
loadHistory();

