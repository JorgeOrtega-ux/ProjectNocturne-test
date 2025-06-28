<div class="section-alarm disabled">
    <div class="section-top">
        <div class="tool-options-wrapper">
            <div class="tool-options-content body-title">
                <div class="header-button"
                    data-module="toggleMenuAlarm"
                    data-translate="add_alarm"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">add_alarm</span>
                </div>
                <div class="zoneInfoTool" data-timezone-alarm></div>
            </div>
            <div class="tool-options-content body-title">
                <div class="increse-font-zise">
                    <div class="increse-font-zise-left"
                        data-translate="remove"
                        data-translate-category="tooltips"
                        data-translate-target="tooltip">
                        <span class="material-symbols-rounded">remove</span>
                    </div>
                    <div class="increse-font-zise-center">--</div>
                    <div class="increse-font-zise-right"
                        data-translate="add"
                        data-translate-category="tooltips"
                        data-translate-target="tooltip">
                        <span class="material-symbols-rounded">add</span>
                    </div>
                </div>
                <div class="header-button"
                    data-module="togglePaletteColors"
                    data-translate="color"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">palette</span>
                </div>
                <div class="header-button"
                    data-action="toggleBoldMode"
                    data-translate="bold"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">format_bold</span>
                </div>
                <div class="header-button"
                    data-action="toggleItalicMode"
                    data-translate="italic"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">format_italic</span>
                </div>
                <div class="separator"></div>
                <div class="header-button"
                    data-action="toggleFullScreen"
                    data-translate="fullscreen"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">fullscreen</span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-center">
        <div class="tool-content">
            <div class="tool-alarm">
                <span>00:00:00</span>
            </div>
        </div>
    </div>
    <div class="section-bottom">
        <div class="alarms-list-wrapper">
            <div class="alarms-container" data-container="user">
                <div class="alarms-header" onclick="window.alarmManager.toggleAlarmsSection('user')">
                    <div class="alarms-header-left">
                        <div class="alarms-header-icon">
                            <span class="material-symbols-rounded">alarm</span>
                        </div>
                        <h3 data-translate="my_alarms" data-translate-category="alarms">Mis Alarmas</h3>
                    </div>
                    <div class="alarms-header-right">
                        <span class="alarm-count-badge" data-count-for="user">0</span>
                        <button class="collapse-alarms-btn">
                            <span class="material-symbols-rounded expand-icon">expand_more</span>
                        </button>
                    </div>
                </div>
                <div class="alarms-grid" data-alarm-grid="user"></div>
            </div>
            <div class="alarms-container" data-container="default">
                <div class="alarms-header" onclick="window.alarmManager.toggleAlarmsSection('default')">
                    <div class="alarms-header-left">
                        <div class="alarms-header-icon">
                            <span class="material-symbols-rounded">alarm_on</span>
                        </div>
                        <h3 data-translate="default_alarms" data-translate-category="alarms">Alarmas Predeterminadas</h3>
                    </div>
                    <div class="alarms-header-right">
                        <span class="alarm-count-badge" data-count-for="default">0</span>
                        <button class="collapse-alarms-btn">
                            <span class="material-symbols-rounded expand-icon">expand_more</span>
                        </button>
                    </div>
                </div>
                <div class="alarms-grid" data-alarm-grid="default"></div>
            </div>
        </div>
    </div>
</div>