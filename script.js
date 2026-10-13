
const apiKey = "99792b74f77bb158c5777d25aa48468f";

let weatherChart = null;
let hourlyWeatherChart = null;

async function getWeather() {

    const cityInput = document.getElementById("city");
    const error = document.getElementById("error");

    const city = cityInput.value.trim();

    error.innerHTML = "";

    if (city === "") {
        error.innerHTML = "Please enter a city name.";
        return;
    }

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            error.innerHTML =
                "City not found. Please enter a valid city.";
            return;
        }

        displayCurrentWeather(data);

        getForecast(city);

        getHourlyTemperature(city);

    } catch (err) {

        console.error(err);

        error.innerHTML =
            "Unable to fetch weather data. Check your internet connection.";

    }
}


function displayCurrentWeather(data) {

    document.getElementById("cityName").innerHTML =
        `${data.name}, ${data.sys.country}`;

    document.getElementById("temperature").innerHTML =
        Math.round(data.main.temp) + " °C";

    document.getElementById("condition").innerHTML =
        data.weather[0].description;

    document.getElementById("humidity").innerHTML =
        data.main.humidity + " %";

    document.getElementById("wind").innerHTML =
        data.wind.speed + " m/s";

    document.getElementById("feels").innerHTML =
        Math.round(data.main.feels_like) + " °C";

    document.getElementById("pressure").innerHTML =
        data.main.pressure + " hPa";

    document.getElementById("sunrise").innerHTML =
        formatTime(data.sys.sunrise, data.timezone);

    document.getElementById("sunset").innerHTML =
        formatTime(data.sys.sunset, data.timezone);

    document.getElementById("weatherIcon").innerHTML =
        getWeatherIcon(data.weather[0].main);

    createWeatherAlert(data);
}


function getWeatherIcon(weather) {

    if (weather === "Clear") {
        return "☀️";
    }

    else if (weather === "Clouds") {
        return "☁️";
    }

    else if (weather === "Rain") {
        return "🌧️";
    }

    else if (weather === "Drizzle") {
        return "🌦️";
    }

    else if (weather === "Thunderstorm") {
        return "⛈️";
    }

    else if (weather === "Snow") {
        return "❄️";
    }

    else if (
        weather === "Mist" ||
        weather === "Fog" ||
        weather === "Haze" ||
        weather === "Smoke"
    ) {
        return "🌫️";
    }

    return "🌤️";
}


function formatTime(timestamp, timezoneOffset = 0) {

    const date = new Date(
        (timestamp + timezoneOffset) * 1000
    );

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
    });
}

async function getForecast(city) {

    const forecastContainer =
        document.getElementById("forecastContainer");

    if (!forecastContainer) {
        return;
    }

    forecastContainer.innerHTML =
        "<p>Loading 5-day forecast...</p>";

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {

            forecastContainer.innerHTML =
                "<p>Forecast not available.</p>";

            return;
        }

        forecastContainer.innerHTML = "";

        const dailyData = {};

        data.list.forEach(item => {

            const date = item.dt_txt.split(" ")[0];

            const time = item.dt_txt.split(" ")[1];

            const hour = parseInt(time.split(":")[0], 10);

            if (!dailyData[date]) {

                dailyData[date] = item;

            } else {

                const selectedTime =
                    dailyData[date].dt_txt.split(" ")[1];

                const selectedHour =
                    parseInt(selectedTime.split(":")[0], 10);

                if (
                    Math.abs(hour - 12) <
                    Math.abs(selectedHour - 12)
                ) {
                    dailyData[date] = item;
                }

            }

        });

        const dates = Object.keys(dailyData).sort();

        const days = dates.slice(0, 5);

        const chartLabels = [];
        const chartTemperatures = [];

        days.forEach((dateKey, index) => {

            const item = dailyData[dateKey];

            const date = new Date(dateKey + "T12:00:00");

            const dayName =
                index === 0
                    ? "Today"
                    : date.toLocaleDateString("en-US", {
                        weekday: "short"
                    });

            const temperature = Math.round(item.main.temp);

            const condition = item.weather[0].main;

            const description = item.weather[0].description;

            const icon = getWeatherIcon(condition);

            chartLabels.push(dayName);

            chartTemperatures.push(temperature);

            const card = document.createElement("div");

            card.className = "forecast-card";

            card.innerHTML = `
                <h3>${dayName}</h3>

                <div class="forecast-icon">
                    ${icon}
                </div>

                <h2>${temperature} °C</h2>

                <p class="forecast-condition">
                    ${description}
                </p>

                <p>💧 Humidity: ${item.main.humidity}%</p>

                <p>🌬️ Wind: ${item.wind.speed} m/s</p>
            `;

            forecastContainer.appendChild(card);

        });

        createWeatherChart(
            chartLabels,
            chartTemperatures
        );

    } catch (error) {

        console.error(error);

        forecastContainer.innerHTML =
            "<p>Unable to fetch forecast data.</p>";

    }
}


