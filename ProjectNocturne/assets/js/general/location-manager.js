// /assets/js/tools/location-manager.js

import { getTranslation, translateElementTree } from '../general/translations-controller.js';

const LOCATION_STORAGE_KEY = 'user-location';
const IPWHO_API_URL = 'https://ipwho.is/';

const state = {
    isInitialized: false,
    isLoading: false,
    selectedCountry: null,
    countries: [],
};

/**
 * Inicializa el gestor de ubicación.
 */
async function initLocationManager() {
    if (state.isInitialized) return;

    try {
        await loadCountriesLibrary();
        loadStoredLocation();
        await detectLocationIfNotSet();
        populateLocationMenu();
        addEventListeners();
        updateLocationDisplay();
    } catch (error) {
        console.error("❌ Error initializing Location Manager:", error);
    } finally {
        state.isInitialized = true;
    }
}

/**
 * Carga la librería de países y zonas horarias si no está presente.
 */
function loadCountriesLibrary() {
    return new Promise((resolve, reject) => {
        if (window.ct) {
            state.countries = Object.values(window.ct.getAllCountries()).sort((a, b) => a.name.localeCompare(b.name));
            return resolve(window.ct);
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/manuelmhtr/countries-and-timezones@latest/dist/index.min.js';
        script.onload = () => {
            if (window.ct) {
                state.countries = Object.values(window.ct.getAllCountries()).sort((a, b) => a.name.localeCompare(b.name));
                resolve(window.ct);
            } else {
                reject(new Error("Library loaded but 'ct' object not found"));
            }
        };
        script.onerror = (error) => reject(new Error('Failed to load countries-and-timezones script'));
        document.head.appendChild(script);
    });
}

/**
 * Carga la ubicación guardada desde localStorage.
 */
function loadStoredLocation() {
    const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (storedLocation) {
        try {
            state.selectedCountry = JSON.parse(storedLocation);
            console.log("📍 Ubicación cargada desde localStorage:", state.selectedCountry);
        } catch (error) {
            console.error("Error parsing stored location:", error);
            state.selectedCountry = null;
        }
    }
}

/**
 * Detecta la ubicación del usuario a través de su IP si no hay una guardada.
 */
async function detectLocationIfNotSet() {
    if (state.selectedCountry || state.isLoading) return;

    console.log("✈️ No location set. Detecting via IP...");
    state.isLoading = true;
    showLoadingState(true);

    try {
        const response = await fetch(IPWHO_API_URL);
        if (!response.ok) {
            throw new Error(`IPWHO API request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.country_code) {
            const country = state.countries.find(c => c.id === data.country_code);
            if (country) {
                console.log(`✅ País detectado: ${country.name} (${country.id})`);
                setCountry({ code: country.id, name: country.name });
            }
        }
    } catch (error) {
        console.error("Error detecting location from IP:", error);
    } finally {
        state.isLoading = false;
        showLoadingState(false);
    }
}

/**
 * Establece el país seleccionado y lo guarda.
 * @param {object} country - El objeto del país { code, name }.
 */
function setCountry(country) {
    state.selectedCountry = country;
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(country));
    updateLocationDisplay();
    highlightSelectedCountryInMenu();
    console.log(`País seleccionado: ${country.name}`);
}

/**
 * Rellena el menú desplegable con la lista de países.
 */
function populateLocationMenu() {
    const menuList = document.querySelector('.menu-control-center[data-menu="location"] .menu-list');
    if (!menuList) return;

    menuList.innerHTML = ''; // Limpiar lista
    state.countries.forEach(country => {
        const link = document.createElement('div');
        link.className = 'menu-link';
        link.dataset.countryCode = country.id;
        link.dataset.countryName = country.name;

        link.innerHTML = `
            <div class="menu-link-icon"><span class="material-symbols-rounded">flag</span></div>
            <div class="menu-link-text"><span>${country.name}</span></div>
        `;
        menuList.appendChild(link);
    });

    highlightSelectedCountryInMenu();
}

/**
 * Resalta el país actualmente seleccionado en la lista del menú.
 */
function highlightSelectedCountryInMenu() {
    const menuList = document.querySelector('.menu-control-center[data-menu="location"] .menu-list');
    if (!menuList) return;

    menuList.querySelectorAll('.menu-link').forEach(link => link.classList.remove('active'));

    if (state.selectedCountry) {
        const activeLink = menuList.querySelector(`.menu-link[data-country-code="${state.selectedCountry.code}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

/**
 * Actualiza el texto que muestra la ubicación actual.
 */
function updateLocationDisplay() {
    const displayElement = document.querySelector('.menu-link[data-toggle="location"] .current-location-value');
    if (displayElement) {
        displayElement.textContent = state.selectedCountry ? state.selectedCountry.name : getTranslation('none_selected', 'menu');
    }
}

/**
 * Muestra u oculta el estado de carga en el menú.
 */
function showLoadingState(isLoading) {
    const displayElement = document.querySelector('.menu-link[data-toggle="location"] .current-location-value');
    if (displayElement) {
        if (isLoading) {
            displayElement.textContent = getTranslation('detecting', 'menu');
        } else {
            updateLocationDisplay();
        }
    }
}

/**
 * Filtra la lista de países según el texto de búsqueda.
 * @param {string} query - El texto a buscar.
 */
function filterCountryList(query) {
    const normalizedQuery = query.toLowerCase().trim();
    const menuList = document.querySelector('.menu-control-center[data-menu="location"] .menu-list');
    if (!menuList) return;

    const links = menuList.querySelectorAll('.menu-link');
    links.forEach(link => {
        const countryName = link.dataset.countryName.toLowerCase();
        if (countryName.includes(normalizedQuery)) {
            link.style.display = 'flex';
        } else {
            link.style.display = 'none';
        }
    });
}

/**
 * Añade los event listeners para el menú de ubicación.
 */
function addEventListeners() {
    const locationMenu = document.querySelector('.menu-control-center[data-menu="location"]');
    if (locationMenu) {
        // Listener para la lista de países
        locationMenu.querySelector('.menu-list').addEventListener('click', (e) => {
            const link = e.target.closest('.menu-link');
            if (link && link.dataset.countryCode) {
                e.preventDefault();
                setCountry({
                    code: link.dataset.countryCode,
                    name: link.dataset.countryName
                });
            }
        });

        // Listener para el input de búsqueda (actualizado al ID corregido)
        const searchInput = locationMenu.querySelector('#location-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterCountryList(e.target.value);
            });
        }
    }

    document.addEventListener('languageChanged', () => {
        updateLocationDisplay();
    });
}

// Exporta la función de inicialización para ser llamada desde init-app.js
export { initLocationManager };