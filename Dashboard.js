const apiKey = 'fc24cbb4c4cff3525d748ca6c61dd81e';
let currentPage = 1;
let forecastData = [];
let isCelsius = true; // Track temperature unit
document.querySelector('.data').style.display = 'none'; // Hide data table initially
const errorContainer = document.getElementById('error-message'); // Error message container

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
          displayWeather(data);
          fetchForecast(city);
          hideError();

          document.querySelector('.data').style.display = 'block';

      })
      .catch(error => {
          displayError(error.message);
      })
      .finally(() => {
        document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after data is fetched
    });
}

function displayError(message) {
  /*const widget = document.getElementById('weather-widget');
  widget.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
  document.querySelector('.main-content').style.display = 'none';*/
  const errorContainer = document.getElementById('error-message'); // Error message container
  errorContainer.style.display = 'block'; // Show the error container
  errorContainer.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`; // Set the error message
  document.querySelector('.data').style.display = 'none';
}

function hideError() {
    const errorContainer = document.getElementById('error-message'); // Error message container
    errorContainer.style.display = 'none'; // Hide the error container
    errorContainer.innerHTML = '';// Clear previous error messages
}
document.addEventListener('DOMContentLoaded', () => {
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');

    // Loop through each link and add click event listener
    sidebarLinks.forEach(link => {
      link.addEventListener('click', function () {
        // Remove the 'active' class from all links
        sidebarLinks.forEach(item => item.classList.remove('active'));
        
        // Add 'active' class to the clicked link
        this.classList.add('active');
      });
    });
  });
function fetchForecast(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    document.getElementById('loadingSpinner').style.display = 'block';

    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            forecastData = data.list;
            displayForecast();
            createCharts(forecastData);
        })
        .catch(error => {
            console.error('Error fetching forecast:', error);
            displayError('An error occurred while fetching the forecast.');
        }).finally(() => {
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after data is fetched
        });
    }

function displayWeather(data) {
    const widget = document.getElementById('weather-widget');
    const iconElement = document.getElementById('weather-icon');

    document.getElementById('city-name').textContent = data.name;
    document.getElementById('temperature').textContent = `Temperature: ${getTemperature(data.main.temp)}°${isCelsius ? 'C' : 'F'}`;
    document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `Wind Speed: ${data.wind.speed} m/s`;
    document.getElementById('weather-description').textContent = data.weather[0].description;

    // Update the weather icon based on condition
    const weatherIcon = data.weather[0].icon; // Get the icon code from API response
    iconElement.src = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`; // Update icon URL

    // Update background based on the weather condition
    updateBackground(data.weather[0].main.toLowerCase(), widget);
}

function getTemperature(temp) {
    return isCelsius ? Math.round(temp) : Math.round((temp * 9/5) + 32); // Convert to Fahrenheit if necessary
}

function updateTemperatureDisplay() {
    const temperatureElement = document.getElementById('temperature');
    const cityName = document.getElementById('city-name').textContent;
    if (cityName) {
        fetchWeather(cityName); // Refetch weather to update display based on new unit
    }
}
function updateBackground(condition, widget) {
    widget.className = 'weather-widget'; // Reset classes
    console.log(condition);
    // Assign appropriate class based on the weather condition
    if (condition.includes('thunderstorm')) {
        widget.classList.add('thunderstorm');
    } else if (condition.includes('snow')) {
        widget.classList.add('snow');
    }else if (condition.includes('clear')) {
      widget.classList.add('clear');
    } else if (condition.includes('drizzle') || condition.includes('rain')) {
        widget.classList.add('drizzle-rain');
    } else if (condition.includes('mist') || condition.includes('smoke') ||
               condition.includes('haze') || condition.includes('dust') ||
               condition.includes('fog') || condition.includes('sand') ||
               condition.includes('ash') || condition.includes('squall') ||
               condition.includes('tornado')) {
        widget.classList.add('haze-fog');
    } else if (condition.includes('clouds')) {
        widget.classList.add('clouds');
    } else if (condition.includes('Sunny')) {
        widget.classList.add('sunny');
    } else {
        widget.classList.add('default'); //Clear Default class for any other condition
    }
}

