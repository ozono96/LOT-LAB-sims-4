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