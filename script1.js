// DOM Elements
const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const educationLevelSelect = document.querySelector("#education-level");
const streamSelect = document.querySelector("#stream");

// Career Knowledge Base - This is our "training data"
const CAREER_KNOWLEDGE = {
  "10th": {
    streams: ["Science", "Commerce", "Arts", "Vocational"],
    prompts: {
      "Science": "The student is considering Science stream after 10th grade. Focus on explaining MPC (Maths, Physics, Chemistry) vs BiPC (Biology, Physics, Chemistry) options. Include: career paths, important subjects, and how to choose between them.",
      "Commerce": "The student is considering Commerce stream. Explain key subjects like Accountancy, Business Studies, and Economics. Discuss career options like CA, CS, CFA, and business management.",
      "Arts": "The student is considering Arts/Humanities stream. Highlight diverse subjects like History, Political Science, Psychology. Discuss career paths in law, civil services, social work, and creative fields.",
      "Vocational": "The student is considering Vocational courses. Explain skill-based options like ITI, polytechnic, and other diploma programs with job prospects."
    },
    examples: {
      "Science": `**Excellent Response for Science Stream Query:**
      After 10th grade, Science stream offers two main branches:
      
      1. **MPC (Maths, Physics, Chemistry)**
      - Career Paths: Engineering, Architecture, Pure Sciences
      - Key Exams: JEE Main, JEE Advanced, BITSAT
      - Top Colleges: IITs, NITs, BITS Pilani
      
      2. **BiPC (Biology, Physics, Chemistry)**
      - Career Paths: Medical (MBBS), Pharmacy, Biotechnology
      - Key Exams: NEET, AIIMS, JIPMER
      - Top Colleges: AIIMS, CMC Vellore, AFMC`
    }
  },
  "12th": {
    streams: ["MPC", "BiPC", "CEC", "MEC", "HEC"],
    prompts: {
      "MPC": "The student is in 12th grade MPC stream (Maths, Physics, Chemistry). Provide detailed guidance on engineering fields, entrance exams, and alternative career options. Include emerging fields like AI, Data Science, and Robotics.",
      "BiPC": "The student is in 12th grade BiPC stream (Biology, Physics, Chemistry). Focus on medical and paramedical careers, research options, and alternative paths like biotechnology, pharmacy, and nutrition science.",
      "CEC": "The student is in 12th grade CEC stream (Commerce, Economics, Civics). Discuss traditional commerce careers (CA, CS) and modern options like business analytics, economics research, and financial planning.",
      "MEC": "The student is in 12th grade MEC stream (Maths, Economics, Commerce). Highlight careers in economics, statistics, actuarial science, and business management.",
      "HEC": "The student is in 12th grade HEC stream (History, Economics, Civics). Discuss careers in law, civil services, journalism, and social sciences."
    },
    examples: {
      "MPC": `**Engineering Options After 12th MPC:**
      
      1. **Computer Science Engineering**
      - Scope: AI, Cybersecurity, Software Development
      - Exams: JEE Main, BITSAT, COMEDK
      - Top Colleges: IIT Bombay, IIIT Hyderabad, BITS Pilani
      
      2. **Mechanical Engineering**
      - Scope: Automotive, Aerospace, Robotics
      - Exams: JEE Main, SRMJEEE, MET
      - Top Colleges: IIT Madras, NIT Trichy, DTU`
    }
  },
  "grad": {
    streams: ["Engineering", "Medicine", "Commerce", "Arts", "Science"],
    prompts: {
      "Engineering": "The student is an Engineering graduate. Provide guidance on specializations (MS, MTech), job market trends, higher education abroad (GRE requirements), and entrepreneurship opportunities.",
      "Medicine": "The student is a Medical graduate. Discuss specialization options (MD/MS), super-specialization, research opportunities, and alternative careers in healthcare management.",
      "Commerce": "The student is a Commerce graduate. Highlight options like MBA, professional courses (CA, CFA), corporate careers, and government job opportunities.",
      "Arts": "The student is an Arts graduate. Discuss options like civil services, law, journalism, social work, and creative arts careers.",
      "Science": "The student is a Science graduate. Provide guidance on research careers, MSc programs, interdisciplinary fields, and industry opportunities."
    },
    examples: {
      "Engineering": `**Career Paths After Engineering:**
      
      1. **Higher Education**
      - MS abroad: GRE (300+), TOEFL (100+)
      - Specializations: AI, Data Science, Robotics
      
      2. **Job Market**
      - Top Recruiters: Google, Microsoft, TCS
      - Average Salary: ₹6-12 LPA (fresh graduates)
      
      3. **Entrepreneurship**
      - Startup Incubators: IITs, IIITs
      - Government Schemes: Startup India`
    }
  }
};

// State variables
let userMessage = null;
let isResponseGenerating = false;
let currentEducationLevel = "";
let currentStream = "";
let conversationHistory = [];