function displayForecast() {
  const forecastContainer = document.getElementById('forecastContainer');
  const firstForecastContainer = document.getElementById('firstForecast');
  forecastContainer.innerHTML = ''; // Clear previous forecast
  firstForecastContainer.innerHTML = ''; // Clear previous first forecast

  // Filter forecast data to get one entry for each day (around midday)
  const dailyForecast = {};
  forecastData.forEach((entry) => {
      const dateKey = entry.dt_txt.split(' ')[0]; // Get the date as a key (YYYY-MM-DD)
      if (!dailyForecast[dateKey] && Object.keys(dailyForecast).length < 6) { // Only keep 6 unique dates
          dailyForecast[dateKey] = entry; // Store the first entry for each unique date
      }
  });

  const forecastEntries = Object.values(dailyForecast);

  // Display the first day's forecast separately
  if (forecastEntries.length > 0) {
      const entry = forecastEntries[0];
      const fullDate = new Date(entry.dt_txt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
      });

      const dayOfWeek = new Date(entry.dt_txt).toLocaleDateString(undefined, {
          weekday: 'long',
      });

      const iconUrl = `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`;
      const isSmallScreen = window.innerWidth <= 768; // Check if the screen size is small

      if (isSmallScreen) {
          // Change to the small screen format
          firstForecastContainer.innerHTML = `
              <div class="forecast-card">
                  <div>${fullDate}</div> <!-- Full date at the top -->
                  <div>${dayOfWeek}</div> <!-- Day of the week below it -->
                  <img src="${iconUrl}" alt="Weather icon">
                  <div>${getTemperature(entry.main.temp)}°${isCelsius ? 'C' : 'F'}</div>
                  <div>${entry.weather[0].description}</div>
              </div>
          `;
      } else {
          // Default format for larger screens
          firstForecastContainer.innerHTML = `
              <div style="text-align: center; font-size: 24px;">
                  <div style="font-size: 20px;">${fullDate}</div> <!-- Full date -->
                  <div style="font-size: 20px;">${dayOfWeek}</div> <!-- Day of the week -->
                  <img src="${iconUrl}" alt="Weather icon" style="width: 110px; height: auto;"/> <!-- Weather icon -->
                  <div style="font-size: 20px;">${getTemperature(entry.main.temp)}°${isCelsius ? 'C' : 'F'}</div> <!-- Temperature -->
                  <div style="font-size: 20px;">${entry.weather[0].description}</div> <!-- Description -->
              </div>
          `;
      }
  
  }

  // Display the remaining forecasts in the forecast grid
  forecastEntries.slice(1).forEach((entry) => {
      const fullDate = new Date(entry.dt_txt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
      });

      const dayOfWeek = new Date(entry.dt_txt).toLocaleDateString(undefined, {
          weekday: 'long',
      });

      const iconUrl = `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`;

      const forecastCard = `
          <div class="forecast-card">
              <div>${fullDate}</div> <!-- Full date at the top -->
              <div>${dayOfWeek}</div> <!-- Day of the week below it -->
              <img src="${iconUrl}" alt="Weather icon">
              <div>${getTemperature(entry.main.temp)}°${isCelsius ? 'C' : 'F'}</div>
              <div>${entry.weather[0].description}</div>
          </div>
      `;

      forecastContainer.innerHTML += forecastCard;
  });
}


