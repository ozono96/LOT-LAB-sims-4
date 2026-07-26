/* =========================================================
   RETO SUBMENUS
   Gestión de la interfaz y lectura de datos de submenús
   (Colores y Límite de Packs).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // Submenú Colores
    const btnColores = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="colores"]');
    const submenuColores = document.getElementById("submenuColores");

    if (btnColores && submenuColores) {
        btnColores.addEventListener("click", () => {
            if (btnColores.classList.contains("seleccionada")) {
                submenuColores.style.display = "block";
            } else {
                submenuColores.style.display = "none";
            }
        });
    }

    // Submenú Límite de Packs
    const btnLimitePacks = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="limite-packs"]');
    const submenuLimitePacks = document.getElementById("submenuLimitePacks");

    if (btnLimitePacks && submenuLimitePacks) {
        btnLimitePacks.addEventListener("click", () => {
            if (btnLimitePacks.classList.contains("seleccionada")) {
                submenuLimitePacks.style.display = "block";
            } else {
                submenuLimitePacks.style.display = "none";
            }
        });
    }

    // Submenú Tamaño de Solar
    const btnTamanoSolar = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="tamano-solar"]');
    const submenuTamano = document.getElementById("submenuTamano");
    const sliderTamano = document.getElementById("sliderTamanoSolar");
    const valTamano = document.getElementById("valTamanoSolar");

    function inicializarSliderTamano() {
        if (typeof obtenerPacksSeleccionadosUsuario !== "function" || typeof database === "undefined" || !database.solares) return;
        
        const packsUsuario = obtenerPacksSeleccionadosUsuario();
        const tamañosValidos = new Set();
        
        database.solares.forEach(solar => {
            const packRequerido = (solar.nombrePack || "").trim().toLowerCase();
            let tienePack = false;
            if (!packRequerido || packRequerido.includes("base") || packRequerido === "juego base") {
                tienePack = true;
            } else {
                tienePack = packsUsuario.some(p => p.toLowerCase().includes(packRequerido) || packRequerido.includes(p.toLowerCase()));
            }
            
            if (tienePack && solar.tamaño) {
                tamañosValidos.add(solar.tamaño.trim());
            }
        });

        const arrTamanos = Array.from(tamañosValidos).sort((a, b) => {
            const parseArea = str => {
                const m = str.match(/(\d+)\s*x\s*(\d+)/i);
                if (m) return parseInt(m[1]) * parseInt(m[2]);
                return 0;
            };
            return parseArea(a) - parseArea(b);
        });

        if (arrTamanos.length > 0 && sliderTamano) {
            sliderTamano.min = 0;
            sliderTamano.max = arrTamanos.length - 1;
            // Si es la primera vez, poner en el medio
            if (!sliderTamano.dataset.tamanos) {
                sliderTamano.value = Math.floor(arrTamanos.length / 2);
            }
            sliderTamano.dataset.tamanos = JSON.stringify(arrTamanos);
            valTamano.textContent = arrTamanos[sliderTamano.value];
            sliderTamano.dispatchEvent(new Event('input'));
        }
    }

    if (btnTamanoSolar && submenuTamano) {
        btnTamanoSolar.addEventListener("click", () => {
            if (btnTamanoSolar.classList.contains("seleccionada")) {
                submenuTamano.style.display = "block";
                inicializarSliderTamano();
            } else {
                submenuTamano.style.display = "none";
            }
        });
    }

    if (sliderTamano && valTamano) {
        sliderTamano.addEventListener("input", () => {
            const arr = JSON.parse(sliderTamano.dataset.tamanos || "[]");
            const tamanoActual = arr[sliderTamano.value] || "-";
            valTamano.textContent = tamanoActual;

            // Lógica para tamaño ND
            const btnAleatorio = document.querySelector('#tipoSolarOpciones .opcionFiltro[data-opcion="tipo-solar-aleatorio"]');
            const btnComunitario = document.querySelector('#tipoSolarOpciones .opcionFiltro[data-opcion="solo-comunitarios"]');
            const btnSinTipo = document.querySelector('#tipoSolarOpciones .opcionFiltro[data-opcion="sin-tipo-solar"]');

            if (btnAleatorio && btnComunitario && btnSinTipo) {
                if (tamanoActual.trim().toUpperCase() === "ND") {
                    btnAleatorio.classList.add('deshabilitado');
                    btnComunitario.classList.add('deshabilitado');
                    
                    // Si estaban seleccionados, cambiamos a "Sin tipo de solar"
                    if (btnAleatorio.classList.contains("seleccionada") || btnComunitario.classList.contains("seleccionada")) {
                        btnAleatorio.classList.remove("seleccionada");
                        btnComunitario.classList.remove("seleccionada");
                        btnSinTipo.classList.add("seleccionada");
                    }
                } else {
                    btnAleatorio.classList.remove('deshabilitado');
                    btnComunitario.classList.remove('deshabilitado');
                }
            }

            if (typeof window.actualizarDificultadUI === "function") {
                window.actualizarDificultadUI();
            }
        });
    }

    // Actualizar texto del slider de colores
    const sliderColores = document.getElementById("sliderCantidadColores");
    const valColores = document.getElementById("valCantidadColores");
    if (sliderColores && valColores) {
        sliderColores.addEventListener("input", () => {
            valColores.textContent = sliderColores.value;
        });
    }
});

function obtenerConfigSubmenus() {
    // Configuración de Colores
    const sliderColores = document.getElementById("sliderCantidadColores");
    const cantidadColores = sliderColores ? parseInt(sliderColores.value, 10) : 3;

    // Configuración de Límite de Packs
    const inputMaxPacks = document.getElementById("inputMaxPacks");
    const maxPacks = inputMaxPacks ? parseInt(inputMaxPacks.value, 10) : 3;

    const tiposPermitidos = [];
    document.querySelectorAll(".checkTipoPack:checked").forEach(chk => {
        tiposPermitidos.push(chk.value);
    });

    // Juego Base excluido del límite de packs
    const checkJuegoBase = document.getElementById("checkJuegoBasePack");
    const juegoBaseEnLimitePacks = checkJuegoBase ? checkJuegoBase.checked : true;

    // Configuración Tamaño Solar
    let tamanoElegido = null;
    const sliderTamano = document.getElementById("sliderTamanoSolar");
    if (sliderTamano && sliderTamano.dataset.tamanos) {
        const arr = JSON.parse(sliderTamano.dataset.tamanos);
        tamanoElegido = arr[sliderTamano.value];
    }

    return {
        colores: { cantidad: cantidadColores },
        limitePacks: { maxPacks: maxPacks, tiposPermitidos: tiposPermitidos, juegoBasePermitido: juegoBaseEnLimitePacks },
        tamanoSolar: { tamano: tamanoElegido }
    };
}
