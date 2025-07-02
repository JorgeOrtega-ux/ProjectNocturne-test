// /assets/js/tools/location-manager.js

import { getTranslation, translateElementTree } from '../general/translations-controller.js';

// --- CONFIGURACIÓN Y ESTADO CENTRALIZADO ---
const LOCATION_STORAGE_KEY = 'user-location';
const IPWHO_API_URL = 'https://ipwho.is/';

const TIMING_CONFIG = {
    LOCATION_CHANGE_DURATION: 750, // Duración para la animación de carga
};

const state = {
    isInitialized: false,
    isLoading: false,
    isChanging: false,
    changeTimeout: null,
    pendingCountry: null,
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
 * Devuelve el objeto del país seleccionado actualmente.
 * @returns {object|null}
 */
function getCurrentLocation() {
    return state.selectedCountry;
}
window.getCurrentLocation = getCurrentLocation; // Expuesto globalmente

// --- SISTEMA DE CAMBIO DE UBICACIÓN CON ANIMACIÓN ---

/**
 * Inicia el proceso de cambio de país, incluyendo la UI de carga.
 * @param {object} country - El objeto del país { code, name } a aplicar.
 */
function applyCountryChange(country) {
    if (state.isChanging || (state.selectedCountry && state.selectedCountry.code === country.code)) {
        return Promise.resolve(false);
    }
    
    const previousCountry = state.selectedCountry;
    state.isChanging = true;
    state.pendingCountry = country;

    // --- MODIFICADO ---
    console.log(`✈️ Applying country change: ${country.name} (${country.code})`);
    setupCountryLoadingUI(country);

    return performCountryChange(country)
        .then(() => {
            if (state.isChanging && state.pendingCountry.code === country.code) {
                setCountry(country);
                completeCountryChange(country);
                return true;
            }
            return false;
        })
        .catch(error => {
            console.error('Error changing country:', error);
            revertCountryChange(previousCountry);
            return false;
        })
        .finally(() => {
            setTimeout(() => {
                state.isChanging = false;
                state.pendingCountry = null;
            }, 100);
        });
}

/**
 * Simula un retraso para la operación de cambio.
 */
function performCountryChange(country) {
    return new Promise((resolve, reject) => {
        state.changeTimeout = setTimeout(() => {
            if (state.isChanging && state.pendingCountry.code === country.code) {
                resolve();
            } else {
                reject(new Error('Country change was cancelled'));
            }
            state.changeTimeout = null;
        }, TIMING_CONFIG.LOCATION_CHANGE_DURATION);
    });
}

// --- FUNCIONES PARA MANEJAR LA UI DE CARGA ---

function getCountryLinks() {
    return document.querySelectorAll('.menu-control-center[data-menu="location"] .menu-list .menu-link[data-country-code]');
}

function setupCountryLoadingUI(newCountry) {
    const countryLinks = getCountryLinks();
    countryLinks.forEach(link => {
        const linkCountryCode = link.dataset.countryCode;
        if (linkCountryCode === newCountry.code) {
            link.classList.remove('active');
            link.classList.add('preview-active');
            addSpinnerToLink(link);
        } else {
            link.classList.remove('active', 'preview-active');
            link.classList.add('disabled-interactive');
        }
    });
}

function completeCountryChange(newCountry) {
    const countryLinks = getCountryLinks();
    countryLinks.forEach(link => {
        const linkCountryCode = link.dataset.countryCode;
        link.classList.remove('preview-active', 'disabled-interactive');
        removeSpinnerFromLink(link);

        if (linkCountryCode === newCountry.code) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function revertCountryChange(previousCountry) {
    const countryLinks = getCountryLinks();
    countryLinks.forEach(link => {
        const linkCountryCode = link.dataset.countryCode;
        link.classList.remove('preview-active', 'disabled-interactive');
        removeSpinnerFromLink(link);

        if (previousCountry && linkCountryCode === previousCountry.code) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// --- UTILIDADES DE SPINNER ---

function addSpinnerToLink(link) {
    removeSpinnerFromLink(link);
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'menu-link-icon menu-link-loader';
    loaderDiv.innerHTML = '<span class="material-symbols-rounded spinning">progress_activity</span>';
    link.appendChild(loaderDiv);
}

function removeSpinnerFromLink(link) {
    const loaderDiv = link.querySelector('.menu-link-loader');
    if (loaderDiv) {
        loaderDiv.remove();
    }
}

// --- FUNCIONES DE LÓGICA DE UBICACIÓN ---

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
        } catch (error) {
            state.selectedCountry = null;
        }
    }
}

/**
 * Detecta la ubicación del usuario a través de su IP si no hay una guardada.
 */
async function detectLocationIfNotSet() {
    if (state.selectedCountry || state.isLoading) return;

    state.isLoading = true;
    showLoadingState(true);

    try {
        const response = await fetch(IPWHO_API_URL);
        if (!response.ok) throw new Error(`IPWHO API request failed with status ${response.status}`);
        
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
    // --- MODIFICADO ---
    console.log(`País seleccionado: ${country.name} (${country.code})`);
}

/**
 * Rellena el menú desplegable con la lista de países.
 */
function populateLocationMenu() {
    const menuList = document.querySelector('.menu-control-center[data-menu="location"] .menu-list');
    if (!menuList) return;

    menuList.innerHTML = '';
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
        if (activeLink) activeLink.classList.add('active');
    }
}

/**
 * Actualiza el texto que muestra la ubicación actual.
 */
function updateLocationDisplay() {
    const locationLinkSpan = document.querySelector('.menu-link[data-toggle="location"] .menu-link-text span');
    if (locationLinkSpan) {
        const locationLabel = getTranslation('location', 'menu');
        const currentLocation = state.selectedCountry ? state.selectedCountry.name : getTranslation('none_selected', 'menu');
        const newText = `${locationLabel}: ${currentLocation}`;
        
        if (locationLinkSpan.textContent !== newText) {
            locationLinkSpan.textContent = newText;
        }
    }
}

/**
 * Muestra u oculta el estado de carga en el menú.
 */
function showLoadingState(isLoading) {
    const locationLinkSpan = document.querySelector('.menu-link[data-toggle="location"] .menu-link-text span');
    if (locationLinkSpan) {
        if (isLoading) {
            const locationLabel = getTranslation('location', 'menu');
            const detectingText = getTranslation('detecting', 'menu');
            const newText = `${locationLabel}: ${detectingText}`;
            locationLinkSpan.textContent = newText;
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
        link.style.display = countryName.includes(normalizedQuery) ? 'flex' : 'none';
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
            const link = e.target.closest('.menu-link[data-country-code]');
            if (link && link.dataset.countryCode) {
                e.preventDefault();
                applyCountryChange({
                    code: link.dataset.countryCode,
                    name: link.dataset.countryName
                });
            }
        });

        // Listener para el input de búsqueda
        const searchInput = locationMenu.querySelector('#location-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => filterCountryList(e.target.value));
        }
    }

    document.addEventListener('languageChanged', () => {
        updateLocationDisplay();
    });
}

// Exporta la función de inicialización para ser llamada desde otros módulos
export { initLocationManager, getCurrentLocation };