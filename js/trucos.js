/* =========================================================
   TRUCOS
   Navegación entre la ventana de introducción y las 3
   categorías (Construir, CAS, Modo Vivir), y copiado al
   portapapeles de los textos marcados como "truco-copiable".
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("botonTrucos")?.addEventListener("click", () => {
        construirIndiceTrucos();
        abrirVentana("ventanaTrucos");
    });

    document.getElementById("botonTrucosConstruir")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosConstruir");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("botonTrucosCAS")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosCAS");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("botonTrucosVivir")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosVivir");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("botonTrucosPacks")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosPacks");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.querySelectorAll(".botonVolverTrucos").forEach(boton => {
        boton.addEventListener("click", () => {
            abrirVentana("ventanaTrucos");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // Hacer que el botón ✕ de las sub-ventanas de trucos actúe como "Volver a Trucos"
    const subVentanasTrucos = [
        "ventanaTrucosConstruir",
        "ventanaTrucosCAS",
        "ventanaTrucosVivir",
        "ventanaTrucosPacks"
    ];
    subVentanasTrucos.forEach(idVentana => {
        const ventana = document.getElementById(idVentana);
        if (!ventana) return;
        const btnCerrar = ventana.querySelector(".cabeceraVentana .cerrar");
        if (!btnCerrar) return;
        // Clonar para eliminar listeners existentes
        const btnCerrarClone = btnCerrar.cloneNode(true);
        btnCerrar.parentNode.replaceChild(btnCerrarClone, btnCerrar);
        btnCerrarClone.addEventListener("click", (e) => {
            e.stopPropagation();
            abrirVentana("ventanaTrucos");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // Copiar al portapapeles cualquier texto marcado como "truco-copiable"
    document.addEventListener("click", (e) => {
        const el = e.target.closest(".truco-copiable");
        if (!el) return;

        copiarTextoTruco(el.textContent.trim(), e);
    });

    // Inicializar Buscador de Trucos
    inicializarBuscadorTrucos();

});

/* =========================================================
   SISTEMA DE BÚSQUEDA Y REDIRECCIÓN DE TRUCOS
   ========================================================= */

let INDICE_TRUCOS = [];