async function getHourlyTemperature(city) {

    const canvas =
        document.getElementById("hourlyWeatherChart");

    if (!canvas) {
        console.log("Hourly graph canvas not found.");
        return;
    }

    const status =
        document.getElementById("hourlyChartStatus");

    if (status) {
        status.textContent =
            "Loading today's temperature...";
    }

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Hourly forecast unavailable."
            );
        }

        const timezoneOffset = data.city.timezone;

        const cityNow = new Date(
            Date.now() + timezoneOffset * 1000
        );

        const todayKey =
            cityNow.toISOString().slice(0, 10);

        const labels = [];
        const temperatures = [];

        data.list.forEach(item => {

            const localTime = new Date(
                (item.dt + timezoneOffset) * 1000
            );

            const dateKey =
                localTime.toISOString().slice(0, 10);

            if (dateKey === todayKey) {

                const timeLabel =
                    localTime.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "UTC"
                    });

                labels.push(timeLabel);

                temperatures.push(
                    Number(item.main.temp.toFixed(1))
                );

            }

        });

        // Destroy old chart before creating a new one
        if (hourlyWeatherChart) {

            hourlyWeatherChart.destroy();

            hourlyWeatherChart = null;

        }

        if (labels.length === 0) {

            if (status) {
                status.textContent =
                    "No forecast data available for today.";
            }

            return;
        }

        hourlyWeatherChart = new Chart(canvas, {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: "Temperature (°C)",

                    data: temperatures,

                    borderWidth: 3,

                    tension: 0.35,

                    fill: false,

                    pointRadius: 5,

                    pointHoverRadius: 8

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: true,

                plugins: {

                    legend: {
                        display: true
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return "Temperature: " +
                                    context.parsed.y.toFixed(1) +
                                    " °C";

                            }

                        }

                    }

                },

                scales: {

                    x: {

                        title: {
                            display: true,
                            text: "Time of Day"
                        }

                    },

                    y: {

                        title: {
                            display: true,
                            text: "Temperature (°C)"
                        }

                    }

                }

            }

        });

        if (status) {

            status.textContent =
                "Today's available 3-hour temperature forecast.";

        }

    } catch (error) {

        console.error(
            "Hourly temperature graph error:",
            error
        );

        if (status) {

            status.textContent =
                "Unable to load today's temperature graph.";

        }

    }

}


function createWeatherChart(labels, temperatures) {

    const canvas =
        document.getElementById("weatherChart");

    if (!canvas) {
        return;
    }

    if (typeof Chart === "undefined") {

        console.error("Chart.js is not loaded.");

        return;
    }

    if (weatherChart) {

        weatherChart.destroy();

        weatherChart = null;

    }

    weatherChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Temperature (°C)",

                data: temperatures,

                borderWidth: 3,

                tension: 0.3,

                fill: false,

                pointRadius: 5

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    display: true
                }

            },

            scales: {

                y: {

                    beginAtZero: false,

                    title: {

                        display: true,

                        text: "Temperature (°C)"

                    }

                },

                x: {

                    title: {

                        display: true,

                        text: "Day"

                    }

                }

            }

        }

    });

}


function getLocationWeather() {

    const error =
        document.getElementById("error");

    error.innerHTML = "";

    if (!navigator.geolocation) {

        error.innerHTML =
            "Geolocation is not supported by your browser.";

        return;
    }

    error.innerHTML =
        "Getting your current location...";

    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            try {

                const url =
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

                const response = await fetch(url);

                const data = await response.json();

                if (!response.ok) {

                    error.innerHTML =
                        "Unable to get weather.";

                    return;
                }

                error.innerHTML = "";

                displayCurrentWeather(data);

                // Update both forecast graphs
                getForecast(data.name);

                getHourlyTemperature(data.name);

            } catch (err) {

                console.error(err);

                error.innerHTML =
                    "Unable to fetch location weather.";

            }

        },

        function(locationError) {

            if (locationError.code === 1) {

                error.innerHTML =
                    "Location permission denied.";

            } else {

                error.innerHTML =
                    "Unable to get your location.";

            }

        }

    );

}


function createWeatherAlert(data) {

    const alertBox =
        document.getElementById("weatherAlert");

    if (!alertBox) {
        return;
    }

    const temperature = data.main.temp;

    const weather = data.weather[0].main;

    let message =
        "✅ No major warning based on current weather conditions.";

    if (temperature >= 40) {

        message =
            "🔥 Extreme heat warning! Temperature is very high.";

    } else if (temperature <= 5) {

        message =
            "🥶 Very low temperature. Please take precautions.";

    } else if (weather === "Thunderstorm") {

        message =
            "⛈️ Thunderstorm detected. Stay indoors if possible.";

    } else if (weather === "Rain") {

        message =
            "🌧️ Rain detected. Carry an umbrella and travel carefully.";

    }

    alertBox.innerHTML = `<p>${message}</p>`;

}

const cityInput = document.getElementById("city");

if (cityInput) {

    cityInput.addEventListener("keypress", function(event) {

        if (event.key === "Enter") {

            getWeather();

        }

    });

}


const contactForm =
    document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", function(event) {

        event.preventDefault();

        alert(
            "Thank you! Your message has been received."
        );

        contactForm.reset();

    });

}