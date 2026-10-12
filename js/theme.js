/*
=========================================================
THEME
Gestiona el alternado entre modo día y modo noche.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const body = document.body;

    const botonModo = document.getElementById("botonModo");

    const urlParams = new URLSearchParams(window.location.search);
    const pModo = urlParams.get("previewModo");
    const modoGuardado = pModo || localStorage.getItem("modoTema");

    if (modoGuardado === "dia") {

        body.classList.remove("modo-noche");
        body.classList.add("modo-dia");

    } else {

        // Por defecto (o si no hay nada guardado aún): modo noche
        body.classList.remove("modo-dia");
        body.classList.add("modo-noche");

    }

    botonModo?.addEventListener("click", () => {

        const esNoche = body.classList.contains("modo-noche");

        if (esNoche) {
            body.classList.remove("modo-noche");
            body.classList.add("modo-dia");
            localStorage.setItem("modoTema", "dia");
        } else {
            body.classList.remove("modo-dia");
            body.classList.add("modo-noche");
            localStorage.setItem("modoTema", "noche");
        }

        if (window.TemasEstacionales) {
            if (typeof window.TemasEstacionales.onCambioModoDiaNoche === "function") {
                window.TemasEstacionales.onCambioModoDiaNoche();
            } else if (typeof window.TemasEstacionales.aplicarRecursosPantallaCarga === "function") {
                window.TemasEstacionales.aplicarRecursosPantallaCarga();
            }
        }

        if (typeof window.ocultarResumenSolar === "function") window.ocultarResumenSolar();
        const tf = document.getElementById("tooltipFiltro");
        if (tf) tf.style.display = "none";
        const to = document.getElementById("tooltipOpciones");
        if (to) to.style.display = "none";
    });

});

/* =========================================================
   CONTROL DESLIZANTE (RANGE SLIDERS) - RELLENO DINÁMICO
   Calcula matemáticamente el porcentaje real (min, max, val)
   y actualiza --progreso-slider para pintar el recorrido.
   ========================================================= */
function actualizarProgresoSlider(slider) {
    if (!slider || slider.type !== 'range') return;
    const min = parseFloat(slider.min !== '' ? slider.min : 0);
    const max = parseFloat(slider.max !== '' ? slider.max : 100);
    const val = parseFloat(slider.value !== '' ? slider.value : min);
    const pct = (max > min) ? Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100)) : 0;
    slider.style.setProperty('--progreso-slider', pct.toFixed(2) + '%');
}
window.actualizarProgresoSlider = actualizarProgresoSlider;

window.actualizarTodosLosSliders = function(contexto = document) {
    try {
        contexto.querySelectorAll('input[type="range"]').forEach(actualizarProgresoSlider);
    } catch (e) {}
};

// Delegación ligera sobre document: responde inmediatamente a arrastrar y soltar
document.addEventListener('input', (e) => {
    if (e.target && e.target.type === 'range') {
        actualizarProgresoSlider(e.target);
    }
}, { passive: true });

document.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'range') {
        actualizarProgresoSlider(e.target);
    }
}, { passive: true });

// Inicializar en DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.actualizarTodosLosSliders());
} else {
    window.actualizarTodosLosSliders();
}

console.log("✔ theme cargado");