function normalizarTextoBusqueda(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function construirIndiceTrucos() {
    INDICE_TRUCOS = [];

    const secciones = [
        { idVentana: "ventanaTrucos", categoria: "🕹️ General" },
        { idVentana: "ventanaTrucosConstruir", categoria: "🏗️ Construir" },
        { idVentana: "ventanaTrucosCAS", categoria: "💇 CAS" },
        { idVentana: "ventanaTrucosVivir", categoria: "🏠 Modo Vivir" },
        { idVentana: "ventanaTrucosPacks", categoria: "📦 Packs" }
    ];

    let contador = 0;

    secciones.forEach(sec => {
        const ventana = document.getElementById(sec.idVentana);
        if (!ventana) return;

        // Buscar bloques con .truco-copiable o encabezados (h3, h4)
        const elementos = ventana.querySelectorAll("h3, h4, .truco-copiable");
        
        elementos.forEach(el => {
            let codigo = "";
            let titulo = "";
            let descripcion = "";

            if (el.classList.contains("truco-copiable")) {
                codigo = el.textContent.trim();
                // Buscar encabezado o párrafo cercano para descripción
                const padre = el.closest("h4, h3, p, div");
                titulo = codigo;
                if (padre) {
                    let sig = padre.nextElementSibling;
                    while (sig && sig.tagName === "P" && !descripcion) {
                        descripcion = sig.textContent.trim();
                        sig = sig.nextElementSibling;
                    }
                }
            } else if (el.tagName === "H4" || el.tagName === "H3") {
                const copiable = el.querySelector(".truco-copiable");
                if (copiable) {
                    codigo = copiable.textContent.trim();
                    titulo = el.textContent.trim();
                } else {
                    titulo = el.textContent.trim();
                }

                let sig = el.nextElementSibling;
                while (sig && sig.tagName === "P" && !descripcion) {
                    descripcion = sig.textContent.trim();
                    sig = sig.nextElementSibling;
                }
            }

            if (!titulo && !codigo) return;

            // Evitar duplicados consecutivos exactos
            const queryKey = normalizarTextoBusqueda(`${sec.idVentana}_${codigo || titulo}`);
            const existe = INDICE_TRUCOS.some(item => normalizarTextoBusqueda(`${item.idVentana}_${item.codigo || item.titulo}`) === queryKey);
            if (existe) return;

            contador++;
            INDICE_TRUCOS.push({
                id: `truco_idx_${contador}`,
                codigo: codigo,
                titulo: titulo,
                descripcion: descripcion,
                categoria: sec.categoria,
                idVentana: sec.idVentana,
                elemento: el
            });
        });
    });

    console.log(`✔ Índice de trucos construido con ${INDICE_TRUCOS.length} entradas.`);
}

function inicializarBuscadorTrucos() {
    construirIndiceTrucos();

    const contenedores = document.querySelectorAll(".contenedorBuscadorTrucos");
    if (contenedores.length === 0) return;

    contenedores.forEach(contenedor => {
        const input = contenedor.querySelector("input, .inputBuscadorTrucos");
        const contenedorResultados = contenedor.querySelector(".desplegableResultadosTrucos");
        const btnLimpiar = contenedor.querySelector(".btnLimpiarBuscador, .btnLimpiarBuscadorTrucos");

        if (!input || !contenedorResultados) return;

        let indiceTecladoActivo = -1;

        function renderizarResultados(coincidencias) {
            if (coincidencias.length === 0) {
                contenedorResultados.innerHTML = `
                    <div style="padding: 16px; text-align: center; opacity: 0.7; font-size: 0.95rem;">
                        🔍 No se encontraron trucos que coincidan con la búsqueda.
                    </div>`;
                contenedorResultados.style.display = "block";
                return;
            }

            let html = "";
            coincidencias.slice(0, 10).forEach((item, idx) => {
                html += `
                    <div class="itemResultadoTruco" data-idx="${idx}" id="item_res_${idx}">
                        <div class="infoResultadoTruco">
                            <div class="tituloResultadoTruco">
                                ${item.codigo ? `<span class="codigoResultadoTruco">${escaparHTML(item.codigo)}</span>` : `${escaparHTML(item.titulo)}`}
                                <span class="badgeCategoriaTruco">${item.categoria}</span>
                            </div>
                            ${item.codigo && item.titulo !== item.codigo ? `<div style="font-size: 0.85rem; opacity: 0.9;">${escaparHTML(item.titulo)}</div>` : ''}
                            ${item.descripcion ? `<div class="descResultadoTruco">${escaparHTML(item.descripcion.slice(0, 110))}${item.descripcion.length > 110 ? '...' : ''}</div>` : ''}
                        </div>
                        <span class="flechaResultadoTruco">➡️</span>
                    </div>
                `;
            });

            contenedorResultados.innerHTML = html;
            contenedorResultados.style.display = "block";

            // Listeners de click en cada item
            contenedorResultados.querySelectorAll(".itemResultadoTruco").forEach(div => {
                div.addEventListener("click", () => {
                    const idx = parseInt(div.getAttribute("data-idx"));
                    const itemSeleccionado = coincidencias[idx];
                    if (itemSeleccionado) {
                        irATruco(itemSeleccionado);
                    }
                });
            });
        }

        function cerrarDesplegable() {
            contenedorResultados.style.display = "none";
            indiceTecladoActivo = -1;
        }

        input.addEventListener("input", () => {
            const query = normalizarTextoBusqueda(input.value);

            if (btnLimpiar) {
                btnLimpiar.style.display = query ? "block" : "none";
            }

            if (!query) {
                cerrarDesplegable();
                return;
            }

            const resultados = INDICE_TRUCOS.filter(item => {
                const normCodigo = normalizarTextoBusqueda(item.codigo);
                const normTitulo = normalizarTextoBusqueda(item.titulo);
                const normDesc = normalizarTextoBusqueda(item.descripcion);
                const normCat = normalizarTextoBusqueda(item.categoria);

                return normCodigo.includes(query) ||
                       normTitulo.includes(query) ||
                       normDesc.includes(query) ||
                       normCat.includes(query);
            });

            indiceTecladoActivo = -1;
            renderizarResultados(resultados);
        });

        if (btnLimpiar) {
            btnLimpiar.addEventListener("click", () => {
                input.value = "";
                btnLimpiar.style.display = "none";
                cerrarDesplegable();
                input.focus();
            });
        }

        // Navegación por teclado (Flecha abajo, Flecha arriba, Enter, Escape)
        input.addEventListener("keydown", (e) => {
            const items = contenedorResultados.querySelectorAll(".itemResultadoTruco");
            if (contenedorResultados.style.display === "none" || items.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                indiceTecladoActivo = (indiceTecladoActivo + 1) % items.length;
                actualizarSeleccionTeclado(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                indiceTecladoActivo = (indiceTecladoActivo - 1 + items.length) % items.length;
                actualizarSeleccionTeclado(items);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (indiceTecladoActivo >= 0 && items[indiceTecladoActivo]) {
                    items[indiceTecladoActivo].click();
                } else if (items[0]) {
                    items[0].click();
                }
            } else if (e.key === "Escape") {
                cerrarDesplegable();
            }
        });

        function actualizarSeleccionTeclado(items) {
            items.forEach((it, idx) => {
                if (idx === indiceTecladoActivo) {
                    it.classList.add("activoTeclado");
                    it.scrollIntoView({ block: "nearest" });
                } else {
                    it.classList.remove("activoTeclado");
                }
            });
        }
    });

    // Cerrar desplegables si se hace click fuera
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".contenedorBuscadorTrucos")) {
            document.querySelectorAll(".desplegableResultadosTrucos").forEach(d => d.style.display = "none");
        }
    });
}

