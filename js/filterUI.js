/*
=========================================================
FILTER UI
Toda la parte visual del filtrador.
=========================================================
*/

function mostrarPanelFiltro() {

    const nombre = obtenerFiltroAbierto();

    if (!nombre) return;

    const panel = document.getElementById("panelFiltro");

    const opciones = obtenerOpcionesDisponibles(nombre);

    panel.innerHTML = `

        <div class="contenidoFiltro">

            <h3>
                ${obtenerIconoFiltro(nombre)}
                ${obtenerNombreFiltro(nombre)}
            </h3>

            <div id="listaOpcionesFiltro" class="listaOpciones"></div>

            <div class="botonesPanelFiltro">

                <button id="confirmarFiltro">

                    ✅ Confirmar

                </button>

                <button id="eliminarFiltro">

                    🗑️ Eliminar filtro

                </button>

            </div>

        </div>

    `;

    const lista = document.getElementById("listaOpcionesFiltro");

    const esFiltroNombrePack = (nombre === "nombrePack");
    const esFiltroMundo = (nombre === "mundo");

    opciones.forEach(opcion => {

    const activo = filtroTieneValor(nombre, opcion);

    if (esFiltroNombrePack && typeof htmlBotonPackIcono === "function") {
        const tieneIcono = typeof rutaIconoPack === "function" && !!rutaIconoPack(opcion);
        if (!tieneIcono) {
            console.warn(`[ICONO PACK] Sin icono para: "${opcion}"`);
        }
        const html = htmlBotonPackIcono(opcion, "", `data-valor="${opcion}"`);
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const btn = tempDiv.firstElementChild;
        if (!activo) btn.classList.remove("seleccionada");
        lista.appendChild(btn);
    } else if (esFiltroMundo && typeof htmlBotonMundoIcono === "function") {
        const tieneIcono = typeof rutaIconoMundo === "function" && !!rutaIconoMundo(opcion);
        if (!tieneIcono) {
            console.warn(`[ICONO MUNDO] Sin icono para: "${opcion}"`);
        }
        const html = htmlBotonMundoIcono(opcion, "", `data-valor="${opcion}"`);
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const btn = tempDiv.firstElementChild;
        if (!activo) btn.classList.remove("seleccionada");
        lista.appendChild(btn);
    } else {
        lista.innerHTML += `
            <button
                class="opcionFiltro ${activo ? "seleccionada" : ""}"
                data-valor="${opcion}"
            >
                ${opcion}
            </button>
        `;
    }

});

    // Estilo extra para la lista cuando muestra iconos de pack
   if (esFiltroNombrePack || esFiltroMundo) {
        lista.style.justifyContent = "center";
        lista.style.gap = "10px";
        lista.style.flexWrap = "wrap";
    }





    lista
    .querySelectorAll(".opcionFiltro")
    .forEach(boton => {

        boton.addEventListener("click", () => {

            boton.classList.toggle("seleccionada");

        });

    });





    document
    .getElementById("confirmarFiltro")
    .addEventListener("click", confirmarFiltroUI);





    document
    .getElementById("eliminarFiltro")
    .addEventListener("click", eliminarFiltroUI);

}





function confirmarFiltroUI() {

    const filtro = obtenerFiltroAbierto();

    const valores = [];

    document
    .querySelectorAll(".opcionFiltro.seleccionada")
    .forEach(boton => {

        valores.push(

            boton.dataset.valor

        );

    });

    aplicarFiltro(

        filtro,

        valores

    );

    cerrarPanelFiltro();

    actualizarBotonesFiltros();

    actualizarZonaBorrar();

}





function eliminarFiltroUI() {

    eliminarFiltro(

        obtenerFiltroAbierto()

    );

    cerrarPanelFiltro();

    actualizarBotonesFiltros();

    actualizarZonaBorrar();

}





function cerrarPanelFiltro() {

    document
    .getElementById("panelFiltro")
    .innerHTML = "";

    cerrarFiltro();

}



function actualizarBotonesFiltros() {

    const tooltip = document.getElementById("tooltipFiltro");

    // ── Dependencia: Barrio solo disponible si hay Mundo filtrado ──
    const botonBarrio = document.querySelector('.botonFiltro[data-filtro="barrio"]');
    const hayMundoFiltrado = contarValoresFiltro("mundo") > 0;

    if (botonBarrio) {
        if (hayMundoFiltrado) {
            botonBarrio.style.display = "";
        } else {
            if (existeFiltro("barrio")) {
                eliminarFiltro("barrio");
            }
            botonBarrio.style.display = "none";
        }
    }

    document
    .querySelectorAll(".botonFiltro")
    .forEach(boton => {

        const nombre = boton.dataset.filtro;

        const total = contarValoresFiltro(nombre);

        boton.classList.remove("activo");

        boton.innerHTML = `

            ${obtenerIconoFiltro(nombre)}

            ${obtenerNombreFiltro(nombre)}

        `;

        if (total > 0) {

            boton.classList.add("activo");

            boton.innerHTML += `

                <br>

                <small>${total} seleccionados</small>

            `;

        }

        boton.onmouseenter = () => {

            const datos = obtenerDatosTooltip(nombre);

            tooltip.innerHTML = `

                <h4>${obtenerIconoFiltro(nombre)} ${datos.titulo}</h4>

                <p>${datos.descripcion}</p>

                <hr>

                <strong>Seleccionados:</strong>

                <p>${datos.seleccionados}</p>

            `;

            tooltip.style.display = "block";

        };

        boton.onmousemove = e => {

            tooltip.style.left = (e.clientX + 18) + "px";

            tooltip.style.top = (e.clientY + 18) + "px";

        };

        boton.onmouseleave = () => {

            tooltip.style.display = "none";

        };

    });

    actualizarContadorSolares();

}





function actualizarZonaBorrar(){

    const boton = document.getElementById("borrarFiltros");

    if(hayFiltros()){

        boton.style.display = "inline-flex";

    }else{

        boton.style.display = "none";

    }

    actualizarContadorSolares();

}

function actualizarContadorSolares() {
    const contenedor = document.getElementById("contadorSolaresFiltro");
    if (!contenedor) return;

    if (!database.solares || database.solares.length === 0) {
        contenedor.innerHTML = "";
        return;
    }

    if (!hayFiltros()) {
        contenedor.innerHTML = `<span style="opacity: 0.85;">Total de solares disponibles: <strong>${database.solares.length}</strong></span>`;
        return;
    }

    const total = typeof obtenerTotalResultados === "function" ? obtenerTotalResultados() : 0;

    if (total === 0) {
        contenedor.innerHTML = `
            <div style="background: rgba(229,57,53,0.18); border: 1px solid var(--color-error); padding: 12px 18px; border-radius: var(--radio-normal); display: inline-block;">
                ⚠️ <strong style="color: var(--color-error);">0 solares encontrados</strong> con estos criterios de búsqueda.<br>
                <span style="font-size: 0.95rem; opacity: 0.9;">Por favor, quita o modifica algún filtro.</span>
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
                🏡 Solares disponibles con estos criterios: 
                <strong style="color: var(--color-resaltado); font-size: 1.25rem;">${total}</strong>
            </span>
        `;
    }
}

document.addEventListener("datosCargados", actualizarContadorSolares);

console.log("✔ filterUI cargado");