// API configuration
const API_KEY = "AIzaSyD3ssXtYYNjWex-UQqOfVe36MPGc9W5h2A"; // Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  loadDataFromLocalstorage();
  setupEventListeners();
  setupEducationLevelSelector();
  updateSuggestions();
});

// Load saved data from local storage
function loadDataFromLocalstorage() {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  // Apply theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  // Load chat history
  if (savedChats) {
    chatContainer.innerHTML = savedChats;
    document.body.classList.add("hide-header");
  }

  chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

// Set up event listeners
function setupEventListeners() {
  // Form submission
  typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
  });

  // Theme toggle
  toggleThemeButton.addEventListener("click", toggleTheme);

  // Delete chat
  deleteChatButton.addEventListener("click", deleteChat);

  // Suggestion clicks
  suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
      userMessage = suggestion.querySelector(".text").innerText;
      handleOutgoingChat();
    });
  });
}

// Set up education level selector
function setupEducationLevelSelector() {
  educationLevelSelect.addEventListener("change", (e) => {
    currentEducationLevel = e.target.value;
    streamSelect.disabled = !currentEducationLevel;
    
    if (currentEducationLevel) {
      streamSelect.innerHTML = '<option value="">Select your stream</option>';
      CAREER_KNOWLEDGE[currentEducationLevel].streams.forEach(stream => {
        streamSelect.innerHTML += `<option value="${stream}">${stream}</option>`;
      });
    }
    
    updateSuggestions();
  });

  streamSelect.addEventListener("change", (e) => {
    currentStream = e.target.value;
    updateSuggestions();
  });
}

// Update suggestions based on education level and stream
function updateSuggestions() {
  const suggestionList = document.querySelector(".suggestion-list");
  
  if (!currentEducationLevel) {
    // Default suggestions
    suggestionList.innerHTML = `
      <li class="suggestion">
        <h4 class="text">What are the best career options after 12th Science?</h4>
        <span class="icon material-symbols-rounded">school</span>
      </li>
      <li class="suggestion">
        <h4 class="text">Which engineering specialization has the best job prospects?</h4>
        <span class="icon material-symbols-rounded">engineering</span>
      </li>
      <li class="suggestion">
        <h4 class="text">How can I prepare for IIT-JEE effectively?</h4>
        <span class="icon material-symbols-rounded">lightbulb</span>
      </li>
      <li class="suggestion">
        <h4 class="text">What are the top universities abroad for MBA?</h4>
        <span class="icon material-symbols-rounded">travel_explore</span>
      </li>
    `;
    return;
  }

  // Stream-specific suggestions
  let streamSuggestions = [];
  
  if (currentEducationLevel === "10th") {
    streamSuggestions = [
      "What are the differences between MPC and BiPC?",
      "Which stream should I choose if I'm good at Mathematics?",
      "What vocational courses are available after 10th?",
      "Can I switch streams after 11th if I change my mind?"
    ];
  } else if (currentEducationLevel === "12th") {
    if (currentStream === "MPC") {
      streamSuggestions = [
        "What are the best engineering colleges in India?",
        "How should I prepare for JEE Main and Advanced?",
        "What are some alternative careers besides engineering?",
        "Which engineering branch has the highest salary?"
      ];
    } else if (currentStream === "BiPC") {
      streamSuggestions = [
        "What are the best medical colleges in India?",
        "How to prepare for NEET effectively?",
        "What are some paramedical career options?",
        "Can I pursue research after MBBS?"
      ];
    }
  } else if (currentEducationLevel === "grad") {
    if (currentStream === "Engineering") {
      streamSuggestions = [
        "Should I do MS abroad or work in India?",
        "What are the emerging fields in engineering?",
        "How to get into product management after engineering?",
        "What are the best startups for engineers to join?"
      ];
    }
  }

  // Fallback to default if no specific suggestions
  if (streamSuggestions.length === 0) {
    streamSuggestions = [
      `What are the best career options after ${currentEducationLevel} ${currentStream}?`,
      `How to prepare for entrance exams in ${currentStream} field?`,
      `What are the job prospects in ${currentStream}?`,
      `Which colleges are best for ${currentStream}?`
    ];
  }

  // Update DOM
  suggestionList.innerHTML = streamSuggestions
    .map((text, index) => `
      <li class="suggestion">
        <h4 class="text">${text}</h4>
        <span class="icon material-symbols-rounded">${index % 2 === 0 ? 'school' : 'work'}</span>
      </li>
    `)
    .join("");

  // Reattach event listeners
  document.querySelectorAll(".suggestion").forEach(suggestion => {
    suggestion.addEventListener("click", () => {
      userMessage = suggestion.querySelector(".text").innerText;
      handleOutgoingChat();
    });
  });
}

