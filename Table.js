// Import the Google Generative AI library (Gemini)
import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = 'fc24cbb4c4cff3525d748ca6c61dd81e';
const GEMINI_API_KEY = 'AIzaSyAEpsidQjYMYHu4YjV1x6jJ64-Hv2mQwWk';
const WEATHER_API_KEY = 'fc24cbb4c4cff3525d748ca6c61dd81e';

// Initialize Gemini API with your API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
let currentPage = 1;
let forecastData = [];
let manipulatedData = [];
let isCelsius = true; // Track temperature unit
const entriesPerPage = 10; // Define how many entries to show per page
document.querySelector('.data').style.display = 'none'; // Hide data table initially
const errorContainer = document.getElementById('error-message'); // Error message container

document.getElementById('help').addEventListener('click', function() {
    const helpContent = document.getElementById('helpContent');
    if (helpContent.style.display === 'none' || helpContent.style.display === '') {
        helpContent.style.display = 'block'; // Show help content
    } else {
        helpContent.style.display = 'none'; // Hide help content
    }
});


const chatbotIcon = document.getElementById('chatbotIcon');
const chatbotWindow = document.getElementById('chatbotWindow');

// Toggle chatbot window
if (chatbotIcon && chatbotWindow) {
    chatbotIcon.addEventListener('click', () => {
        chatbotWindow.style.display = chatbotWindow.style.display === 'none' || chatbotWindow.style.display === '' ? 'block' : 'none';
    });
} else {
    console.error('Chatbot icon or window not found!');
}

// Function to scroll to the bottom after new message
function scrollToBottom() {
    const chatbotMessages = document.getElementById('chatbotMessages');
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitButton');
    submitButton.addEventListener('click', submitMessage);
});

// Call scrollToBottom after every new message
function submitMessage() {
    const userMessageInput = document.getElementById('userMessage');
    const message = userMessageInput.value.trim();
    if (message === '') return;

    const chatbotMessages = document.getElementById('chatbotMessages');

    // Add user message to chat
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('message');
    userMessageElement.innerHTML = `
    <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 10px;">
        <p style="margin-right: 10px; background-color: #babdbc; padding: 10px; border-radius: 8px; max-width: 80%; word-wrap: break-word; overflow-wrap: break-word;">
            ${message}
        </p>
        <img src="https://img.freepik.com/free-vector/cute-girl-hacker-operating-laptop-cartoon-vector-icon-illustration-people-technology-isolated-flat_138676-9487.jpg" style="border-radius: 100%; width: 40px; height: 40px;" alt="User Icon">
    </div>`;

    chatbotMessages.appendChild(userMessageElement);
    userMessageInput.value = ''; // Clear the input field
    scrollToBottom(); // Scroll to the bottom

    // Determine if the user is asking for weather or general information
    if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('temperature')) {
        getWeather(chatbotMessages, message);
    } else {
        getGeneralResponse(chatbotMessages, message);
    }
}
function getWeather(chatbotMessages, query) {
    const city = document.getElementById('city').value.trim();
    if (!city) {
        displayError1(chatbotMessages, "Please enter a city name.");
        return;
    }

    // Normalize query to lower case for consistency
    const lowerQuery = query.toLowerCase();
    if (query.match(/\b(?:\w+\s\d{1,2},\s\d{4})\b/) || query.match(/\b(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)\b/)) {
        handleSpecificDateOrTime(chatbotMessages, query, city);
        return; // Exit after handling specific date or time
    }
    
    if (lowerQuery.includes('current weather') || lowerQuery.includes('now')) {
        getCurrentWeather(chatbotMessages, city);
    } else if (lowerQuery.includes('tomorrow')) {
        getForecastWeather(chatbotMessages, city, 1);
    } else if (lowerQuery.includes('yesterday')) {
        getYesterdayWeather(chatbotMessages, city);
    } else if (['rain', 'clouds', 'clear', 'snow', 'thunderstorm'].some(condition => lowerQuery.includes(condition))) {
        const condition = ['rain', 'clouds', 'clear', 'snow', 'thunderstorm'].find(cond => lowerQuery.includes(cond));
        getWeatherCondition(chatbotMessages, city, condition);
    } else {
        displayError1(chatbotMessages, "Sorry, I couldn't understand your request. Please ask about the current weather, tomorrow's forecast, or specific conditions.");
    }
}

