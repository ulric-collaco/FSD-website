const form = document.getElementById("weatherForm");
const locationInput = document.getElementById("location");
const locationChips = document.querySelectorAll(".location-chip");
const checkBtn = document.getElementById("checkBtn");
const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const resultVerdict = document.getElementById("resultVerdict");
const resultDate = document.getElementById("resultDate");
const resultPop = document.getElementById("resultPop");
const resultRain = document.getElementById("resultRain");
const resultTemp = document.getElementById("resultTemp");
const resultHumidity = document.getElementById("resultHumidity");
const resultCondition = document.getElementById("resultCondition");

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.style.color = isError ? "#b91c1c" : "#0369a1";
}

function getWeatherDescription(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm with hail"
  };

  return map[code] || "Unknown";
}

function showResult(cityName, tomorrow) {
  const popPercent = Math.round(tomorrow.precipitation_probability_max || 0);
  const rainVolume = typeof tomorrow.rain_sum === "number" ? `${tomorrow.rain_sum} mm` : "0 mm";
  const condition = getWeatherDescription(tomorrow.weather_code);

  const rainy = popPercent >= 50 || (tomorrow.rain_sum || 0) > 0;

  resultTitle.textContent = `Forecast for ${cityName}`;
  resultVerdict.textContent = rainy
    ? "Yes, rain is likely tomorrow."
    : "No, rain is unlikely tomorrow.";

  resultVerdict.classList.remove("rain", "no-rain");
  resultVerdict.classList.add(rainy ? "rain" : "no-rain");

  resultDate.textContent = tomorrow.date;
  resultPop.textContent = `${popPercent}%`;
  resultRain.textContent = rainVolume;
  resultTemp.textContent = `${Math.round(tomorrow.temperature_2m_max)} C`;
  resultHumidity.textContent = `${Math.round(tomorrow.relative_humidity_2m_mean)}%`;
  resultCondition.textContent = condition;

  resultBox.classList.remove("hidden");
}

async function fetchCoordinates(location) {
  const geoUrl = "https://geocoding-api.open-meteo.com/v1/search";
  let data;

  try {
    const response = await axios.get(geoUrl, {
      params: {
        name: location,
        count: 1,
        language: "en",
        format: "json"
      }
    });
    data = response.data;
  } catch (error) {
    throw new Error("Failed to fetch location coordinates.");
  }

  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found. Try city name, e.g. Mumbai.");
  }

  return data.results[0];
}

async function fetchTomorrowForecast(lat, lon) {
  const forecastUrl = "https://api.open-meteo.com/v1/forecast";
  let data;

  try {
    const response = await axios.get(forecastUrl, {
      params: {
        latitude: lat,
        longitude: lon,
        daily: "precipitation_probability_max,rain_sum,temperature_2m_max,relative_humidity_2m_mean,weather_code",
        timezone: "auto"
      }
    });
    data = response.data;
  } catch (error) {
    throw new Error("Failed to fetch weather data.");
  }

  if (!data.daily || !data.daily.time || data.daily.time.length < 2) {
    throw new Error("Tomorrow forecast is not available.");
  }

  return {
    date: data.daily.time[1],
    precipitation_probability_max: data.daily.precipitation_probability_max[1],
    rain_sum: data.daily.rain_sum[1],
    temperature_2m_max: data.daily.temperature_2m_max[1],
    relative_humidity_2m_mean: data.daily.relative_humidity_2m_mean[1],
    weather_code: data.daily.weather_code[1]
  };
}

async function runForecastCheck(location) {
  const trimmedLocation = location.trim();

  if (!trimmedLocation) {
    setStatus("Please enter location.", true);
    return;
  }

  checkBtn.disabled = true;
  setStatus("Checking tomorrow forecast...");
  resultBox.classList.add("hidden");

  try {
    const geo = await fetchCoordinates(trimmedLocation);
    const tomorrow = await fetchTomorrowForecast(geo.latitude, geo.longitude);
    const cityLabel = geo.admin1
      ? `${geo.name}, ${geo.admin1}, ${geo.country_code}`
      : `${geo.name}, ${geo.country_code}`;

    showResult(cityLabel, tomorrow);
    setStatus("Forecast loaded successfully.");
  } catch (error) {
    setStatus(error.message || "Something went wrong.", true);
  } finally {
    checkBtn.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runForecastCheck(locationInput.value);
});

locationChips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    const selectedLocation = chip.dataset.location;
    if (!selectedLocation) {
      return;
    }

    locationInput.value = selectedLocation;
    await runForecastCheck(selectedLocation);
  });
});

window.addEventListener("DOMContentLoaded", async () => {
  const defaultLocation = "Mumbai";
  locationInput.value = defaultLocation;
  await runForecastCheck(defaultLocation);
});
