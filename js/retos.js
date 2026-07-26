document.addEventListener("datosCargados", () => {
    renderizarPacksRetos();
});

document.addEventListener("DOMContentLoaded", () => {
    
    // Botón Aceptar para ir a las opciones de reto
    document.getElementById("aceptarPacksRetos")?.addEventListener("click", () => {
        const packsSeleccionados = document.querySelectorAll("#listaPacksRetos .opcionFiltro.seleccionada");
        if (packsSeleccionados.length === 0) {
            alert("Debes tener al menos un pack seleccionado para jugar.");
            return;
        }
        
        if (typeof abrirVentana === "function") {
            abrirVentana("ventanaRetosOpciones");
        }
    });

    // Opciones excluyentes: Reto con solar / Reto sin solar
    const botonesTipoReto = document.querySelectorAll("#tipoRetoOpciones .opcionFiltro");
    botonesTipoReto.forEach(boton => {
        boton.addEventListener("click", function() {
            botonesTipoReto.forEach(b => b.classList.remove("seleccionada"));
            this.classList.add("seleccionada");
            if (typeof actualizarDificultadUI === "function") actualizarDificultadUI();
        });
    });

    // Función para actualizar el contador de dificultad en tiempo real
    function actualizarDificultadUI() {
        const valUI = document.getElementById("valDificultadUI");
        if (!valUI) return;

        let dificultad = 0;

        // "Reto con solar" suma 1
        const btnConSolar = document.querySelector("#tipoRetoOpciones .opcionFiltro.seleccionada");
        if (btnConSolar && btnConSolar.getAttribute("data-tipo") === "con-solar") {
            dificultad++;
        }

        // Opciones extra suman 1 cada una, excepto tamaño solar si área <= 900 (30x30)
        document.querySelectorAll("#opcionesExtraRetos .opcionFiltro.seleccionada").forEach(btn => {
            const op = btn.getAttribute("data-opcion");
            if (op === "tamano-solar") {
                const valTamano = document.getElementById("valTamanoSolar");
                if (valTamano && valTamano.textContent) {
                    const match = valTamano.textContent.match(/(\d+)\s*x\s*(\d+)/i);
                    if (match) {
                        const area = parseInt(match[1]) * parseInt(match[2]);
                        if (area > 900) {
                            dificultad++;
                        }
                    }
                }
            } else {
                dificultad++;
            }
        });

        // Opciones de tipo de solar: si hay una seleccionada y NO es "sin-tipo-solar", suma 1
        const tipoSolarSel = document.querySelector("#tipoSolarOpciones .opcionFiltro.seleccionada");
        if (tipoSolarSel) {
            if (tipoSolarSel.getAttribute("data-opcion") !== "sin-tipo-solar") {
                dificultad++;
            }
        }

        valUI.textContent = dificultad;
    }

    // Exportar para que pueda ser llamada desde reto-submenus.js
    window.actualizarDificultadUI = actualizarDificultadUI;

    // Opciones extra (checkboxes múltiples)
    const botonesOpcionesExtra = document.querySelectorAll("#opcionesExtraRetos .opcionFiltro");
    botonesOpcionesExtra.forEach(boton => {
        boton.addEventListener("click", function() {
            this.classList.toggle("seleccionada");
            actualizarDificultadUI();
        });
    });

    // Opciones excluyentes: Tipo de solar (Aleatorio, Comunitarios, Residenciales, Sin tipo)
    const botonesTipoSolar = document.querySelectorAll("#tipoSolarOpciones .opcionFiltro");
    botonesTipoSolar.forEach(boton => {
        boton.addEventListener("click", function() {
            if (this.classList.contains("seleccionada")) {
                this.classList.remove("seleccionada");
            } else {
                botonesTipoSolar.forEach(b => b.classList.remove("seleccionada"));
                this.classList.add("seleccionada");
            }
            actualizarDificultadUI();
        });
    });

    // Actualizar nada más abrir la página por si hay algo marcado por defecto
    actualizarDificultadUI();

    // Lógica para el Tooltip Flotante
    const tooltip = document.getElementById("tooltipOpciones");
    const botonesConTooltip = document.querySelectorAll(".opcionFiltro[data-tooltip]");
    
    if (tooltip) {
        botonesConTooltip.forEach(boton => {
            boton.addEventListener("mouseenter", function(e) {
                tooltip.textContent = this.getAttribute("data-tooltip");
                tooltip.style.display = "block";
            });
            boton.addEventListener("mousemove", function(e) {
                tooltip.style.left = e.pageX + "px";
                tooltip.style.top = (e.pageY - 10) + "px";
            });
            boton.addEventListener("mouseleave", function() {
                tooltip.style.display = "none";
            });
        });
    }

    // Botón Generar Reto
    document.getElementById("generarRetoBtn")?.addEventListener("click", () => {
        if (typeof generarReto === "function") {
            generarReto(false);
        }
    });

    // Botón Reto Aleatorio
    document.getElementById("retoAleatorioBtn")?.addEventListener("click", () => {
        if (typeof generarReto === "function") {
            generarReto(true);
        }
    });

    // Botón Volver a Modo Retos
    document.getElementById("volverModoRetosBtn")?.addEventListener("click", () => {
        if (typeof abrirVentana === "function") {
            abrirVentana("ventanaRetos");
        }
    });
});