// Function to get current weather
function getCurrentWeather(chatbotMessages, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
    document.getElementById('loadingSpinner').style.display = 'block';
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                const weatherMessage = `The current temperature in ${city} is ${Math.round(data.main.temp)}°C with ${data.weather[0].description}.`;
                displayBotMessage(chatbotMessages, weatherMessage);
            } else {
                displayError1(chatbotMessages, "Sorry, I couldn't find weather data for that location.");
            }
        })
        .catch(err => {
            displayError1(chatbotMessages, "Error fetching data: " + err.message);
        })
        .finally(() => {
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after data is fetched
        });
}

// Function to get forecast weather (e.g., for tomorrow)
function getForecastWeather(chatbotMessages, city, daysAhead) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
    document.getElementById('loadingSpinner').style.display = 'block'; 
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === "200") {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + daysAhead);

                const forecast = data.list.find(entry => {
                    const entryDate = new Date(entry.dt_txt);
                    return entryDate.getDate() === targetDate.getDate();
                });

                if (forecast) {
                    const weatherMessage = `The weather in ${city} on ${targetDate.toDateString()} will be ${Math.round(forecast.main.temp)}°C with ${forecast.weather[0].description}.`;
                    displayBotMessage(chatbotMessages, weatherMessage);
                } else {
                    displayError1(chatbotMessages, "Sorry, I couldn't find a weather forecast for tomorrow.");
                }
            } else {
                displayError1(chatbotMessages, "Sorry, I couldn't retrieve forecast data for that location.");
            }
        })
        .catch(err => {
            displayError1(chatbotMessages, "Error fetching forecast data: " + err.message);
        })
        .finally(() => {
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after data is fetched
        });
}

// Function to get yesterday's weather (using the history API)
function getYesterdayWeather(chatbotMessages, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat={lat}&lon={lon}&dt={timestamp}&appid=${WEATHER_API_KEY}&units=metric`;

    // For simplicity, you can hardcode the timestamp to 24 hours ago for now
    const timestamp = Math.floor(Date.now() / 1000) - 86400;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                const { lat, lon } = data.coord;
                const historyUrl = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${WEATHER_API_KEY}&units=metric`;

                return fetch(historyUrl);
            } else {
                throw new Error("City not found");
            }
        })
        .then(response => response.json())
        .then(historyData => {
            const weatherMessage = `Yesterday in ${city}, the temperature was ${Math.round(historyData.current.temp)}°C with ${historyData.current.weather[0].description}.`;
            displayBotMessage(chatbotMessages, weatherMessage);
        })
        .catch(err => {
            displayError1(chatbotMessages, "Error fetching data: " + err.message);
        })
       
}

// Function to check for a specific weather condition (rain, cloudy, etc.)
function getWeatherCondition(chatbotMessages, city, condition) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
    document.getElementById('loadingSpinner').style.display = 'block'; 

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === "200") {
                const conditionFound = data.list.find(entry => entry.weather.some(w => w.main.toLowerCase().includes(condition)));

                if (conditionFound) {
                    const weatherMessage = `The weather in ${city} will have ${condition} on ${new Date(conditionFound.dt_txt).toDateString()}.`;
                    displayBotMessage(chatbotMessages, weatherMessage);
                } else {
                    displayBotMessage(chatbotMessages, `No ${condition} is expected in the forecast for ${city}.`);
                }
            } else {
                displayError1(chatbotMessages, "Sorry, I couldn't retrieve forecast data for that location.");
            }
        })
        .catch(err => {
            displayError1(chatbotMessages, "Error fetching data: " + err.message);
        })
        .finally(() => {
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after data is fetched
        });
}


