// ==========================================================================
// WEBGL 3D GLOBE ENGINE INITIALIZATION
// ==========================================================================
const globeCanvas = document.getElementById('globe-viz');
let worldGlobe = null;

if (globeCanvas) {
    worldGlobe = Globe()(globeCanvas)
        // High-res Apple Maps style satellite texture
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg') 
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png') // Adds stars to the void
        .showAtmosphere(true) // Turns on the glowing halo
        .atmosphereColor('#3b82f6')
        .atmosphereAltitude(0.15)
        .pointOfView({ altitude: 2.5 });

    worldGlobe.controls().autoRotate = true;
    worldGlobe.controls().autoRotateSpeed = 0.8;
    worldGlobe.controls().enableZoom = false; 
}

function updateGlobeLocation(lat, lng) {
    if (!worldGlobe) return;
    
    worldGlobe.controls().autoRotate = false;

    worldGlobe.ringsData([{ lat: lat, lng: lng }])
        .ringColor(() => '#6366f1') 
        .ringMaxRadius(6)
        .ringPropagationSpeed(3)
        .ringRepeatPeriod(800);

    worldGlobe.pointOfView({ lat: lat, lng: lng, altitude: 1.2 }, 2000);
}

/* ... KEEP YOUR EXISTING fetchWeather and renderWeatherDashboard FUNCTIONS HERE ...
*/

// ==========================================================================
// SYSTEM EVENT WIRE HOOKS (UPDATED EXPLICIT SEARCH)
// ==========================================================================
const cityInputEl = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");

function executeSearch() {
    const query = cityInputEl.value.trim();
    
    // If input is empty, clear the marker and spin the globe again
    if (!query) {
        if (worldGlobe) {
            worldGlobe.ringsData([]);
            worldGlobe.controls().autoRotate = true;
        }
        return;
    }
    
    // Fire the API fetch
    fetchWeather(query);
}

if (searchBtn) {
    searchBtn.addEventListener("click", executeSearch);
}

if (cityInputEl) {
    cityInputEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            executeSearch();
        }
    });
}
