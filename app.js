/**
 * ==========================================================================
 * REAL-TIME WEATHER DASHBOARD CORE PIPELINE ENGINE
 * Architectural Framework: Vanillajs Asynchronous Operations Layer + WebGL
 * ==========================================================================
 */

const apiKey = "43ec5faff1cc75c6c7db7c79d7e0a98b";

// Global lifecycle controllers
let debounceTimer = null;
let activeAbortController = null;

// Memory caching system parameters
const weatherCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; 

// ==========================================================================
// WEBGL 3D GLOBE ENGINE INITIALIZATION
// ==========================================================================
const globeCanvas = document.getElementById('globe-viz');
let worldGlobe = null;

if (globeCanvas) {
    worldGlobe = Globe()(globeCanvas)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg') // High-contrast dark mode earth
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundColor('#070a13') // Matches your deep space background
        .pointOfView({ altitude: 2.5 });

    // Idle rotation when waiting for input
    worldGlobe.controls().autoRotate = true;
    worldGlobe.controls().autoRotateSpeed = 0.8;
    worldGlobe.controls().enableZoom = false; // Locks the mouse wheel so the page doesn't scroll wildly
}

function updateGlobeLocation(lat, lng) {
    if (!worldGlobe) return;
    
    // Stop auto-rotation to focus on the target
    worldGlobe.controls().autoRotate = false;

    // Inject the blinking beacon at the exact API coordinates
    worldGlobe.ringsData([{ lat: lat, lng: lng }])
        .ringColor(() => '#6366f1') // Your CSS accent color
        .ringMaxRadius(6)
        .ringPropagationSpeed(3)
        .ringRepeatPeriod(800);

    // Execute 2-second cinematic flight path to the city
    worldGlobe.pointOfView({ lat: lat, lng: lng, altitude: 1.2 }, 2000);
}


/**
 * CORE ASYNC ORCHESTRATOR
 */
async function fetchWeather(city) {
    const normalizedCity = city.toLowerCase().trim();

    if (weatherCache.has(normalizedCity)) {
        const cachedEntry = weatherCache.get(normalizedCity);
        const systemTimeNow = Date.now();

        if (systemTimeNow - cachedEntry.timestamp < CACHE_TTL_MS) {
            console.log(`%c [Cache Hit] serving data for: "${city}" instantly from memory.`, 'color: #4caf50; font-weight: bold;');
            renderWeatherDashboard(cachedEntry.payload);
            return;
        } else {
            weatherCache.delete(normalizedCity);
        }
    }

    if (activeAbortController) {
        activeAbortController.abort();
    }

    activeAbortController = new AbortController();
    const { signal } = activeAbortController;

    try {
        const targetEndpoint = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(normalizedCity)}&units=metric&appid=${apiKey}`;
        
        const response = await fetch(targetEndpoint, { signal });

        if (!response.ok) {
            throw new Error("Location not recognized by server. Check syntax.");
        }

        const data = await response.json();
        
        weatherCache.set(normalizedCity, {
            timestamp: Date.now(),
            payload: data
        });

        renderWeatherDashboard(data);

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log(`%c Stream pipeline successfully torn down for city: "${city}".`, 'color: #4fc3f7;');
        } else {
            console.error('System exception event handled:', error);
            alert(error.message);
        }
    } finally {
        if (activeAbortController?.signal === signal) {
            activeAbortController = null;
        }
    }
}

/**
 * TELEMETRY VISUALIZATION LAYER
 */
function renderWeatherDashboard(data) {
    const weatherInfo = document.getElementById("weather-info");
    const welcomeMsg = document.getElementById("welcome-msg");

    // Map Core Text Metrics
    document.getElementById("city-display").innerText = data.name;
    document.getElementById("temp-display").innerText = Math.round(data.main.temp);
    document.getElementById("desc-display").innerText = data.weather[0].description;
    document.getElementById("humidity-display").innerText = `${data.main.humidity}%`;
    document.getElementById("wind-display").innerText = `${data.wind.speed} m/s`;
    document.getElementById("date-display").innerText = new Date().toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
    });

    // Hardware-Accelerated Vector Compass
    document.documentElement.style.setProperty('--wind-direction', `${data.wind.deg}deg`);

    // Astronomical Daylight Tracking
    calculateAstroCycleTrack(data.dt, data.sys.sunrise, data.sys.sunset);

    // Hazard Evaluations
    evaluateSystemSafetyAlerts(data.weather[0].id);

    // Theme Injection
    const coreWeatherCondition = data.weather[0].main.toLowerCase();
    document.body.className = ""; 
    document.body.classList.add(`weather-${coreWeatherCondition}`);

    // TRIGGER GLOBE TRACKING
    if (data.coord) {
        updateGlobeLocation(data.coord.lat, data.coord.lon);
    }

    // Viewport Toggle
    if (weatherInfo) weatherInfo.classList.remove("hidden");
    if (welcomeMsg) welcomeMsg.classList.add("hidden");
}

function calculateAstroCycleTrack(currentTime, sunriseTimestamp, sunsetTimestamp) {
    const astroDisplayElement = document.getElementById("astro-display");
    if (!astroDisplayElement) return;

    if (currentTime > sunsetTimestamp) {
        astroDisplayElement.innerText = "Night cycle active (Sun set)";
    } else if (currentTime < sunriseTimestamp) {
        astroDisplayElement.innerText = "Pre-dawn tracking active";
    } else {
        const spanTotal = sunsetTimestamp - sunriseTimestamp;
        const currentProgress = currentTime - sunriseTimestamp;
        const progressPercentage = Math.round((currentProgress / spanTotal) * 100);
        astroDisplayElement.innerText = `Daylight window tracking: ${progressPercentage}% complete`;
    }
}

function evaluateSystemSafetyAlerts(conditionId) {
    const alertSystemBanner = document.getElementById("severe-alert-system");
    if (!alertSystemBanner) return;

    const matchesSevereThunderstormRange = (conditionId >= 200 && conditionId <= 232);
    const matchesExtremeTorrentialRain = (conditionId === 502 || conditionId === 503 || conditionId === 504);
    const matchesAtmosphericAnomalies = (conditionId >= 711 && conditionId <= 781); 

    if (matchesSevereThunderstormRange || matchesExtremeTorrentialRain || matchesAtmosphericAnomalies) {
        alertSystemBanner.innerText = "⚠️ SYSTEM ADVISORY: High-alert weather anomalies tracking across current sector.";
        alertSystemBanner.classList.remove("hidden");
    } else {
        alertSystemBanner.classList.add("hidden");
    }
}

function handleSearchInput(event) {
    const rawValue = event.target.value.trim();
    
    clearTimeout(debounceTimer);
    if (!rawValue) {
        // If they clear the input, start the globe spinning again
        if (worldGlobe) {
            worldGlobe.ringsData([]);
            worldGlobe.controls().autoRotate = true;
        }
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchWeather(rawValue);
    }, 450);
}

// EVENT HOOKS
const cityInputEl = document.getElementById("city-input");

if (cityInputEl) {
    cityInputEl.addEventListener("input", handleSearchInput);
    cityInputEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            const staticQuery = event.target.value.trim();
            if (!staticQuery) return;
            
            clearTimeout(debounceTimer);
            fetchWeather(staticQuery); 
        }
    });
}