function irATruco(item) {
    document.querySelectorAll(".desplegableResultadosTrucos").forEach(d => d.style.display = "none");

    // 1. Abrir la ventana destino si es diferente
    if (typeof abrirVentana === "function") {
        abrirVentana(item.idVentana);
    }

    // 2. Hacer scroll suave hasta el elemento y aplicar efecto flash
    setTimeout(() => {
        if (item.elemento) {
            item.elemento.scrollIntoView({ behavior: "smooth", block: "center" });

            // Aplicar destello visual
            const objetivoFlash = item.elemento.closest("h4, h3, p, .truco-copiable") || item.elemento;
            objetivoFlash.classList.remove("resaltado-truco-flash");
            void objetivoFlash.offsetWidth; // Trigger reflow
            objetivoFlash.classList.add("resaltado-truco-flash");

            setTimeout(() => {
                objetivoFlash.classList.remove("resaltado-truco-flash");
            }, 2600);
        }
    }, 180);
}

function escaparHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function copiarTextoTruco(texto, event) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(() => mostrarTooltipCopiado(event, "✅ Texto copiado"))
            .catch(() => copiarTextoTrucoFallback(texto, event));
    } else {
        copiarTextoTrucoFallback(texto, event);
    }
}

function copiarTextoTrucoFallback(texto, event) {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand("copy");
        mostrarTooltipCopiado(event, "✅ Texto copiado");
    } catch (error) {
        mostrarTooltipCopiado(event, "⚠️ No se pudo copiar");
    }

    document.body.removeChild(textarea);
}

function mostrarTooltipCopiado(event, mensaje) {
    const tooltip = document.getElementById("tooltipOpciones");
    if (!tooltip) return;

    const punto = event && event.touches ? event.touches[0] : event;
    const x = punto ? punto.clientX : window.innerWidth / 2;
    const y = punto ? punto.clientY : window.innerHeight / 2;

    tooltip.textContent = mensaje;
    tooltip.style.left = x + "px";
    tooltip.style.top = (y - 10) + "px";
    tooltip.style.display = "block";

    clearTimeout(window._tooltipCopiadoTimeout);
    window._tooltipCopiadoTimeout = setTimeout(() => {
        tooltip.style.display = "none";
    }, 1400);
}

console.log("✔ trucos cargado con buscador inteligente");