async function handleSpecificDateOrTime(chatbotMessages, query, city, currentData) {
    const specificDateRegex = /\b(?:\w+\s\d{1,2},\s\d{4})\b/; // Matches "October 19, 2024"
    const timeRegex = /\b(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)\b/; // Matches "06:00 PM"
    
    const dateMatch = query.match(specificDateRegex);
    const timeMatch = query.match(timeRegex);
    
    if (dateMatch && timeMatch) {
        // Case 1: Both Date and Time in the query
        const date = dateMatch[0];
        const time = timeMatch[0];
        const matchingEntry = forecastData.find(entry => {
            const entryDate = new Date(entry.dt_txt).toLocaleDateString();
            const entryTime = new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return entryDate === new Date(date).toLocaleDateString() && entryTime === time; // Match both date and time
        });

        if (matchingEntry) {
            const temp = Math.round(matchingEntry.main.temp);
            const description = matchingEntry.weather[0].description;
            displayBotMessage(chatbotMessages, `On ${date} at ${time}, the temperature in ${city} was ${temp}°C with ${description}.`);
        } else {
            displayError1(chatbotMessages, "Sorry, I couldn't find weather data for that specific time and date.");
        }

    } else if (timeMatch) {
        // Case 2: Time only in the query
        const time = timeMatch[0];
        const matchingEntry = forecastData.find(entry => {
            const entryDate = new Date(entry.dt_txt).toLocaleDateString();
            const entryTime = new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return entryTime === time && entryDate === new Date(forecastData[0].dt_txt).toLocaleDateString(); // Match time on first day
        });

        if (matchingEntry) {
            const temp = Math.round(matchingEntry.main.temp);
            const description = matchingEntry.weather[0].description;
            displayBotMessage(chatbotMessages, `At ${time} on ${new Date(forecastData[0].dt_txt).toLocaleDateString()}, the temperature in ${city} was ${temp}°C with ${description}.`);
        } else {
            displayError1(chatbotMessages, "Sorry, I couldn't find weather data for that specific time.");
        }

    } else if (dateMatch) {
        // Case 3: Date only in the query
        const date = dateMatch[0];
        const matchingEntries = forecastData.filter(entry => {
            const entryDate = new Date(entry.dt_txt).toLocaleDateString();
            return entryDate === new Date(date).toLocaleDateString(); // Match the date
        });

        if (matchingEntries.length > 0) {
            const tempMessage = matchingEntries.map(entry => {
                const temp = Math.round(entry.main.temp);
                const description = entry.weather[0].description;
                const time = new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `At ${time}, the temperature was ${temp}°C with ${description}.`;
            }).join(' '); // Combine entries if there are multiple time slots in one day
            displayBotMessage(chatbotMessages, `On ${date}, the temperature in ${city} was as follows: ${tempMessage}`);
        } else {
            displayError1(chatbotMessages, "Sorry, I couldn't find weather data for that date.");
        }
    } else {
        // Case 4: No date or time found in the query
        displayError1(chatbotMessages, "Please provide a specific date or time for your weather query.");
    }
}
async function getGeneralResponse(chatbotMessages, query) {
    try {
      const result = await model.generateContent(query);
      const botMessageElement = document.createElement('div');
      botMessageElement.classList.add('message');
      botMessageElement.innerHTML = `
      <div style="display: flex; margin: 0; border-radius: 8px; max-width: 95%; word-wrap: break-word;">
          <img src="chatbot.png" alt="Chatbot Icon" style="width: 50px; height: 50px; margin-right: 0px;">
          <div style="display: flex; background-color: #90bef0; padding: 10px; border-radius: 8px;">
              <h4><strong>Bot:</strong></h4>
              <p style="margin-left: 8px;">${result.response.text()}</p>
          </div>
      </div>`;
      chatbotMessages.appendChild(botMessageElement);
      scrollToBottom();
    } catch (error) {
      displayError1(chatbotMessages, "Sorry, I couldn't fetch the response.");
    }
  }
