const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const forecastTab = document.querySelector("[data-forecast]");
const userContainer = document.querySelector(".weather-container");

const grantAccessContainer = document.querySelector(
    ".grant-location-container"
);
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");
const forecastContainer = document.querySelector("[data-forecastContainer]");

let oldTab = userTab;
const API_KEY = "d1845658f92b31c64bd94f06f7188c9c"; // Replace with your OpenWeather API key
oldTab.classList.add("current-tab");
getFromSessionStorage();

function switchTab(newTab) {
    if (newTab !== oldTab) {
        oldTab.classList.remove("current-tab");
        oldTab = newTab;
        oldTab.classList.add("current-tab");

        if (newTab === userTab) {
            searchForm.classList.remove("active");
            forecastContainer.classList.remove("active");
            userInfoContainer.classList.remove("active");
            getFromSessionStorage();
        } else if (newTab === searchTab) {
            searchForm.classList.add("active");
            forecastContainer.classList.remove("active");
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
        } else if (newTab === forecastTab) {
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            forecastContainer.classList.add("active");
            getForecast();
        }
    }
}

userTab.addEventListener("click", () => {
    switchTab(userTab);
});

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});

forecastTab.addEventListener("click", () => {
    switchTab(forecastTab);
});

function getFromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
        grantAccessContainer.classList.add("active");
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

async function fetchUserWeatherInfo(coordinates) {
    const { lat, lon } = coordinates;
    grantAccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);
    } catch (err) {
        loadingScreen.classList.remove("active");
        alert("Failed to fetch weather data");
    }
}

function renderWeatherInfo(weatherInfo) {
    const cityName = document.querySelector("[data-cityName]");
    const countryIcon = document.querySelector("[data-countryIcon]");
    const desc = document.querySelector("[data-weatherDesc]");
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    const temp = document.querySelector("[data-temp]");
    const windspeed = document.querySelector("[data-windspeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-cloudiness]");

    cityName.innerText = weatherInfo?.name;
    countryIcon.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country.toLowerCase()}.png`;
    desc.innerText = weatherInfo?.weather?.[0]?.description;
    weatherIcon.src = `http://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
    temp.innerText = `${weatherInfo?.main?.temp} °C`;
    windspeed.innerText = `${weatherInfo?.wind?.speed} m/s`;
    humidity.innerText = `${weatherInfo?.main?.humidity}%`;
    cloudiness.innerText = `${weatherInfo?.clouds?.all}%`;

    // Save the city name for forecast fetching
    sessionStorage.setItem("current-city", weatherInfo?.name);
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

const grantAccessButton = document.querySelector("[data-grantAccess]");
grantAccessButton.addEventListener("click", getLocation);

const searchInput = document.querySelector("[data-searchInput]");
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let cityName = searchInput.value;
    if (cityName === "") return;
    fetchSearchWeatherInfo(cityName);
});

async function fetchSearchWeatherInfo(city) {
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);
    } catch (err) {
        loadingScreen.classList.remove("active");
        alert("Failed to fetch weather data");
    }
}

async function fetchForecastWeatherInfo(city) {
    loadingScreen.classList.add("active");
    forecastContainer.classList.remove("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();
        loadingScreen.classList.remove("active");
        forecastContainer.classList.add("active");
        renderForecastInfo(data);
    } catch (err) {
        loadingScreen.classList.remove("active");
        alert("Failed to fetch forecast data");
    }
}

async function getForecast() {
    const city = sessionStorage.getItem("current-city");
    if (city) {
        fetchForecastWeatherInfo(city);
    } else {
        alert("No city information available for forecast.");
    }
}

function renderForecastInfo(forecastInfo) {
    forecastContainer.innerHTML = ""; // Clear previous forecast data

    const cityName = document.createElement("h2");
    cityName.textContent = forecastInfo.city.name;
    forecastContainer.appendChild(cityName);

    const forecastList = forecastInfo.list.filter(
        (item, index) => index % 8 === 0
    ); // Get forecast for next 5 days

    forecastList.forEach((day) => {
        const forecastDay = document.createElement("div");
        forecastDay.classList.add("forecast-day");

        const date = new Date(day.dt_txt).toDateString();
        const temp = `${day.main.temp} °C`;
        const desc = day.weather[0].description;
        const icon = `http://openweathermap.org/img/w/${day.weather[0].icon}.png`;

        forecastDay.innerHTML = `
            <p>${date}</p>
            <p>${temp}</p>
            <p>${desc}</p>
            <img src="${icon}" alt="${desc}">
        `;

        forecastContainer.appendChild(forecastDay);
    });
}
