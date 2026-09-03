/*
=========================================================
FILTERS
Conecta toda la lógica del filtrador.
=========================================================
*/

document.addEventListener("DOMContentLoaded", iniciarFiltros);

document
.getElementById("borrarFiltros")
.addEventListener("click",()=>{

    abrirVentana("ventanaConfirmarBorrar");

});



function iniciarFiltros() {

    document
    .querySelectorAll(".botonFiltro")
    .forEach(boton => {

        boton.addEventListener("click", () => {

            abrirFiltro(boton.dataset.filtro);

            mostrarPanelFiltro();

        });

    });






    document
    .getElementById("confirmarBorrar")
    .addEventListener("click", () => {

        eliminarTodosLosFiltros();

        actualizarBotonesFiltros();

        actualizarZonaBorrar();

        cerrarVentana("ventanaConfirmarBorrar");

        abrirVentana("ventanaBuscador");

        // Limpiar la URL (sin filtros, volver al slug estático)
        if (!window._restaurandoFiltrador && typeof actualizarURLFiltrador === "function") {
            actualizarURLFiltrador(false);
        }

        if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_ACCION", {
                accion: "FILTROS_SOLARES_STATE",
                payload: { estadoFiltros: {} }
            });
        }

    });






    document
    .getElementById("cancelarBorrar")
    .addEventListener("click", () => {

        cerrarVentana("ventanaConfirmarBorrar");

        abrirVentana("ventanaBuscador");

    });






    actualizarBotonesFiltros();

    actualizarZonaBorrar();

}



console.log("✔ filters cargado");