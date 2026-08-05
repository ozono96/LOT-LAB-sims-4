/* =========================================================
   RETO SUBMENUS
   Gestión de la interfaz y lectura de datos de submenús
   (Colores y Límite de Packs).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    function cerrarTodosSubmenusFlotantes(excepto) {
        document.querySelectorAll(".submenuOpcion.popoverFlotante").forEach(sub => {
            if (sub !== excepto) sub.style.display = "none";
        });
    }

    // Submenú Colores
    const btnColores = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="colores"]');
    const submenuColores = document.getElementById("submenuColores");

    if (btnColores && submenuColores) {
        btnColores.addEventListener("click", (e) => {
            if (btnColores.classList.contains("seleccionada")) {
                cerrarTodosSubmenusFlotantes(submenuColores);
                submenuColores.style.display = "block";
            } else {
                submenuColores.style.display = "none";
            }
        });
    }

    // Submenú Habilidades
    const btnHabilidades = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="habilidades"]');
    const submenuHabilidades = document.getElementById("submenuHabilidades");

    if (btnHabilidades && submenuHabilidades) {
        btnHabilidades.addEventListener("click", (e) => {
            if (btnHabilidades.classList.contains("seleccionada")) {
                cerrarTodosSubmenusFlotantes(submenuHabilidades);
                submenuHabilidades.style.display = "block";
            } else {
                submenuHabilidades.style.display = "none";
            }
        });
    }

    // Submenú Límite de Packs
    const btnLimitePacks = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="limite-packs"]');
    const submenuLimitePacks = document.getElementById("submenuLimitePacks");

    if (btnLimitePacks && submenuLimitePacks) {
        btnLimitePacks.addEventListener("click", (e) => {
            if (btnLimitePacks.classList.contains("seleccionada")) {
                cerrarTodosSubmenusFlotantes(submenuLimitePacks);
                submenuLimitePacks.style.display = "block";
            } else {
                submenuLimitePacks.style.display = "none";
            }
        });
    }

    // Rueda del ratón para el input de Límite de Packs
    const inputMaxPacks = document.getElementById("inputMaxPacks");
    if (inputMaxPacks) {
        inputMaxPacks.addEventListener("wheel", (e) => {
            e.preventDefault();
            e.stopPropagation();
            let val = parseInt(inputMaxPacks.value, 10);
            if (isNaN(val)) val = 3;

            val += (e.deltaY < 0) ? 1 : -1;

            const max = parseInt(inputMaxPacks.max, 10) || 30;
            const min = parseInt(inputMaxPacks.min, 10) || 1;

            if (val > max) val = max;
            if (val < min) val = min;

            inputMaxPacks.value = val;
            inputMaxPacks.dispatchEvent(new Event('input'));
        }, { passive: false });

        inputMaxPacks.addEventListener("input", () => {
            let val = parseInt(inputMaxPacks.value, 10);
            if (isNaN(val)) val = 1;
            if (val > 30) val = 30;
            if (val < 1) val = 1;
            inputMaxPacks.value = val;
            if (typeof window.actualizarDificultadUI === "function") {
                window.actualizarDificultadUI();
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
                cerrarTodosSubmenusFlotantes(submenuTamano);
                submenuTamano.style.display = "block";
                inicializarSliderTamano();
            } else {
                submenuTamano.style.display = "none";
            }
        });
    }

    // Configuración de botones de popover (Aceptar / Desmarcar)
    function configurarBotonesPopover(btnAceptarId, btnDesmarcarId, btnFiltro, submenu) {
        const btnAceptar = document.getElementById(btnAceptarId);
        const btnDesmarcar = document.getElementById(btnDesmarcarId);

        btnAceptar?.addEventListener("click", (e) => {
            e.stopPropagation();
            submenu.style.display = "none";
            btnFiltro?.classList.add("seleccionada");
            if (typeof window.actualizarDificultadUI === "function") window.actualizarDificultadUI();
        });

        btnDesmarcar?.addEventListener("click", (e) => {
            e.stopPropagation();
            submenu.style.display = "none";
            btnFiltro?.classList.remove("seleccionada");
            if (typeof window.actualizarDificultadUI === "function") window.actualizarDificultadUI();
        });
    }

    configurarBotonesPopover("btnAceptarColores", "btnDesmarcarColores", btnColores, submenuColores);
    configurarBotonesPopover("btnAceptarHabilidades", "btnDesmarcarHabilidades", btnHabilidades, submenuHabilidades);
    configurarBotonesPopover("btnAceptarLimitePacks", "btnDesmarcarLimitePacks", btnLimitePacks, submenuLimitePacks);
    configurarBotonesPopover("btnAceptarTamano", "btnDesmarcarTamano", btnTamanoSolar, submenuTamano);

    // Cerrar submenús al hacer clic fuera del contenedor flotante
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".contenedorOpcionFlotante")) {
            cerrarTodosSubmenusFlotantes();
        }
    });

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

    // Actualizar texto del slider de habilidades
    const sliderHab = document.getElementById("sliderCantidadHabilidades");
    const valHab = document.getElementById("valCantidadHabilidades");
    if (sliderHab && valHab) {
        sliderHab.addEventListener("input", () => {
            valHab.textContent = sliderHab.value;
        });
    }

    // ── Limitantes extra: Construir / Comprar ──
    const avisoLimitantesExtra = document.getElementById("avisoLimitantesExtra");

    function actualizarAvisoLimitantesExtra() {
        if (!avisoLimitantesExtra) return;
        const hayAlgunaActiva = document.querySelector('#limitantesExtraOpciones .opcionFiltro.seleccionada');
        avisoLimitantesExtra.style.display = hayAlgunaActiva ? "block" : "none";
    }

    function configurarBotonLimitante(tipo, idSubmenu, idSlider, idValor) {
        const boton = document.querySelector(`#limitantesExtraOpciones .opcionFiltro[data-limitante="${tipo}"]`);
        const submenu = document.getElementById(idSubmenu);
        const slider = document.getElementById(idSlider);
        const valSpan = document.getElementById(idValor);

        if (!boton || !submenu) return;

        boton.addEventListener("click", () => {
            boton.classList.toggle("seleccionada");
            submenu.style.display = boton.classList.contains("seleccionada") ? "block" : "none";
            actualizarAvisoLimitantesExtra();
            if (typeof window.actualizarDificultadUI === "function") {
                window.actualizarDificultadUI();
            }
        });

        if (slider && valSpan) {
            slider.addEventListener("input", () => {
                valSpan.textContent = slider.value;
                if (typeof window.actualizarDificultadUI === "function") {
                    window.actualizarDificultadUI();
                }
            });
        }
    }

    configurarBotonLimitante("construir", "submenuLimitanteConstruir", "sliderLimitanteConstruir", "valLimitanteConstruir");
    configurarBotonLimitante("comprar", "submenuLimitanteComprar", "sliderLimitanteComprar", "valLimitanteComprar");
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

    // Configuración Limitantes Extra (Construir / Comprar)
    const sliderLimConstruir = document.getElementById("sliderLimitanteConstruir");
    const cantidadLimConstruir = sliderLimConstruir ? parseInt(sliderLimConstruir.value, 10) : 1;

    const sliderLimComprar = document.getElementById("sliderLimitanteComprar");
    const cantidadLimComprar = sliderLimComprar ? parseInt(sliderLimComprar.value, 10) : 1;

    // Configuración de Habilidades
    const sliderHabilidades = document.getElementById("sliderCantidadHabilidades");
    const cantidadHabilidades = sliderHabilidades ? parseInt(sliderHabilidades.value, 10) : 3;

    return {
        colores: { cantidad: cantidadColores },
        habilidades: { cantidad: cantidadHabilidades },
        limitePacks: { maxPacks: maxPacks, tiposPermitidos: tiposPermitidos, juegoBasePermitido: juegoBaseEnLimitePacks },
        tamanoSolar: { tamano: tamanoElegido },
        limitantesConstruir: { cantidad: cantidadLimConstruir },
        limitantesComprar: { cantidad: cantidadLimComprar }
    };
}
