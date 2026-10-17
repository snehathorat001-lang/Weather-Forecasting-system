let weatherChart = null;
let hourlyWeatherChart = null;

const cityInput = document.getElementById("city");
const errorElement = document.getElementById("error");

let lastForecast = null;
let lastLocation = null;

function showError(message) {
    errorElement.textContent = message;
}

function showLoading(message) {
    errorElement.textContent = message;
}

function getWeatherInfo(code) {

    const weatherCodes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Depositing rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Moderate drizzle", "🌦️"],
        55: ["Dense drizzle", "🌧️"],
        56: ["Light freezing drizzle", "🌧️"],
        57: ["Dense freezing drizzle", "🌧️"],
        61: ["Slight rain", "🌦️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        66: ["Light freezing rain", "🌧️"],
        67: ["Heavy freezing rain", "🌧️"],
        71: ["Slight snow", "🌨️"],
        73: ["Moderate snow", "❄️"],
        75: ["Heavy snow", "❄️"],
        77: ["Snow grains", "❄️"],
        80: ["Slight rain showers", "🌦️"],
        81: ["Moderate rain showers", "🌧️"],
        82: ["Violent rain showers", "⛈️"],
        85: ["Slight snow showers", "🌨️"],
        86: ["Heavy snow showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with hail", "⛈️"],
        99: ["Severe thunderstorm with hail", "⛈️"]
    };

    return weatherCodes[code] || ["Unknown weather", "🌤️"];
}

async function fetchJSON(url) {

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Weather service error. Please try again later."
        );
    }

    return await response.json();
}

async function getWeather() {

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    showLoading("Searching city...");

    try {

        const geocodingURL =
            "https://geocoding-api.open-meteo.com/v1/search" +
            "?name=" + encodeURIComponent(city) +
            "&count=10" +
            "&language=en" +
            "&format=json";

        const geoData = await fetchJSON(geocodingURL);

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(
                "City not found. Please check the spelling."
            );
        }

        let location = geoData.results[0];

        if (city.toLowerCase().includes(",in")) {

            const indianLocation = geoData.results.find(
                item => item.country_code === "IN"
            );

            if (indianLocation) {
                location = indianLocation;
            }
        }

        await loadWeather(location);

    } catch (error) {

        showError(error.message);
    }
}

async function loadWeather(location) {

    showLoading("Loading weather information...");

    try {

        const url =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + encodeURIComponent(location.latitude) +
            "&longitude=" + encodeURIComponent(location.longitude) +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl" +
            "&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max" +
            "&forecast_days=5" +
            "&timezone=auto";

        const data = await fetchJSON(url);

        lastForecast = data;
        lastLocation = location;

        displayCurrentWeather(data, location);
        displayFiveDayForecast(data);
        displayFiveDayChart(data);
        displayTodayChart(data);
        displayWeatherAlert(data);

        showError("");

    } catch (error) {

        showError(error.message);
    }
}

function displayCurrentWeather(data, location) {

    const current = data.current;

    const info = getWeatherInfo(current.weather_code);

    const country = location.country || "";

    document.getElementById("cityName").textContent =
        location.name + (country ? ", " + country : "");

    document.getElementById("weatherIcon").innerHTML =
        `<span aria-label="${info[0]}">${info[1]}</span>`;

    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m) + " °C";

    document.getElementById("condition").textContent =
        info[0];

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
        current.wind_speed_10m + " km/h";

    document.getElementById("feels").textContent =
        Math.round(current.apparent_temperature) + " °C";

    document.getElementById("pressure").textContent =
        Math.round(current.pressure_msl) + " hPa";

    document.getElementById("sunrise").textContent =
        formatTime(data.daily.sunrise[0]);

    document.getElementById("sunset").textContent =
        formatTime(data.daily.sunset[0]);
}

function formatDate(dateString) {

    const date = new Date(dateString + "T12:00:00");

    return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
}

function formatTime(dateTime) {

    if (!dateTime) {
        return "--:--";
    }

    return dateTime.split("T")[1];
}

function displayFiveDayForecast(data) {

    const container =
        document.getElementById("forecastContainer");

    container.innerHTML = "";

    const daily = data.daily;

    daily.time.forEach((date, index) => {

        const info = getWeatherInfo(
            daily.weather_code[index]
        );

        const card = document.createElement("div");

        card.className = "forecast-card";

        const title = document.createElement("h3");
        title.textContent = formatDate(date);

        const icon = document.createElement("div");
        icon.className = "forecast-icon";
        icon.textContent = info[1];

        const condition = document.createElement("p");
        condition.textContent = info[0];

        const temperature = document.createElement("p");
        temperature.className = "forecast-temp";

        temperature.textContent =
            Math.round(daily.temperature_2m_max[index]) +
            "° / " +
            Math.round(daily.temperature_2m_min[index]) +
            "°C";

        const rain = document.createElement("p");

        const rainChance =
            daily.precipitation_probability_max[index];

        rain.textContent =
            "🌧️ Rain: " +
            (rainChance == null ? "N/A" : rainChance + "%");

        card.appendChild(title);
        card.appendChild(icon);
        card.appendChild(condition);
        card.appendChild(temperature);
        card.appendChild(rain);

        container.appendChild(card);
    });
}

