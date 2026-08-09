/*
=========================================================
BUSCADOR POR NOMBRE
Búsqueda independiente del resto de filtros: si hay texto
escrito, se bloquean los filtros normales y se filtra
únicamente por el nombre del solar. El contador de
"solares disponibles" se actualiza en tiempo real mientras
se escribe.
=========================================================
*/

let busquedaNombreSolar = "";

function hayBusquedaNombreActiva() {
    return busquedaNombreSolar.trim().length > 0;
}

function obtenerResultadosPorNombre() {
    const termino = busquedaNombreSolar.trim().toLowerCase();
    if (!termino) return [];
    return database.solares.filter(solar =>
        (solar.nombre || "").toLowerCase().includes(termino)
    );
}

// ── Sobrescribimos obtenerResultadosBusqueda (definida en filterLogic.js) para
//    que, cuando la búsqueda por nombre esté activa, se use en su lugar en
//    toda la web (listado de resultados, contador total, etc.) sin tocar
//    filterLogic.js ──
const _obtenerResultadosBusquedaOriginal = obtenerResultadosBusqueda;
obtenerResultadosBusqueda = function () {
    if (hayBusquedaNombreActiva()) {
        return obtenerResultadosPorNombre();
    }
    return _obtenerResultadosBusquedaOriginal();
};

function actualizarContadorPorNombre(termino) {
    const contenedor = document.getElementById("contadorSolaresFiltro");
    if (!contenedor) return;

    const total = obtenerResultadosPorNombre().length;

    if (total === 0) {
        contenedor.innerHTML = `
            <div style="background: rgba(229,57,53,0.18); border: 1px solid var(--color-error); padding: 12px 18px; border-radius: var(--radio-normal); display: inline-block;">
                ⚠️ <strong style="color: var(--color-error);">0 solares encontrados</strong> con el nombre "${termino}".<br>
                <span style="font-size: 0.95rem; opacity: 0.9;">Prueba con otro nombre o parte de él.</span>
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
                🏡 Solares que coinciden con "${termino}": 
                <strong style="color: var(--color-resaltado); font-size: 1.25rem;">${total}</strong>
            </span>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("inputBuscarNombreSolar");
    if (!input) return;

    input.addEventListener("input", () => {

        busquedaNombreSolar = input.value;
        const activa = hayBusquedaNombreActiva();

        // Bloquear/desbloquear visualmente los botones de filtro normales
        document.querySelectorAll(".botonFiltro").forEach(boton => {
            boton.classList.toggle("filtroBloqueado", activa);
        });

        if (activa) {

            // Al usar la búsqueda por nombre, se eliminan los filtros normales aplicados
            if (typeof eliminarTodosLosFiltros === "function") {
                eliminarTodosLosFiltros();
            }
            if (typeof cerrarPanelFiltro === "function") {
                cerrarPanelFiltro();
            }
            if (typeof actualizarBotonesFiltros === "function") {
                actualizarBotonesFiltros();
            }
            if (typeof actualizarZonaBorrar === "function") {
                actualizarZonaBorrar();
            }

            // Se llama al final para que este contador sea el que quede visible
            actualizarContadorPorNombre(busquedaNombreSolar.trim());

        } else {

            if (typeof actualizarContadorSolares === "function") {
                actualizarContadorSolares();
            }

        }

    });

});

console.log("✔ buscadorNombre cargado");