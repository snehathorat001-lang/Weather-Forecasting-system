const apiKey = "99792b74f77bb158c5777d25aa48468f";

let weatherChart = null;

async function getWeather() {

    const city = document.getElementById("city").value.trim();
    const error = document.getElementById("error");

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

    }

    catch (err) {

        console.log(err);

        error.innerHTML =
            "Unable to fetch weather data.";

    }

}

function displayCurrentWeather(data) {

    document.getElementById("cityName").innerHTML =
        data.name + ", " + data.sys.country;

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
        formatTime(data.sys.sunrise);

    document.getElementById("sunset").innerHTML =
        formatTime(data.sys.sunset);

    const weather = data.weather[0].main;

    document.getElementById("weatherIcon").innerHTML =
        getWeatherIcon(weather);

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
        weather === "Haze"
    ) {

        return "🌫️";

    }

    else {

        return "🌤️";

    }

}

function formatTime(timestamp) {

    const date = new Date(timestamp * 1000);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

async function getForecast(city) {

    const forecastContainer =
        document.getElementById("forecastContainer");

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

            const date =
                item.dt_txt.split(" ")[0];

            if (!dailyData[date]) {

                dailyData[date] = item;

            }

            else {

                const currentTime =
                    item.dt_txt.split(" ")[1];

                const selectedTime =
                    dailyData[date].dt_txt.split(" ")[1];

                if (
                    Math.abs(
                        parseInt(currentTime.split(":")[0]) - 12
                    )
                    <
                    Math.abs(
                        parseInt(selectedTime.split(":")[0]) - 12
                    )
                ) {

                    dailyData[date] = item;

                }

            }

        });

        const days =
            Object.values(dailyData).slice(0, 5);

        const chartLabels = [];
        const chartTemperatures = [];

        days.forEach(item => {

            const date =
                new Date(item.dt * 1000);

            const day =
                date.toLocaleDateString("en-US", {
                    weekday: "short"
                });

            const temperature =
                Math.round(item.main.temp);

            const condition =
                item.weather[0].main;

            const description =
                item.weather[0].description;

            const icon =
                getWeatherIcon(condition);

            chartLabels.push(day);

            chartTemperatures.push(temperature);

            forecastContainer.innerHTML += `

                <div class="forecast-card">

                    <h3>${day}</h3>

                    <div class="forecast-icon">
                        ${icon}
                    </div>

                    <h2>${temperature}°C</h2>

                    <p>${description}</p>

                    <p>💧 ${item.main.humidity}%</p>

                    <p>🌬️ ${item.wind.speed} m/s</p>

                </div>

            `;

        });

        createWeatherChart(
            chartLabels,
            chartTemperatures
        );

    }

    catch (error) {

        console.log(error);

        forecastContainer.innerHTML =
            "<p>Unable to fetch forecast data.</p>";

    }

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

                const response =
                    await fetch(url);

                const data =
                    await response.json();

                if (!response.ok) {

                    error.innerHTML =
                        "Unable to get weather.";

                    return;
                }

                error.innerHTML = "";

                displayCurrentWeather(data);

                getForecast(
                    data.name
                );


            }

            catch (err) {

                console.log(err);

                error.innerHTML =
                    "Unable to fetch location weather.";

            }

        },


        function(error) {

            if (error.code === 1) {

                document.getElementById("error").innerHTML =
                    "Location permission denied.";

            }

            else {

                document.getElementById("error").innerHTML =
                    "Unable to get your location.";

            }

        }

    );

}


function createWeatherAlert(data) {

    const alertBox =
        document.getElementById("weatherAlert");

    const temperature =
        data.main.temp;

    const weather =
        data.weather[0].main;

    let message =
        "✅ No major weather warning based on current conditions.";

    if (temperature >= 40) {

        message =
            "🔥 Extreme heat warning! Temperature is very high.";

    }

    else if (temperature <= 5) {

        message =
            "🥶 Very low temperature. Please take precautions.";

    }

    else if (weather === "Thunderstorm") {

        message =
            "⛈️ Thunderstorm detected. Stay indoors if possible.";

    }

    else if (weather === "Rain") {

        message =
            "🌧️ Rain detected. Carry an umbrella and travel carefully.";

    }


    alertBox.innerHTML =
        `<p>${message}</p>`;

}


function createWeatherChart(labels, temperatures) {

    const canvas =
        document.getElementById("weatherChart");


    if (!canvas) {

        return;
    }


    if (weatherChart !== null) {

        weatherChart.destroy();

    }
    
    
    if (typeof Chart === "undefined") {

        console.log(
            "Chart.js is not loaded."
        );

        return;
    }

    weatherChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: "Temperature °C",

                    data: temperatures,

                    borderWidth: 3,

                    tension: 0.3,

                    fill: false

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

document
    .getElementById("city")
    .addEventListener("keypress", function(event) {

        if (event.key === "Enter") {

            getWeather();

        }

    });

const contactForm =
    document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            alert(
                "Thank you! Your message has been received."
            );

            contactForm.reset();

        }
    );

}