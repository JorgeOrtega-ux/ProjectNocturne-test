import { use24HourFormat } from '../general/main.js';

let clockInterval = null;

function updateLocalTime() {
    const alarmClockElement = document.querySelector('.tool-alarm span');

    if (alarmClockElement) {
        const now = new Date();
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !use24HourFormat
        };
        alarmClockElement.textContent = now.toLocaleTimeString(navigator.language, options);
    }
}

function startClock() {
    if (clockInterval) {
        return;
    }
    updateLocalTime();
    clockInterval = setInterval(updateLocalTime, 1000);
}

export function initializeAlarmClock() {
    startClock();
}