// Handle outgoing chat messages
function handleOutgoingChat() {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;
  
  // Create outgoing message element
  const html = `
    <div class="message-content">
      <img class="avatar" src="user.png" alt="User avatar">
      <p class="text">${userMessage}</p>
    </div>
  `;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  chatContainer.appendChild(outgoingMessageDiv);
  
  // Clear input and hide header
  typingForm.reset();
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
  // Add to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage
  });

  // Show loading animation
  setTimeout(showLoadingAnimation, 500);
}

// Create message element
function createMessageElement(content, ...classes) {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

// Show loading animation
function showLoadingAnimation() {
  const html = `
    <div class="message-content">
      <img class="avatar" src="gemini.png" alt="Gemini avatar">
      <p class="text"></p>
      <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    </div>
    <span class="icon material-symbols-rounded">content_copy</span>
  `;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
  generateAPIResponse(incomingMessageDiv);
}

// Generate API response with career context
async function generateAPIResponse(incomingMessageDiv) {
  const textElement = incomingMessageDiv.querySelector(".text");
  try {
    const prompt = generateCareerPrompt();
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            contents: [
                ...conversationHistory.map(msg => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }]
                })), 
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40
            }
        }),
    });


    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed");
    }
  
    const apiResponse = data.candidates[0].content.parts[0].text;
    const formattedResponse = formatCareerResponse(apiResponse);
  
    // Add to conversation history
    conversationHistory.push({
      role: "model",
      content: apiResponse
    });
  
    showTypingEffect(formattedResponse, textElement, incomingMessageDiv);
  } catch (error) {
    handleAPIError(error, textElement, incomingMessageDiv);
  }
  }
  
  // Generate comprehensive career prompt
  function generateCareerPrompt() {
    let context = "";
    let instructions = "";
  
    // Add education context if available
    if (currentEducationLevel && currentStream) {
      context = `Context: Student is in ${currentEducationLevel} grade with ${currentStream} stream.\n\n`;
      context += CAREER_KNOWLEDGE[currentEducationLevel].prompts[currentStream];
  
      // Add example if available
      if (CAREER_KNOWLEDGE[currentEducationLevel].examples?.[currentStream]) {
        context += `\n\nExample of good response:\n${CAREER_KNOWLEDGE[currentEducationLevel].examples[currentStream]}`;
      }
    }
  
    // Standard instructions
    instructions = `
    You are an expert career counselor with 15+ years experience in the Indian education system.
    Provide detailed, personalized advice that includes:
    - Career options with growth potential
    - Required qualifications and skills
    - Entrance exams in India (dates, syllabus, preparation tips)
    - Job market trends and salary expectations
    - Alternative paths and emerging fields
    - Recommended colleges/universities
  
    Format your response with:
    - Clear headings (##) for each section
    - Bullet points for lists
    - Bold text for important information
    - Estimated salary ranges where applicable
  
    Current query: ${userMessage}
    `;
  
    return context + instructions;
  }
  
  // Format the API response
  function formatCareerResponse(text) {
    // Convert markdown-like formatting to HTML
    return text
      .replace(/^##\s+(.*$)/gm, '<h3>$1</h3>') // Headings
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
      .replace(/-\s(.*$)/gm, '<li>$1</li>') // List items
      .replace(/\n/g, '<br>') // New lines
      .replace(/`(.*?)`/g, '<code>$1</code>'); // Code
  }
  
  // Show typing effect
  function showTypingEffect(text, textElement, incomingMessageDiv) {
    const words = text.split(' ');
    let currentWordIndex = 0;
  
    const typingInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        textElement.innerHTML += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
      } else {
        clearInterval(typingInterval);
        isResponseGenerating = false;
        incomingMessageDiv.querySelector(".icon").classList.remove("hide");
        saveChatToLocalStorage();
      }
    }, 50);
  }
  
  // Handle API errors
  function handleAPIError(error, textElement, incomingMessageDiv) {
    isResponseGenerating = false;
    console.error("Gemini API Error:", error);
  
    textElement.innerHTML = `
      <span class="error">Sorry, I couldn't generate a response. Please try again later.</span>
      <br><br>Error details: ${error.message}
    `;
    incomingMessageDiv.classList.add("error");
    incomingMessageDiv.classList.remove("loading");
  }
  
  // Save chat to local storage
  function saveChatToLocalStorage() {
    localStorage.setItem("saved-chats", chatContainer.innerHTML);
  }
  
  // Toggle theme
  function toggleTheme() {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  }
  
  // Delete chat
  function deleteChat() {
    if (confirm("Are you sure you want to delete all chat history?")) {
      localStorage.removeItem("saved-chats");
      chatContainer.innerHTML = '';
      conversationHistory = [];
      document.body.classList.remove("hide-header");
    }
  }
  
  // Copy message to clipboard
  function copyMessage(copyButton) {
    const messageText = copyButton.parentElement.querySelector(".text").textContent;
    navigator.clipboard.writeText(messageText)
      .then(() => {
        copyButton.innerText = "done";
        setTimeout(() => copyButton.innerText = "content_copy", 2000);
      })
      .catch(err => console.error("Copy failed:", err));
  }