// Pagination controls
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) currentPage--;
    displayForecast();
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage * 5 < forecastData.length) currentPage++;
    displayForecast();
});
function createCharts(forecastData) {
  // Extract temperatures and weather conditions
  const temps = forecastData.map(entry => entry.main.temp);
  const conditions = forecastData.map(entry => entry.weather[0].main);

  // Prepare labels for the charts with date and time
  const labels = forecastData.map(entry => {
      const date = new Date(entry.dt_txt);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  // Define colors for weather conditions
  const barColors = conditions.map(cond => {
    switch (cond.toLowerCase()) {
        case 'thunderstorm': return 'black'; // Thunderstorm
        case 'snow': return 'gray'; // Snow
        case 'clear': return 'skyblue'; // Clear
        case 'drizzle':
        case 'rain': return 'purple'; // Rain
        case 'mist':
        case 'smoke':
        case 'haze':
        case 'dust':
        case 'fog':
        case 'sand':
        case 'ash':
        case 'squall':
        case 'tornado': return 'darkgray'; // Mist/Fog
        case 'clouds': return 'darkblue'; // Clouds
        case 'sunny': return 'orange'; // Sunny
        default: return 'lightgray'; // Default color for unknown conditions
    }
  });

  // Bar Chart
  const barCtx = document.getElementById('tempBarChart').getContext('2d');
  new Chart(barCtx, {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
              label: 'Temperature',
              data: temps,
              backgroundColor: barColors,
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: {
                  display: true,
                  position: 'top',  // Positioning of the legend
                  labels: {
                      generateLabels: (chart) => {
                          const data = chart.data.datasets[0];
                          const uniqueConditions = [...new Set(conditions)];
                          return uniqueConditions.map(cond => {
                              const color = (() => {
                                  switch (cond.toLowerCase()) {
                                      case 'thunderstorm': return 'black';
                                      case 'snow': return 'gray';
                                      case 'clear': return 'skyblue';
                                      case 'drizzle':
                                      case 'rain': return 'purple';
                                      case 'mist':
                                      case 'smoke':
                                      case 'haze':
                                      case 'dust':
                                      case 'fog':
                                      case 'sand':
                                      case 'ash':
                                      case 'squall':
                                      case 'tornado': return 'darkgray';
                                      case 'clouds': return 'darkblue';
                                      case 'sunny': return 'orange';
                                      default: return 'lightgray';
                                  }
                              })();
                              return {
                                  text: cond.charAt(0).toUpperCase() + cond.slice(1),
                                  fillStyle: color,
                                  hidden: false,
                                  strokeStyle: color,
                                  lineWidth: 2,
                                  index: chart.data.datasets.indexOf(data),
                              };
                          });
                      }
                  }
              }
          },
          tooltips: {
              enabled: true,
              mode: 'index',
              intersect: false,
              callbacks: {
                  title: function(tooltipItems) {
                      const index = tooltipItems[0].index;
                      return labels[index];  // Show the label (date/time) on hover
                  },
                  label: function(tooltipItem) {
                      const temp = tooltipItem.yLabel;  // Temperature
                      const cond = conditions[tooltipItem.index];  // Condition
                      return `Temperature: ${temp} °C\nCondition: ${cond}`;
                  }
              }
          },
          scales: {
              x: {
                  display: true,
                  title: {
                      display: true,
                      text: 'Date and Time'
                  }
              },
              y: {
                  display: true,
                  title: {
                      display: true,
                      text: 'Temperature (°C)'
                  },
                  beginAtZero: true  // Start y-axis at 0
              }
          }
      }
  });

  // Doughnut Chart for Weather Conditions
  const conditionCount = conditions.reduce((acc, condition) => {
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
  }, {});

  const doughnutCtx = document.getElementById('weatherDoughnutChart').getContext('2d');
  new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
          labels: Object.keys(conditionCount),
          datasets: [{
              label: 'Weather Conditions',
              data: Object.values(conditionCount),
              backgroundColor: Object.keys(conditionCount).map(cond => {
                switch (cond.toLowerCase()) {
                    case 'thunderstorm': return 'black';
                    case 'snow': return 'white';
                    case 'clear': return 'skyblue';
                    case 'drizzle':
                    case 'rain': return 'purple';
                    case 'mist':
                    case 'smoke':
                    case 'haze':
                    case 'dust':
                    case 'fog':
                    case 'sand':
                    case 'ash':
                    case 'squall':
                    case 'tornado': return 'darkgray';
                    case 'clouds': return 'darkblue';
                    case 'sunny': return 'orange';
                    default: return 'lightgray';
                }
              }),
          }]
      },
      options: {
          responsive: true,
          plugins: {
            legend: {
                display: true,
                position: 'top',  // Positioning of the legend
                labels: {
                    generateLabels: (chart) => {
                        const data = chart.data.datasets[0];
                        const uniqueConditions = [...new Set(conditions)];
                        return uniqueConditions.map(cond => {
                            const color = (() => {
                                switch (cond.toLowerCase()) {
                                    case 'thunderstorm': return 'black';
                                    case 'snow': return 'gray';
                                    case 'clear': return 'skyblue';
                                    case 'drizzle':
                                    case 'rain': return 'purple';
                                    case 'mist':
                                    case 'smoke':
                                    case 'haze':
                                    case 'dust':
                                    case 'fog':
                                    case 'sand':
                                    case 'ash':
                                    case 'squall':
                                    case 'tornado': return 'darkgray';
                                    case 'clouds': return 'darkblue';
                                    case 'sunny': return 'orange';
                                    default: return 'lightgray';
                                }
                            })();
                            return {
                                text: cond.charAt(0).toUpperCase() + cond.slice(1),
                                fillStyle: color,
                                hidden: false,
                                strokeStyle: color,
                                lineWidth: 2,
                                index: chart.data.datasets.indexOf(data),
                            };
                        });
                    }
                }
            }
        },
        
          tooltips: {
              enabled: true,
              callbacks: {
                  label: function(tooltipItem, data) {
                      const label = data.labels[tooltipItem.index];
                      const value = data.datasets[0].data[tooltipItem.index];
                      const percentage = ((value / forecastData.length) * 100).toFixed(2);
                      return `${label}: ${percentage}% (${value} days)`;
                  }
              }
          }
      }
  });

  // Line Chart with Drop Animation
  const lineCtx = document.getElementById('tempLineChart').getContext('2d');
  new Chart(lineCtx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [{
              label: 'Temperature',
              data: temps,
              pointBackgroundColor: barColors,  // Apply the same color scheme to points
              fill: false,
              pointRadius: 5,
              pointHoverRadius: 7,
          }]
      },
      options: {
          responsive: true,
          plugins: {
            legend: {
                display: true,
                position: 'top',  // Positioning of the legend
                labels: {
                    generateLabels: (chart) => {
                        const data = chart.data.datasets[0];
                        const uniqueConditions = [...new Set(conditions)];
                        return uniqueConditions.map(cond => {
                            const color = (() => {
                                switch (cond.toLowerCase()) {
                                    case 'thunderstorm': return 'black';
                                    case 'snow': return 'gray';
                                    case 'clear': return 'skyblue';
                                    case 'drizzle':
                                    case 'rain': return 'purple';
                                    case 'mist':
                                    case 'smoke':
                                    case 'haze':
                                    case 'dust':
                                    case 'fog':
                                    case 'sand':
                                    case 'ash':
                                    case 'squall':
                                    case 'tornado': return 'darkgray';
                                    case 'clouds': return 'darkblue';
                                    case 'sunny': return 'orange';
                                    default: return 'lightgray';
                                }
                            })();
                            return {
                                text: cond.charAt(0).toUpperCase() + cond.slice(1),
                                fillStyle: color,
                                hidden: false,
                                strokeStyle: color,
                                lineWidth: 2,
                                
                                index: chart.data.datasets.indexOf(data),
                            };
                        });
                    }
                }
            }
        },
        
          tooltips: {
              enabled: true,
              mode: 'index',
              intersect: false,
              callbacks: {
                  title: function(tooltipItems) {
                      const index = tooltipItems[0].index;
                      return labels[index];  // Show the label (date/time) on hover
                  },
                  label: function(tooltipItem) {
                      const temp = tooltipItem.yLabel;  // Temperature
                      const cond = conditions[tooltipItem.index];  // Condition
                      return `Temperature: ${temp} °C\nCondition: ${cond}`;
                  }
              }
          },
          animation: {
              easing: 'easeOutBounce',  // Drop animation effect
              duration: 1500  // Duration of the drop animation
          },
          scales: {
              x: {
                  display: true,
                  title: {
                      display: true,
                      text: 'Date and Time'
                  }
              },
              y: {
                  display: true,
                  title: {
                      display: true,
                      text: 'Temperature (°C)'
                  },
                  beginAtZero: true  // Start y-axis at 0
              }
          }
      }
  });

  // Console logs for debugging
  console.log("Temperatures:", temps);
  console.log("Conditions:", conditions);
  console.log("Condition Count:", conditionCount);
}