// Dynamically import Google Generative AI when required
document.addEventListener('DOMContentLoaded', () => {
    async function loadGeminiAPI() {
      const { GoogleGenerativeAI } = await import('https://esm.run/@google/generative-ai');
      
      // Initialize Gemini API
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      // Function for generating a response
      
  
      // Now you can call getGeneralResponse where needed in your existing code
    }
  
    loadGeminiAPI();  // Load the Gemini API when DOM is loaded
  });
  
function displayBotMessage(chatbotMessages, message) {
    // Ensure message is a string
    const messageString = String(message); // Convert to string if it's not
    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('message');
    botMessageElement.innerHTML = `
        <div style="display: flex; margin: 0; border-radius: 8px; max-width: 95%; word-wrap: break-word;">
            <img src="chatbot.png" alt="Chatbot Icon" style="width: 50px; height: 50px; margin-right: 0px;">
            <div style="display: flex; background-color: #90bef0; padding: 10px; border-radius: 8px;">
                <h4><strong>Bot:</strong></h4>
                <p style="margin-left: 8px;">${messageString}</p>
            </div>
        </div>`;
    chatbotMessages.appendChild(botMessageElement);
    scrollToBottom();
}

// Function to display error message
function displayError1(chatbotMessages, errorMessage) {
    // Ensure errorMessage is a string
    const errorMessageString = String(errorMessage); // Convert to string if it's not
    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('message');
    botMessageElement.innerHTML = `
        <div style="display: flex; margin: 0; border-radius: 8px; max-width: 95%; word-wrap: break-word;">
            <img src="chatbot.png" alt="Chatbot Icon" style="width: 50px; height: 50px; margin-right: 0px;">
            <div style="display: flex; background-color: #f0a090; padding: 10px; border-radius: 8px;">
                <h4><strong>Bot:</strong></h4>
                <p style="margin-left: 8px;">${errorMessageString}</p>
            </div>
        </div>`;
    chatbotMessages.appendChild(botMessageElement);
    scrollToBottom();
}











document.getElementById('getWeather').addEventListener('click', () => {
    const city = document.getElementById('city').value.trim();

    if (city === "") {
        displayError("No input entered. Please write the city name."); // Handle empty input
        return; // Stop the function execution if input is empty
    }
    hideError();
    fetchWeather(city);
});


document.getElementById('tempUnit').addEventListener('change', (event) => {
    isCelsius = event.target.value === 'celsius';
    updateTemperatureDisplay(); // Update temperature display based on selected unit
});

document.getElementById('sortAsc').addEventListener('click', () => {
    manipulatedData = [...forecastData]; // Make a fresh copy
    manipulatedData.sort((a, b) => a.main.temp - b.main.temp);
    hideError();
    displayForecast();
    displayPagination();
});

document.getElementById('sortDesc').addEventListener('click', () => {
    manipulatedData = [...forecastData]; // Make a fresh copy
    manipulatedData.sort((a, b) => b.main.temp - a.main.temp);
    hideError();
    displayForecast();
    displayPagination();
});

document.getElementById('filterRain').addEventListener('click', () => {
    manipulatedData = [...forecastData]; // Make a fresh copy
    manipulatedData = manipulatedData.filter(entry => entry.weather[0].description.toLowerCase().includes('rain'));
    hideError();
    displayForecast();
    displayPagination();
});

document.getElementById('highestTemp').addEventListener('click', () => {
    manipulatedData = [...forecastData]; // Make a fresh copy
    const highestTemp = Math.max(...manipulatedData.map(entry => entry.main.temp));
    manipulatedData = manipulatedData.filter(entry => entry.main.temp === highestTemp);
    hideError();
    displayForecast();
    displayPagination();
});

// Reset button functionality
document.getElementById('reset').addEventListener('click', () => {
    manipulatedData = [...forecastData]; // Reset to original data
    hideError();
    displayForecast();
    displayPagination();
});

