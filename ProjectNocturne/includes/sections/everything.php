<div class="section-everything body-title active">
    <div class="everything-grid-container">
    </div>
</div>
<style>
  /* /assets/css/sections/everything.css - Diseño Mejorado 
   Actualización necesaria en everything-controller.js */
.section-everything {
    padding: 18px;
    flex-direction: column;
    gap: 18px;
}

.everything-grid-container {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.widget {
    border-radius: 12px;
    padding: 18px;
    border: 1px solid #00000020;
    background-color: #ffffff;
    /* Indica que los widgets son movibles */
}

.widget.sortable-chosen {
    cursor: grabbing;
}

.dark-mode .widget {
    border: 1px solid #ffffff20;
    background-color: #2e2f31;
}

/* Widget Clock - Ocupa todo el ancho */
.widget-clock {
    width: 100%;
    order: 1; /* Asegura que aparezca primero */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    min-height: 250px;
    margin-bottom: 8px; /* Separación adicional del resto */
}

/* Contenedor de los otros widgets */
.widgets-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 18px;
    order: 2; /* Aparece después del reloj */
}

/* Widgets que van en la fila inferior */
.widget:not(.widget-clock) {
    /* Estos widgets irán dentro del .widgets-row */
}

.widget-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.widget-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #00000020;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: #000;
    flex-shrink: 0;
}

.dark-mode .widget-icon {
    border-color: #ffffff20;
    color: #fff;
}

.widget-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1d1d1f;
}

.dark-mode .widget-title {
    color: #f5f5f7;
}

.clock-content {
    text-align: center;
}

.clock-time {
    font-size: 4rem;
    font-weight: 700;
    color: #1d1d1f;
}

.clock-date {
    font-size: 1.2rem;
    color: #000000e6;
}

.dark-mode .clock-time {
    color: #f5f5f7;
}

.dark-mode .clock-date {
    color: #8d8d92;
}

.widget-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.widget-list-item {
    display: flex;
    align-items: center;
    height: 50px;
    gap: 12px;
    border-radius: 8px;
    transition: background-color 0.2s ease;
    cursor: pointer;
}

.widget-list-item:hover {
    background-color: #f5f5fa;
}

.dark-mode .widget-list-item:hover {
    background-color: #3a3a3c;
}

.widget-list-item-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 24px;
    color: #6e6e73;
}

.dark-mode .widget-list-item-icon {
    color: #8d8d92;
}

.widget-list-item-details {
    flex-grow: 1;
    flex-direction: column;
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.widget-list-item-title {
    font-weight: 500;
    color: #1d1d1f;
}

.dark-mode .widget-list-item-title {
    color: #f5f5f7;
}

.widget-list-item-value {
    font-size: 12px;
    font-weight: 500;
    color: #000000e6;
}

.dark-mode .widget-list-item-value {
    color: #8d8d92;
}

.actions-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.action-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding: 0 16px;
    border-radius: 12px;
    background-color: transparent;
    border: 1px solid #00000020;
    cursor: pointer;
    transition: background-color 0.2s ease;
    height: 50px;
}

.dark-mode .action-card {
    border-color: #ffffff20;
}

.action-card:hover {
    background-color: #f5f5fa;
}

.dark-mode .action-card:hover {
    background-color: #3a3a3c;
}

.action-card-icon {
    font-size: 24px;
    margin-right: 12px;
    margin-bottom: 0;
}

.action-card-label {
    font-weight: 500;
    font-size: 0.9rem;
    color: #1d1d1f;
}

.dark-mode .action-card-label {
    color: #f5f5f7;
}

/* Media queries actualizadas */
@media (max-width: 768px) {
    .section-everything {
        padding: 14px;
        gap: 14px;
    }
    
    .everything-grid-container {
        gap: 14px;
    }
    
    .widgets-row {
        grid-template-columns: 1fr; /* Una columna en móvil */
        gap: 14px;
    }
    
    .widget-clock {
        min-height: 200px; /* Menor altura en móvil */
        margin-bottom: 4px;
    }
    
    .clock-time {
        font-size: 3rem; /* Texto más pequeño en móvil */
    }
    
    .clock-date {
        font-size: 1rem;
    }
}

@media (max-width: 480px) {
    .section-everything {
        padding: 12px;
        gap: 12px;
    }
    
    .everything-grid-container {
        gap: 12px;
    }
    
    .widgets-row {
        gap: 12px;
    }
    
    .widget {
        padding: 14px;
    }
    
    .widget-clock {
        min-height: 180px;
    }
    
    .clock-time {
        font-size: 2.5rem;
    }
}
</style>