function renderizarPacksRetos() {
    const contenedor = document.getElementById("listaPacksRetos");
    if (!contenedor) return;
    
    contenedor.innerHTML = "";

    const packsExpansion = [];
    const packsContenido = [];
    const packsAccesorios = [];
    const packsKits = [];
    const packsGratis = [];
    let juegoBaseEntradas = [];

    database.packs.forEach(fila => {
        if (fila[0] && fila[0].trim() !== "") packsExpansion.push(fila[0]);
        if (fila[2] && fila[2].trim() !== "") packsContenido.push(fila[2]);
        if (fila[4] && fila[4].trim() !== "") packsAccesorios.push(fila[4]);
        
        if (fila[6] && fila[6].trim() !== "") {
            const kitId = (fila[7] || "").trim().toUpperCase();
            if (!kitId.includes("CAS")) {
                packsKits.push(fila[6]);
            }
        }

        if (fila[8] && fila[8].trim() !== "") packsGratis.push(fila[8]);
        if (fila[10] && fila[10].trim() !== "") juegoBaseEntradas.push(fila[10]);
    });

    const tieneJuegoBase = juegoBaseEntradas.length > 0;

    // ── Sección superior: Juego Base + Gratuitos en fila centrada y simétrica ──
    if (tieneJuegoBase || packsGratis.length > 0) {
        let seccionSuperior = '<div style="display: flex; gap: 40px; justify-content: center; align-items: flex-start; flex-wrap: wrap; margin-bottom: 45px;">';

        if (tieneJuegoBase) {
            const nombreJB = juegoBaseEntradas[0]; // Nombre real de la hoja (ej. "Los Sims 4")
            const iconoJB = htmlBotonPackIcono(nombreJB, "", `id="btnJuegoBase" data-pack="${nombreJB}" data-tipo-pack="Juego Base"`);
            seccionSuperior +=
                '<div style="width: 220px; text-align: center;">'
                + '<h3 style="text-align: center; margin-bottom: 15px;">Juego Base</h3>'
                + '<div class="listaOpciones" style="justify-content: center;">'
                + iconoJB
                + '</div>'
                + '</div>';
        }

        if (packsGratis.length > 0) {
            let botonesGratis = "";
            packsGratis.forEach(pack => {
                botonesGratis += htmlBotonPackIcono(pack, "", `data-pack="${pack}"`);
            });
            seccionSuperior +=
                '<div style="width: 220px; text-align: center;">'
                + '<h3 style="text-align: center; margin-bottom: 15px;">Packs Gratuitos</h3>'
                + '<div id="packs-gratis" class="listaOpciones" style="justify-content: center;">' + botonesGratis + '</div>'
                + '</div>';
        }

        seccionSuperior += '</div>';
        contenedor.innerHTML += seccionSuperior;
    }

    // Función auxiliar para renderizar sección con botón toggle marcar/desmarcar
    function crearSeccion(titulo, listaPacks, idSeccion) {
        if (listaPacks.length === 0) return "";

        let botonesPacks = "";
        listaPacks.forEach(function(pack) {
            botonesPacks += htmlBotonPackIcono(pack, "", `data-pack="${pack}"`);
        });

        return '<div class="seccionPacksRetos" style="margin-bottom: 40px;">'
            + '<h3 style="text-align: center; margin-bottom: 12px;">' + titulo + '</h3>'
            + '<div style="display: flex; justify-content: center; margin-bottom: 14px;">'
            + '<button class="botonReto toggleSeccionBtn" data-target="' + idSeccion + '" data-estado="marcado">❌ Desmarcar todos</button>'
            + '</div>'
            + '<div id="' + idSeccion + '" class="listaOpciones" style="justify-content: center; gap: 8px; flex-wrap: wrap;">' + botonesPacks + '</div>'
            + '</div>';
    }

    contenedor.innerHTML += crearSeccion("Packs de Expansión", packsExpansion, "packs-expansion");
    contenedor.innerHTML += crearSeccion("Packs de Contenido", packsContenido, "packs-contenido");
    contenedor.innerHTML += crearSeccion("Packs de Accesorios", packsAccesorios, "packs-accesorios");
    contenedor.innerHTML += crearSeccion("Kits", packsKits, "packs-kits");

    // Eventos click en botones de pack (toggle individual)
    document.querySelectorAll("#listaPacksRetos .opcionFiltro").forEach(boton => {
        boton.addEventListener("click", function() {
            this.classList.toggle("seleccionada");
        });
    });

    // Evento toggle marcar/desmarcar todos (un solo botón por sección)
    document.querySelectorAll(".toggleSeccionBtn").forEach(btn => {
        btn.addEventListener("click", function() {
            const idTarget = this.getAttribute("data-target");
            const estado = this.getAttribute("data-estado");
            const opciones = document.querySelectorAll(`#${idTarget} .opcionFiltro`);

            if (estado === "marcado") {
                // Desmarcar todos
                opciones.forEach(op => op.classList.remove("seleccionada"));
                this.setAttribute("data-estado", "desmarcado");
                this.textContent = "✔️ Marcar todos";
            } else {
                // Marcar todos
                opciones.forEach(op => op.classList.add("seleccionada"));
                this.setAttribute("data-estado", "marcado");
                this.textContent = "❌ Desmarcar todos";
            }
        });
    });
}

// Retorna true si el usuario tiene el Juego Base marcado
function juegoBaseMarcado() {
    const btn = document.getElementById("btnJuegoBase");
    return btn ? btn.classList.contains("seleccionada") : true;
}
