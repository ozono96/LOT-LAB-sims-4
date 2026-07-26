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
    const esFiltroTamano = (nombre === "tamaño");

    if (esFiltroTamano) {
        const arrTamanos = opciones.sort((a, b) => {
            const parseArea = str => {
                const m = str.match(/(\d+)\s*x\s*(\d+)/i);
                if (m) return parseInt(m[1]) * parseInt(m[2]);
                return 0;
            };
            return parseArea(a) - parseArea(b);
        });
        const valoresSeleccionados = (typeof filtrosActuales !== 'undefined' && filtrosActuales["tamaño"]) ? filtrosActuales["tamaño"] : [];
        const modoMultiple = valoresSeleccionados.length > 1;

        let valActualUnico = arrTamanos[0] || "-";
        if (!modoMultiple && valoresSeleccionados.length === 1) {
            valActualUnico = valoresSeleccionados[0];
        }

        let idxActual = arrTamanos.indexOf(valActualUnico);
        if (idxActual === -1) idxActual = 0;

        lista.innerHTML = `
            <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; width: 100%;">
                <button id="btnModoUnico" class="opcionFiltro ${!modoMultiple ? 'seleccionada' : ''}">Un solo tamaño</button>
                <button id="btnModoMultiple" class="opcionFiltro ${modoMultiple ? 'seleccionada' : ''}">Varios tamaños</button>
            </div>

            <div id="contenedorUnTamano" style="display: ${!modoMultiple ? 'block' : 'none'}; text-align: center; width: 100%;">
                <label for="sliderFiltroTamano" style="font-weight: bold; display: block; margin-bottom: 8px;">
                    Tamaño elegido: <span id="valFiltroTamano" style="color: var(--color-resaltado);">${valActualUnico}</span>
                </label>
                <input type="range" id="sliderFiltroTamano" min="0" max="${arrTamanos.length - 1}" value="${idxActual}" style="width: 80%; max-width: 300px;">
                <div style="font-size: 0.85rem; margin-top: 8px; opacity: 0.8;">Desliza la barra para seleccionar el tamaño.</div>
            </div>

            <div id="contenedorVariosTamanos" style="display: ${modoMultiple ? 'grid' : 'none'}; grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)); gap: 10px; justify-items: center; width: 100%;">
                ${arrTamanos.map(tamano => `
                    <button class="opcionFiltro btnTamanoGrid ${valoresSeleccionados.includes(tamano) ? 'seleccionada' : ''}" data-valor="${tamano}" style="width: 100%; padding: 10px 5px;">
                        ${tamano}
                    </button>
                `).join('')}
            </div>

            <button id="hiddenTamanoBoton" class="opcionFiltro ${!modoMultiple ? 'seleccionada' : ''}" style="display:none;" data-valor="${valActualUnico}"></button>
        `;
        
        const slider = document.getElementById("sliderFiltroTamano");
        slider.dataset.tamanos = JSON.stringify(arrTamanos);
        
        slider.addEventListener("input", (e) => {
            const arr = JSON.parse(e.target.dataset.tamanos);
            const seleccionado = arr[e.target.value];
            document.getElementById("valFiltroTamano").textContent = seleccionado;
            
            const btnOculto = document.getElementById("hiddenTamanoBoton");
            btnOculto.classList.add("seleccionada");
            btnOculto.dataset.valor = seleccionado;
        });

        const btnModoUnico = document.getElementById("btnModoUnico");
        const btnModoMultiple = document.getElementById("btnModoMultiple");
        const contenedorUnTamano = document.getElementById("contenedorUnTamano");
        const contenedorVariosTamanos = document.getElementById("contenedorVariosTamanos");
        const btnOculto = document.getElementById("hiddenTamanoBoton");

        btnModoUnico.addEventListener("click", () => {
            btnModoUnico.classList.add("seleccionada");
            btnModoMultiple.classList.remove("seleccionada");
            contenedorUnTamano.style.display = "block";
            contenedorVariosTamanos.style.display = "none";
            
            // Quitar seleccionada a los del grid para no confirmarlos
            document.querySelectorAll(".btnTamanoGrid").forEach(b => b.classList.remove("seleccionada"));
            // Reactivar el oculto
            btnOculto.classList.add("seleccionada");
        });

        btnModoMultiple.addEventListener("click", () => {
            btnModoMultiple.classList.add("seleccionada");
            btnModoUnico.classList.remove("seleccionada");
            contenedorUnTamano.style.display = "none";
            contenedorVariosTamanos.style.display = "grid";
            
            // Quitar seleccionada al botón oculto
            btnOculto.classList.remove("seleccionada");
        });

    } else {
        opciones.forEach(opcion => {
            const activo = filtroTieneValor(nombre, opcion);

            if (esFiltroNombrePack && typeof htmlBotonPackIcono === "function") {
                const tieneIcono = typeof rutaIconoPack === "function" && !!rutaIconoPack(opcion);
                const html = htmlBotonPackIcono(opcion, "", `data-valor="${opcion}"`);
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                const btn = tempDiv.firstElementChild;
                if (!activo) btn.classList.remove("seleccionada");
                lista.appendChild(btn);
            } else if (esFiltroMundo && typeof htmlBotonMundoIcono === "function") {
                const tieneIcono = typeof rutaIconoMundo === "function" && !!rutaIconoMundo(opcion);
                const html = htmlBotonMundoIcono(opcion, "", `data-valor="${opcion}"`);
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                const btn = tempDiv.firstElementChild;
                if (!activo) btn.classList.remove("seleccionada");
                lista.appendChild(btn);
            } else {
                lista.innerHTML += `
                    <button class="opcionFiltro ${activo ? "seleccionada" : ""}" data-valor="${opcion}">
                        ${opcion}
                    </button>
                `;
            }
        });
    }

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
            // Ignorar los botones que tienen una lógica de evento especial
            if (boton.id !== "hiddenTamanoBoton" && boton.id !== "btnModoUnico" && boton.id !== "btnModoMultiple") {
                boton.classList.toggle("seleccionada");
            }
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
        if (boton.dataset.valor !== undefined) {
            valores.push(boton.dataset.valor);
        }
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