function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  document.getElementById('loadingSpinner').style.display = 'block'; 

  fetch(url)
    .then(response => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("City not found");
        } else if (response.status === 429) {
          throw new Error("API limit reached");
        } else {
          throw new Error("Unable to fetch weather data");
        }
      }
      return response.json();
    })
    .then(data => {
      fetchForecast(city);
      hideError();
      document.querySelector('.data').style.display = 'block'; // Show table when data is fetched
      
    })
    .catch(error => {
      displayError(error.message);
    })
    .finally(() => {
        document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after data is fetched
    });
}
function displayError(message) {
    if (!errorContainer) {
        console.error("Error container not found in the DOM.");
        return;
    }
    
    errorContainer.style.display = 'block'; // Make error container visible
    errorContainer.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
    document.querySelector('.data').style.display = 'none'; // Hide the table on error
}
function hideError() {
    errorContainer.style.display = 'none'; // Hide error container
    errorContainer.innerHTML = ''; // Clear previous error messages
}

function fetchForecast(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    document.getElementById('loadingSpinner').style.display = 'block'; 

    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            forecastData = data.list; // Store the original data
            manipulatedData = [...forecastData]; // Make a copy for manipulation
            hideError(); // Clear any previous errors
            document.querySelector('.data').style.display = 'block'; // Show the table when data is fetched
            displayForecast();
            displayPagination();
        })
        .catch(error => {
            displayError('An error occurred while fetching the forecast.');
            console.error('Error fetching forecast:', error);
        })
        .finally(() => {
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after data is fetched
        });
}

function displayForecast() {
    const forecastContainer = document.getElementById('forecastTableBody');
    forecastContainer.innerHTML = ''; // Clear the table

    const start = (currentPage - 1) * entriesPerPage;
    const end = start + entriesPerPage;
    const paginatedData = manipulatedData.slice(start, end); // Paginate manipulated data

    paginatedData.forEach((entry, index) => {
        const fullDate = new Date(entry.dt_txt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const dayOfWeek = new Date(entry.dt_txt).toLocaleDateString(undefined, { weekday: 'long' });
        const time = new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(entry.main.temp);
        const description = entry.weather[0].description;
        const humidity = entry.main.humidity;
        const windSpeed = entry.wind.speed;
        const iconUrl = `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`;

        const rowNumber = start + index + 1; // Calculate row number

        const row = `
            <tr>
                <td>${rowNumber}</td> <!-- Row Number -->
                <td>${fullDate}</td>
                <td>${dayOfWeek}</td>
                <td>${time}</td>
                <td><img src="${iconUrl}" alt="Weather Icon"></td>
                <td>${temp}°C</td>
                <td>${description}</td>
                <td>${humidity}%</td>
                <td>${windSpeed} m/s</td>
            </tr>
        `;
        forecastContainer.innerHTML += row;
    });
}

  
// Display pagination with previous/next and page numbers
function displayPagination() {
    const totalEntries = manipulatedData.length; // Use manipulatedData length
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const paginationContainer = document.getElementById('paginationControls');
  
    paginationContainer.innerHTML = ''; // Clear previous page numbers
  
    // Create and append 'Previous' button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.classList.add('prev-next-button');
    prevButton.disabled = currentPage === 1; // Disable if on the first page
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayForecast();
            displayPagination();
        }
    });
    paginationContainer.appendChild(prevButton);
  
    // Create and append page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-button');
  
        if (i === currentPage) {
            pageButton.classList.add('active'); // Highlight the current page
        }
  
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayForecast();
            displayPagination();
        });
  
        paginationContainer.appendChild(pageButton);
    }
  
    // Create and append 'Next' button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.classList.add('prev-next-button');
    nextButton.disabled = currentPage === totalPages; // Disable if on the last page
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayForecast();
            displayPagination();
        }
    });
    paginationContainer.appendChild(nextButton);
}
  
// Pagination controls (optional for next/prev buttons)
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    displayForecast();
    displayPagination();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  const totalPages = Math.ceil(forecastData.length / entriesPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayForecast();
    displayPagination();
  }
});