function displayFiveDayChart(data) {

    const daily = data.daily;

    const labels = daily.time.map(
        date => formatDate(date)
    );

    const maxTemps = daily.temperature_2m_max;
    const minTemps = daily.temperature_2m_min;

    const ctx = document.getElementById("weatherChart");

    if (weatherChart) {
        weatherChart.destroy();
    }

    weatherChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Maximum Temperature (°C)",
                    data: maxTemps,
                    borderWidth: 3,
                    tension: 0.3
                },

                {
                    label: "Minimum Temperature (°C)",
                    data: minTemps,
                    borderWidth: 3,
                    tension: 0.3
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            scales: {

                y: {
                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: "Date"
                    }
                }
            }
        }
    });
}

function displayTodayChart(data) {

    const hourly = data.hourly;

    const today = data.current.time.split("T")[0];

    const labels = [];
    const temperatures = [];

    hourly.time.forEach((time, index) => {

        if (time.startsWith(today)) {

            labels.push(time.split("T")[1]);

            temperatures.push(
                hourly.temperature_2m[index]
            );
        }
    });

    const status =
        document.getElementById("hourlyChartStatus");

    if (labels.length === 0) {

        status.textContent =
            "Today's temperature readings are unavailable.";

        return;
    }

    status.textContent =
        "Today's temperature readings (usually hourly).";

    const ctx =
        document.getElementById("hourlyWeatherChart");

    if (hourlyWeatherChart) {
        hourlyWeatherChart.destroy();
    }

    hourlyWeatherChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Temperature (°C)",
                    data: temperatures,
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            scales: {

                y: {
                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: "Time"
                    }
                }
            }
        }
    });
}

function displayWeatherAlert(data) {

    const container =
        document.getElementById("weatherAlert");

    const current = data.current;

    const alerts = [];

    const temperature = current.temperature_2m;

    const windSpeed = current.wind_speed_10m;

    const info = getWeatherInfo(current.weather_code);

    const condition = info[0].toLowerCase();

    if (temperature >= 40) {

        alerts.push(
            "Extreme heat: Stay hydrated and avoid prolonged sun exposure."
        );

    } else if (temperature >= 35) {

        alerts.push(
            "High temperature: Drink water and limit outdoor activity."
        );
    }

    if (temperature <= 0) {

        alerts.push(
            "Freezing conditions: Take precautions against cold weather."
        );
    }

    if (windSpeed >= 50) {

        alerts.push(
            "Strong winds: Be careful outdoors."
        );
    }

    if (
        condition.includes("thunderstorm") ||
        condition.includes("violent")
    ) {

        alerts.push(
            "Thunderstorm conditions detected. Follow official local weather warnings."
        );

    } else if (
        condition.includes("rain") ||
        condition.includes("drizzle")
    ) {

        alerts.push(
            "Rain conditions: Carry an umbrella and travel carefully."
        );

    } else if (condition.includes("snow")) {

        alerts.push(
            "Snow conditions: Travel carefully."
        );
    }

    if (alerts.length === 0) {

        container.innerHTML = "";

        const message = document.createElement("p");

        message.className = "alert-safe";

        message.textContent =
            "No alert triggered by this project's basic weather checks.";

        container.appendChild(message);

    } else {

        container.innerHTML = "";

        alerts.forEach(alert => {

            const message = document.createElement("p");

            message.className = "alert-warning";

            message.textContent = "⚠️ " + alert;

            container.appendChild(message);
        });
    }

    const note = document.createElement("p");

    note.textContent =
        "For safety, always check official local weather warnings.";

    container.appendChild(note);
}

function getLocationWeather() {

    if (!navigator.geolocation) {

        showError(
            "Your browser does not support location services."
        );

        return;
    }

    showLoading("Getting your location...");

    navigator.geolocation.getCurrentPosition(

        async position => {

            const location = {

                name: "Your Current Location",

                country: "",

                latitude: position.coords.latitude,

                longitude: position.coords.longitude
            };

            try {

                await loadWeather(location);

            } catch (error) {

                showError(error.message);
            }
        },

        error => {

            if (error.code === 1) {

                showError(
                    "Location permission denied. Please allow location access."
                );

            } else {

                showError(
                    "Unable to get location. Please search by city name."
                );
            }
        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

cityInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        getWeather();
    }
});