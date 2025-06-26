<div class="section-stopwatch disabled">
    <div class="section-top">
        <div class="tool-options-wrapper">
            <div class="tool-options-content body-title">
                <div class="header-button"
                    data-action="start"
                    data-translate="play"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">play_arrow</span>
                </div>
                <div class="header-button"
                    data-action="stop"
                    data-translate="stop"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">pause</span>
                </div>
                 <div class="header-button"
                    data-action="lap"
                    data-translate="lap"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">skip_next</span>
                </div>
                <div class="header-button"
                    data-action="reset"
                    data-translate="reset"
                    data-translate-category="tooltips"
                    data-translate-target="tooltip">
                    <span class="material-symbols-rounded">refresh</span>
                </div>
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
            <div class="tool-stopwatch">
                <span>00:00:00.00</span>
            </div>
        </div>
    </div>
    <div class="section-bottom" style="display: none;">
        <table class="laps-table body-title">
            <thead>
                <tr>
                    <th data-translate="lap_header" data-translate-category="stopwatch">Vuelta</th>
                    <th data-translate="time_header" data-translate-category="stopwatch">Tiempo</th>
                    <th data-translate="total_time_header" data-translate-category="stopwatch">Tiempo Total</th>
                </tr>
            </thead>
            <tbody>
                </tbody>
        </table>
    </div>
</div>

<style>
    .laps-table {
        width: 100%;
        border-collapse: collapse;
    }
    .laps-table th, .laps-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #00000020;
    }
    .dark-mode .laps-table th, .dark-mode .laps-table td {
        border-bottom: 1px solid #ffffff20;
    }


      .laps-table tbody tr:hover {
        background-color: #f5f5fa;
    }
    .dark-mode   .laps-table tbody tr:hover {
        background-color: #ffffff20;
    }
    .laps-table tbody tr:last-child td {
        border-bottom: none;
    }
</style>