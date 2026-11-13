/* ==========================================================
   LOT-LAB — MINIJUEGO: ¿CONOCES LOS SOLARES?
   js/conoces-los-solares.js
   Módulo aislado e interactivo para la categoría "Juegos"
   ========================================================== */

(function () {
    "use strict";

    // ─── PALETA DE COLORES ACCESIBLES PARA JUGADORES ────────
    const PALETA_COLORES = [
        { id: "azul", hex: "#2563eb", nombre: "Azul Zafiro", textContrast: "#ffffff" },
        { id: "verde", hex: "#16a34a", nombre: "Verde Esmeralda", textContrast: "#ffffff" },
        { id: "violeta", hex: "#9333ea", nombre: "Violeta Amatista", textContrast: "#ffffff" },
        { id: "ambar", hex: "#d97706", nombre: "Ámbar Cobre", textContrast: "#ffffff" },
        { id: "rosa", hex: "#db2777", nombre: "Rosa Rubí", textContrast: "#ffffff" },
        { id: "cian", hex: "#0891b2", nombre: "Turquesa", textContrast: "#ffffff" }
    ];

    const STORAGE_KEY_PARTIDA = "lotlab_conoces_solares_partida";
    const LIMITE_CARACTERES_COMPARTIR = 256;
    const ICONOS_CICLICOS = ["🏘️", "🏠", "🏫", "🏥", "🏢"];
    const CARAS_DADO_UNICODE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

    let iconoCiclicoIdx = 0;
    let intervaloIconoCiclico = null;
    let intervaloIconoJuegos = null;
    let iconoJuegosIdx = 0;
    let intervaloPregunta = null;
    let intervaloCuentaAtrasTransicion = null;
    let intervaloDadoDesempate = null;
    let timeoutPlegadoFoto = null;
    let timeoutTransicion = null;

    // ─── ESTADO DE LA PARTIDA ───────────────────────────────
    const EstadoJuego = {
        modo: "individual",           // "individual" | "dos-jugadores"
        duracionModo: "hasta-fallar", // "hasta-fallar" | "5" | "10" (predeterminado: hasta-fallar)
        numRondas: 0,                 // 0 para hasta-fallar, o 5 | 10
        tiempoLimite: 0,              // 0 (sin tiempo) | 60 | 30
        tiempoRestante: 0,
        jugador1: {
            nombre: "Simmer",
            color: "#2563eb",
            colorNombre: "Azul Zafiro",
            puntos: 0,
            aciertos: 0,
            respuestasDadas: 0,
            turnoTerminado: false
        },
        jugador2: {
            nombre: "Jugador 2",
            color: "#d97706",
            colorNombre: "Ámbar Cobre",
            puntos: 0,
            aciertos: 0,
            respuestasDadas: 0,
            turnoTerminado: false
        },
        turnoJugador: 1,     // 1 | 2
        preguntaActualIdx: 0,
        preguntas: [],
        solaresUsadosIds: new Set(),
        pistasUsadas: 0,
        pistasReveladas: {
            tipo: false,
            origen: false,
            foto: false,
            descarte: false
        },
        opcionesDescartadas: [],
        respondida: false,
        partidaFinalizada: false,
        // Desempate (Muerte Súbita)
        enDesempate: false,
        preguntasDesempateJugadas: 0,
        ganadorDesempate: null,
        desempateRechazado: false,
        eleccionParImparJ1: "par" // "par" | "impar"
    };

    // ─── UTILIDADES DE FORMATO Y CÁLCULO ────────────────────

    function formatearPuntos(puntos, incluirUnidad = true) {
        const val = Math.max(0, parseInt(puntos, 10) || 0);
        const numeroFormateado = String(val).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return incluirUnidad ? `${numeroFormateado} puntos` : numeroFormateado;
    }

    function formatearPuntosCorto(puntos) {
        const val = Math.max(0, parseInt(puntos, 10) || 0);
        const numeroFormateado = String(val).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${numeroFormateado} pts`;
    }

    function calcularEstrellas(puntos, puntosMax) {
        if (!puntosMax || puntosMax <= 0) return 0;
        const ratio = Math.max(0, Math.min(1, puntos / puntosMax));
        return Math.round((ratio * 5) * 2) / 2;
    }

    /**
     * Renderiza el componente gráfico de estrellas sin texto auxiliar (Requisito 8)
     * Representa estrellas completas, medias estrellas mediante gradiente vectorial y estrellas vacías.
     */
    function renderizarEstrellasHTML(estrellas) {
        let iconosHtml = "";
        for (let i = 1; i <= 5; i++) {
            if (estrellas >= i) {
                iconosHtml += `
                    <svg class="cjs-estrella-svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#f39c12" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                `;
            } else if (estrellas >= i - 0.5) {
                const gradId = `cjsHalfStar_${i}_${Math.floor(Math.random() * 100000)}`;
                iconosHtml += `
                    <svg class="cjs-estrella-svg" viewBox="0 0 24 24" aria-hidden="true">
                        <defs>
                            <linearGradient id="${gradId}">
                                <stop offset="50%" stop-color="#f39c12" />
                                <stop offset="50%" stop-color="rgba(128, 128, 128, 0.28)" />
                            </linearGradient>
                        </defs>
                        <path fill="url(#${gradId})" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                `;
            } else {
                iconosHtml += `
                    <svg class="cjs-estrella-svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="rgba(128, 128, 128, 0.28)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                `;
            }
        }
        return `
            <div class="cjs-estrellas-contenedor" aria-label="Calificación: ${estrellas} de 5 estrellas">
                <div class="cjs-estrellas-iconos">${iconosHtml}</div>
            </div>
        `;
    }

    function obtenerMensajeFinal(puntos, puntosMax) {
        const ratio = puntosMax > 0 ? (puntos / puntosMax) : 0;
        if (ratio >= 1.0) {
            return "🌟 ¡Puntuación perfecta! Conoces cada rincón y solar de Los Sims 4 de memoria.";
        } else if (ratio >= 0.8) {
            return "👏 ¡Excelente conocimiento! Eres todo un referente arquitectónico en Los Sims 4.";
        } else if (ratio >= 0.6) {
            return "👍 ¡Buen intento! Tienes un dominio notable de la mayoría de los mundos.";
        } else if (ratio >= 0.4) {
            return "🗺️ ¡No está mal! Aunque algunos solares de expansiones aún se te resisten.";
        } else if (ratio >= 0.2) {
            return "🔍 ¡Sigue practicando! Con un par de partidas más dominarás todos los solares.";
        } else {
            return "✈️ ¡Hora de viajar! Date un paseo por los mundos de Los Sims 4 y vuelve a intentarlo.";
        }
    }

    function hexToRgba(hex, alpha) {
        if (!hex) return `rgba(0, 0, 0, ${alpha})`;
        let c = hex.replace("#", "");
        if (c.length === 3) c = c.split("").map(x => x + x).join("");
        const r = parseInt(c.substring(0, 2), 16) || 0;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function reproducirSonidoSeguro(tipo, param) {
        if (tipo === "exito" || tipo === "acierto") {
            window.SonidoGlobal?.reproducirSonidoMinijuego?.("acierto");
        } else if (tipo === "error") {
            window.SonidoGlobal?.reproducirSonidoMinijuego?.("error");
        } else if (tipo === "tictac") {
            window.SonidoGlobal?.reproducirSonidoMinijuego?.("tictac", param);
        } else if (tipo === "alarma_tiempo" || tipo === "tiempo_agotado") {
            window.SonidoGlobal?.reproducirSonidoMinijuego?.("alarma_tiempo");
        } else if (tipo === "cuenta_atras" || tipo === "pitido_transicion") {
            window.SonidoGlobal?.reproducirSonidoMinijuego?.("cuenta_atras", param);
        } else if (typeof window.reproducirSonidoUI === "function") {
            try {
                window.reproducirSonidoUI(tipo);
            } catch (e) {}
        }
    }

    function limpiarTodosLosTemporizadores() {
        if (intervaloPregunta) {
            clearInterval(intervaloPregunta);
            intervaloPregunta = null;
        }
        if (intervaloCuentaAtrasTransicion) {
            clearInterval(intervaloCuentaAtrasTransicion);
            intervaloCuentaAtrasTransicion = null;
        }
        if (intervaloDadoDesempate) {
            clearInterval(intervaloDadoDesempate);
            intervaloDadoDesempate = null;
        }
        if (timeoutPlegadoFoto) {
            clearTimeout(timeoutPlegadoFoto);
            timeoutPlegadoFoto = null;
        }
        if (timeoutTransicion) {
            clearTimeout(timeoutTransicion);
            timeoutTransicion = null;
        }
        const fotoWrap = document.getElementById("cjsSolarFotoReveladaWrap");
        if (fotoWrap && !EstadoJuego.respondida) {
            fotoWrap.classList.remove("expandido");
        }
        const timerBadge = document.getElementById("cjsTimerDisplay");
        if (timerBadge) {
            timerBadge.classList.remove("tiempo-critico");
        }
    }

    // ─── ICONOS ANIMADOS CÍCLICOS (Requisito 1) ─────────────

    function iniciarCicloIconosAnimados() {
        if (intervaloIconoCiclico) clearInterval(intervaloIconoCiclico);
        actualizarIconosDOM(ICONOS_CICLICOS[iconoCiclicoIdx]);

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        intervaloIconoCiclico = setInterval(() => {
            iconoCiclicoIdx = (iconoCiclicoIdx + 1) % ICONOS_CICLICOS.length;
            actualizarIconosDOM(ICONOS_CICLICOS[iconoCiclicoIdx]);
        }, 2000);
    }

    function detenerCicloIconosAnimados() {
        if (intervaloIconoCiclico) {
            clearInterval(intervaloIconoCiclico);
            intervaloIconoCiclico = null;
        }
    }

    function actualizarIconosDOM(nuevoIcono) {
        // Icono dentro del título de la ventana del minijuego (conservado y funcional)
        const elHeader = document.getElementById("cjsHeaderIconoAnimado");
        if (elHeader) elHeader.textContent = nuevoIcono;

        if (Array.isArray(window.REGISTRO_NAVEGACION)) {
            const cat = window.REGISTRO_NAVEGACION.find(c => c.id === "juegos");
            if (cat && Array.isArray(cat.herramientas)) {
                const item = cat.herramientas.find(h => h.id === "conoces-los-solares");
                if (item) item.icono = nuevoIcono;
            }
        }
    }

    // ─── GESTIÓN DE ROTACIÓN CONTINUA EN SECCIÓN JUEGOS ────

    function estaSeccionJuegosAbierta() {
        const dropdown = document.getElementById("dropdownNavClasica");
        if (dropdown && dropdown.style.display !== "none") {
            if (dropdown.querySelector('[data-tool-id="conoces-los-solares"]')) return true;
        }
        const expNivel2 = document.getElementById("expNivel2");
        if (expNivel2 && expNivel2.style.display !== "none") {
            if (document.querySelector('#expHerramientasGrid [data-tool-id="conoces-los-solares"]')) return true;
        }
        return false;
    }

    function actualizarIconoEntradaJuegos(nuevoIcono) {
        if (Array.isArray(window.REGISTRO_NAVEGACION)) {
            const cat = window.REGISTRO_NAVEGACION.find(c => c.id === "juegos");
            if (cat && Array.isArray(cat.herramientas)) {
                const item = cat.herramientas.find(h => h.id === "conoces-los-solares");
                if (item) item.icono = nuevoIcono;
            }
        }

        const selectores = [
            '.btn-dropdown-tool[data-tool-id="conoces-los-solares"] .dropdown-tool-icono',
            '.exp-herramienta-card[data-tool-id="conoces-los-solares"] .exp-herramienta-icono',
            '[data-id="conoces-los-solares"] .icono',
            '[data-herramienta="conoces-los-solares"] .icono',
            '[data-tool-id="conoces-los-solares"] .icono'
        ];
        document.querySelectorAll(selectores.join(', ')).forEach(el => {
            el.textContent = nuevoIcono;
        });
    }

    function iniciarCicloIconosJuegos() {
        if (intervaloIconoJuegos) return; // Evitar intervalos duplicados

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            actualizarIconoEntradaJuegos(ICONOS_CICLICOS[0]);
            return;
        }

        actualizarIconoEntradaJuegos(ICONOS_CICLICOS[iconoJuegosIdx]);

        intervaloIconoJuegos = setInterval(() => {
            if (!estaSeccionJuegosAbierta()) {
                detenerCicloIconosJuegos();
                return;
            }
            iconoJuegosIdx = (iconoJuegosIdx + 1) % ICONOS_CICLICOS.length;
            actualizarIconoEntradaJuegos(ICONOS_CICLICOS[iconoJuegosIdx]);
        }, 2000);
    }

    function detenerCicloIconosJuegos() {
        if (intervaloIconoJuegos) {
            clearInterval(intervaloIconoJuegos);
            intervaloIconoJuegos = null;
        }
    }

    function vigilarSeccionJuegos() {
        const verificar = () => {
            if (estaSeccionJuegosAbierta()) {
                iniciarCicloIconosJuegos();
            } else {
                detenerCicloIconosJuegos();
            }
        };

        verificar();

        const observer = new MutationObserver(verificar);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["style", "class"],
            childList: true,
            subtree: true
        });
    }

    // ─── TEMPORIZADOR POR PREGUNTA (Requisito 8) ─────────────

    function iniciarTemporizadorPregunta(tiempoInicial) {
        detenerTemporizadorPregunta();
        if (EstadoJuego.tiempoLimite <= 0) {
            const timerBadge = document.getElementById("cjsTimerDisplay");
            if (timerBadge) timerBadge.style.display = "none";
            return;
        }

        EstadoJuego.tiempoRestante = (tiempoInicial !== undefined && tiempoInicial !== null)
            ? Math.max(0, parseInt(tiempoInicial, 10))
            : EstadoJuego.tiempoLimite;

        const timerBadge = document.getElementById("cjsTimerDisplay");
        const timerTexto = document.getElementById("cjsTimerTexto");
        if (timerBadge) {
            timerBadge.style.display = "inline-flex";
            timerBadge.classList.toggle("tiempo-critico", EstadoJuego.tiempoRestante <= 5);
        }
        if (timerTexto) {
            timerTexto.textContent = `${EstadoJuego.tiempoRestante}s`;
        }

        if (EstadoJuego.tiempoRestante <= 0) {
            tiempoAgotado();
            return;
        }

        intervaloPregunta = setInterval(() => {
            if (EstadoJuego.respondida) {
                detenerTemporizadorPregunta();
                return;
            }
            EstadoJuego.tiempoRestante--;
            if (timerTexto) {
                timerTexto.textContent = `${Math.max(0, EstadoJuego.tiempoRestante)}s`;
            }
            if (EstadoJuego.tiempoRestante <= 5 && timerBadge) {
                timerBadge.classList.add("tiempo-critico");
            }
            guardarPartidaPersistida();
            if (EstadoJuego.tiempoRestante > 0) {
                reproducirSonidoSeguro("tictac", EstadoJuego.tiempoRestante);
            } else {
                detenerTemporizadorPregunta();
                tiempoAgotado();
            }
        }, 1000);
    }

    function detenerTemporizadorPregunta() {
        if (intervaloPregunta) {
            clearInterval(intervaloPregunta);
            intervaloPregunta = null;
        }
        window.SonidoGlobal?.detenerSonidosMinijuego?.();
        const timerBadge = document.getElementById("cjsTimerDisplay");
        if (timerBadge) {
            timerBadge.classList.remove("tiempo-critico");
        }
    }

    function pausarTemporizadorPregunta() {
        if (intervaloPregunta) {
            clearInterval(intervaloPregunta);
            intervaloPregunta = null;
        }
        window.SonidoGlobal?.detenerSonidosMinijuego?.();
        guardarPartidaPersistida();
    }

    function reanudarTemporizadorPregunta() {
        if (EstadoJuego.partidaFinalizada) return;
        if (!EstadoJuego.preguntas || EstadoJuego.preguntas.length === 0) return;
        if (EstadoJuego.respondida) return;
        if (EstadoJuego.tiempoLimite <= 0) return;
        if (intervaloPregunta) return; // ya activo, evitar duplicación

        const ventanaCS = document.getElementById("ventanaConocesSolares");
        if (!ventanaCS || ventanaCS.style.display === "none" || getComputedStyle(ventanaCS).display === "none") {
            return;
        }

        const panelJuego = document.getElementById("cjsPanelJuego");
        if (!panelJuego || panelJuego.style.display === "none" || getComputedStyle(panelJuego).display === "none") {
            return;
        }

        const tiempoRestante = (EstadoJuego.tiempoRestante !== undefined && EstadoJuego.tiempoRestante !== null)
            ? Math.max(0, parseInt(EstadoJuego.tiempoRestante, 10))
            : EstadoJuego.tiempoLimite;

        if (tiempoRestante <= 0) {
            tiempoAgotado();
            return;
        }

        iniciarTemporizadorPregunta(tiempoRestante);
    }

    function tiempoAgotado() {
        if (EstadoJuego.respondida) return;
        EstadoJuego.respondida = true;

        contraerSeccionPistas();

        const pregData = EstadoJuego.preguntas[EstadoJuego.preguntaActualIdx];
        if (!pregData) return;

        reproducirSonidoSeguro("alarma_tiempo");

        // Deshabilitar todas las opciones y marcar la correcta
        const botonesOpciones = document.querySelectorAll("#cjsOpcionesGrid .cjs-btn-opcion");
        botonesOpciones.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.mundo.trim().toLowerCase() === pregData.mundoCorrecto.trim().toLowerCase()) {
                btn.classList.add("correcta");
            }
        });

        const btnPista = document.getElementById("cjsBtnPedirPista");
        if (btnPista) btnPista.disabled = true;

        if (EstadoJuego.enDesempate) {
            const jugadorActivo = EstadoJuego.turnoJugador === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
            jugadorActivo.respuestasDadas++;
        } else if (EstadoJuego.modo === "individual") {
            EstadoJuego.jugador1.respuestasDadas++;
            if (EstadoJuego.duracionModo === "hasta-fallar") {
                EstadoJuego.jugador1.turnoTerminado = true;
            }
        } else {
            const jugadorActivo = EstadoJuego.turnoJugador === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
            jugadorActivo.respuestasDadas++;

            if (EstadoJuego.duracionModo === "hasta-fallar") {
                jugadorActivo.turnoTerminado = true;
                if (EstadoJuego.turnoJugador === 1 && !EstadoJuego.jugador2.turnoTerminado) {
                    EstadoJuego.turnoJugador = 2;
                }
            } else {
                // En modo dos jugadores, al agotarse el tiempo el turno pasa al rival si le quedan respuestas
                const rivalNum = EstadoJuego.turnoJugador === 1 ? 2 : 1;
                const rivalData = rivalNum === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
                if (rivalData.respuestasDadas < EstadoJuego.numRondas) {
                    EstadoJuego.turnoJugador = rivalNum;
                }
            }
        }

        actualizarMarcadorBarra();
        guardarPartidaPersistida();

        // Revelar fotografía real del solar antes de la transición
        revelarFotoYTransicionar();
    }

    // ─── RESOLUCIÓN E INYECCIÓN ROBUSTA DE ICONOS DE MUNDOS ──
    function obtenerRutaIconoMundoSegura(mundo) {
        if (!mundo) return null;
        try {
            if (typeof window.rutaIconoMundo === "function") {
                const r = window.rutaIconoMundo(mundo);
                if (r) return r;
            }
        } catch (e) {}

        if (window.database && window.database.iconosMundos) {
            const clave = mundo.trim().toLowerCase();
            if (window.database.iconosMundos[clave]) {
                return window.database.iconosMundos[clave].ruta;
            }
        }

        if (window.database && Array.isArray(window.database.mundos)) {
            const mNorm = mundo.trim().toLowerCase();
            const fila = window.database.mundos.find(m => (m[0] || "").trim().toLowerCase() === mNorm);
            if (fila && fila[1]) {
                return `img/mundos-con-solares/${fila[1]}/icono.webp`;
            }
        }
        return null;
    }

    function refrescarIconosOpcionesEnDOM() {
        const botones = document.querySelectorAll("#cjsOpcionesGrid .cjs-btn-opcion");
        botones.forEach(btn => {
            const mundo = btn.dataset.mundo;
            if (!mundo) return;
            const ruta = obtenerRutaIconoMundoSegura(mundo);
            if (ruta) {
                let img = btn.querySelector(".cjs-opcion-mundo-img");
                const fallback = btn.querySelector(".cjs-opcion-mundo-fallback");
                if (img) {
                    img.src = ruta;
                    img.style.display = "";
                } else {
                    img = document.createElement("img");
                    img.src = ruta;
                    img.alt = mundo;
                    img.className = "cjs-opcion-mundo-img";
                    img.onerror = function () {
                        this.style.display = "none";
                        if (this.nextElementSibling) this.nextElementSibling.style.display = "inline-flex";
                    };
                    btn.insertBefore(img, btn.firstChild);
                }
                if (fallback) fallback.style.display = "none";
            }
        });
    }

    // ─── PERSISTENCIA ROBUSTA DE PARTIDA (localStorage) ─────
    let minijuegoAbiertoActualmente = false;

    function estaMinijuegoVisible() {
        if (minijuegoAbiertoActualmente) return true;
        const v = document.getElementById("ventanaConocesSolares");
        return !!(v && (v.style.display === "block" || v.style.display === "flex" || getComputedStyle(v).display !== "none"));
    }

    function marcarMinijuegoCerrado() {
        minijuegoAbiertoActualmente = false;
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PARTIDA);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && typeof data === "object") {
                    data.minijuegoAbierto = false;
                    localStorage.setItem(STORAGE_KEY_PARTIDA, JSON.stringify(data));
                }
            }
        } catch (e) {}
    }

    function aplicarConfiguracionAUI() {
        const inputIndiv = document.getElementById("cjsInputNombreIndiv");
        const inputJ1 = document.getElementById("cjsInputNombreJ1");
        const inputJ2 = document.getElementById("cjsInputNombreJ2");
        if (inputIndiv && EstadoJuego.jugador1?.nombre) inputIndiv.value = EstadoJuego.jugador1.nombre;
        if (inputJ1 && EstadoJuego.jugador1?.nombre) inputJ1.value = EstadoJuego.jugador1.nombre;
        if (inputJ2 && EstadoJuego.jugador2?.nombre) inputJ2.value = EstadoJuego.jugador2.nombre;

        const btnModoIndiv = document.getElementById("cjsBtnModoIndiv");
        const btnModo2J = document.getElementById("cjsBtnModo2J");
        const wrapIndiv = document.getElementById("cjsWrapJugadorIndiv");
        const wrap2J = document.getElementById("cjsWrapJugadores2J");
        const es2J = EstadoJuego.modo === "dos-jugadores";
        btnModoIndiv?.classList.toggle("activo", !es2J);
        btnModo2J?.classList.toggle("activo", es2J);
        if (wrapIndiv) wrapIndiv.style.display = es2J ? "none" : "block";
        if (wrap2J) wrap2J.style.display = es2J ? "grid" : "none";

        const btnHF = document.getElementById("cjsBtnRondasHastaFallar");
        const btn5 = document.getElementById("cjsBtnRondas5");
        const btn10 = document.getElementById("cjsBtnRondas10");
        btnHF?.classList.toggle("activo", EstadoJuego.duracionModo === "hasta-fallar");
        btn5?.classList.toggle("activo", EstadoJuego.duracionModo === "5");
        btn10?.classList.toggle("activo", EstadoJuego.duracionModo === "10");

        const btnTimerOff = document.getElementById("cjsBtnTimerOff");
        const btnTimer60 = document.getElementById("cjsBtnTimer60");
        const btnTimer30 = document.getElementById("cjsBtnTimer30");
        [btnTimerOff, btnTimer60, btnTimer30].forEach(b => {
            if (!b) return;
            const coincide = parseInt(b.dataset.timer, 10) === EstadoJuego.tiempoLimite;
            b.classList.toggle("activo", coincide);
            b.setAttribute("aria-checked", coincide ? "true" : "false");
        });

        if (EstadoJuego.jugador1?.color) {
            const badgeIndiv = document.getElementById("cjsBadgeIndiv");
            if (badgeIndiv) {
                badgeIndiv.style.backgroundColor = EstadoJuego.jugador1.color;
                badgeIndiv.textContent = EstadoJuego.jugador1.colorNombre || "Color";
            }
            const badgeJ1 = document.getElementById("cjsBadgeJ1");
            if (badgeJ1) {
                badgeJ1.style.backgroundColor = EstadoJuego.jugador1.color;
                badgeJ1.textContent = EstadoJuego.jugador1.colorNombre || "Color";
            }
            document.querySelectorAll("#cjsColoresIndiv .cjs-color-opcion, #cjsColoresJ1 .cjs-color-opcion").forEach(b => {
                b.classList.toggle("seleccionado", b.dataset.hex === EstadoJuego.jugador1.color);
            });
        }
        if (EstadoJuego.jugador2?.color) {
            const badgeJ2 = document.getElementById("cjsBadgeJ2");
            if (badgeJ2) {
                badgeJ2.style.backgroundColor = EstadoJuego.jugador2.color;
                badgeJ2.textContent = EstadoJuego.jugador2.colorNombre || "Color";
            }
            document.querySelectorAll("#cjsColoresJ2 .cjs-color-opcion").forEach(b => {
                b.classList.toggle("seleccionado", b.dataset.hex === EstadoJuego.jugador2.color);
            });
        }
    }

    function guardarPartidaPersistida() {
        try {
            const abierto = estaMinijuegoVisible();

            const panelConfig = document.getElementById("cjsPanelConfig");
            const panelJuego = document.getElementById("cjsPanelJuego");
            const enConfig = panelConfig && (panelConfig.style.display !== "none" && getComputedStyle(panelConfig).display !== "none");

            if (enConfig && (!panelJuego || panelJuego.style.display === "none")) {
                leerConfiguracionDesdeUI();
                const snapshotConfig = {
                    estado: "config",
                    minijuegoAbierto: abierto,
                    timestamp: Date.now(),
                    modo: EstadoJuego.modo,
                    duracionModo: EstadoJuego.duracionModo,
                    numRondas: EstadoJuego.numRondas,
                    tiempoLimite: EstadoJuego.tiempoLimite,
                    jugador1: { ...EstadoJuego.jugador1 },
                    jugador2: { ...EstadoJuego.jugador2 }
                };
                localStorage.setItem(STORAGE_KEY_PARTIDA, JSON.stringify(snapshotConfig));
                return;
            }

            if (EstadoJuego.partidaFinalizada) {
                const snapshotFinal = {
                    estado: "finalizada",
                    minijuegoAbierto: abierto,
                    timestamp: Date.now(),
                    modo: EstadoJuego.modo,
                    duracionModo: EstadoJuego.duracionModo,
                    numRondas: EstadoJuego.numRondas,
                    tiempoLimite: EstadoJuego.tiempoLimite,
                    jugador1: { ...EstadoJuego.jugador1 },
                    jugador2: { ...EstadoJuego.jugador2 },
                    turnoJugador: EstadoJuego.turnoJugador,
                    enDesempate: EstadoJuego.enDesempate,
                    preguntasDesempateJugadas: EstadoJuego.preguntasDesempateJugadas,
                    ganadorDesempate: EstadoJuego.ganadorDesempate,
                    desempateRechazado: EstadoJuego.desempateRechazado
                };
                localStorage.setItem(STORAGE_KEY_PARTIDA, JSON.stringify(snapshotFinal));
                return;
            }

            if (EstadoJuego.preguntas && EstadoJuego.preguntas.length > 0) {
                const snapshotEnCurso = {
                    estado: "en_curso",
                    minijuegoAbierto: abierto,
                    timestamp: Date.now(),
                    modo: EstadoJuego.modo,
                    duracionModo: EstadoJuego.duracionModo,
                    numRondas: EstadoJuego.numRondas,
                    tiempoLimite: EstadoJuego.tiempoLimite,
                    tiempoRestante: EstadoJuego.tiempoRestante,
                    jugador1: { ...EstadoJuego.jugador1 },
                    jugador2: { ...EstadoJuego.jugador2 },
                    turnoJugador: EstadoJuego.turnoJugador,
                    preguntaActualIdx: EstadoJuego.preguntaActualIdx,
                    preguntas: EstadoJuego.preguntas.map(p => ({
                        solar: {
                            id: p.solar.id,
                            nombre: p.solar.nombre,
                            mundo: p.solar.mundo,
                            tipoSolar: p.solar.tipoSolar,
                            tipoPack: p.solar.tipoPack,
                            nombrePack: p.solar.nombrePack
                        },
                        mundoCorrecto: p.mundoCorrecto,
                        opciones: p.opciones
                    })),
                    solaresUsadosIds: Array.from(EstadoJuego.solaresUsadosIds || []),
                    pistasUsadas: EstadoJuego.pistasUsadas,
                    pistasReveladas: { ...EstadoJuego.pistasReveladas },
                    opcionesDescartadas: [...EstadoJuego.opcionesDescartadas],
                    respondida: EstadoJuego.respondida,
                    enDesempate: EstadoJuego.enDesempate,
                    preguntasDesempateJugadas: EstadoJuego.preguntasDesempateJugadas,
                    ganadorDesempate: EstadoJuego.ganadorDesempate,
                    desempateRechazado: EstadoJuego.desempateRechazado,
                    eleccionParImparJ1: EstadoJuego.eleccionParImparJ1
                };
                localStorage.setItem(STORAGE_KEY_PARTIDA, JSON.stringify(snapshotEnCurso));
                return;
            }

            // Snapshot de configuración por defecto
            leerConfiguracionDesdeUI();
            const snapshotConfig = {
                estado: "config",
                minijuegoAbierto: abierto,
                timestamp: Date.now(),
                modo: EstadoJuego.modo,
                duracionModo: EstadoJuego.duracionModo,
                numRondas: EstadoJuego.numRondas,
                tiempoLimite: EstadoJuego.tiempoLimite,
                jugador1: { ...EstadoJuego.jugador1 },
                jugador2: { ...EstadoJuego.jugador2 }
            };
            localStorage.setItem(STORAGE_KEY_PARTIDA, JSON.stringify(snapshotConfig));
        } catch (e) {
            console.warn("[LOT-LAB] No se pudo guardar la partida en localStorage:", e);
        }
    }

    function recuperarPartidaPersistida() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PARTIDA) || sessionStorage.getItem(STORAGE_KEY_PARTIDA);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || typeof data !== "object") {
                limpiarPartidaPersistida();
                return null;
            }

            const abierto = (data.minijuegoAbierto !== false);

            if (data.estado === "finalizada") {
                EstadoJuego.modo = data.modo || "individual";
                EstadoJuego.duracionModo = data.duracionModo || (data.numRondas === 10 ? "10" : data.numRondas === 5 ? "5" : "hasta-fallar");
                EstadoJuego.numRondas = data.numRondas !== undefined ? data.numRondas : 0;
                EstadoJuego.tiempoLimite = data.tiempoLimite || 0;
                EstadoJuego.jugador1 = { ...EstadoJuego.jugador1, ...data.jugador1 };
                EstadoJuego.jugador2 = { ...EstadoJuego.jugador2, ...data.jugador2 };
                EstadoJuego.turnoJugador = data.turnoJugador || 1;
                EstadoJuego.enDesempate = !!data.enDesempate;
                EstadoJuego.preguntasDesempateJugadas = data.preguntasDesempateJugadas || 0;
                EstadoJuego.ganadorDesempate = data.ganadorDesempate !== undefined ? data.ganadorDesempate : null;
                EstadoJuego.desempateRechazado = !!data.desempateRechazado;
                EstadoJuego.partidaFinalizada = true;
                aplicarConfiguracionAUI();
                return { exito: true, estado: "finalizada", minijuegoAbierto: abierto };
            }

            if (data.estado === "en_curso" || (Array.isArray(data.preguntas) && data.preguntas.length > 0)) {
                EstadoJuego.modo = data.modo || "individual";
                EstadoJuego.duracionModo = data.duracionModo || (data.numRondas === 10 ? "10" : data.numRondas === 5 ? "5" : "hasta-fallar");
                EstadoJuego.numRondas = data.numRondas !== undefined ? data.numRondas : 0;
                EstadoJuego.tiempoLimite = data.tiempoLimite || 0;
                EstadoJuego.tiempoRestante = data.tiempoRestante !== undefined ? data.tiempoRestante : data.tiempoLimite;
                EstadoJuego.jugador1 = { ...EstadoJuego.jugador1, ...data.jugador1 };
                EstadoJuego.jugador2 = { ...EstadoJuego.jugador2, ...data.jugador2 };
                EstadoJuego.turnoJugador = data.turnoJugador || 1;
                EstadoJuego.preguntaActualIdx = data.preguntaActualIdx || 0;
                EstadoJuego.preguntas = data.preguntas;
                EstadoJuego.solaresUsadosIds = new Set(data.solaresUsadosIds || data.preguntas.map(p => p.solar.id || p.solar.nombre));
                EstadoJuego.pistasUsadas = data.pistasUsadas || 0;
                EstadoJuego.pistasReveladas = data.pistasReveladas || { tipo: false, origen: false, foto: false, descarte: false };
                EstadoJuego.opcionesDescartadas = data.opcionesDescartadas || [];
                EstadoJuego.respondida = !!data.respondida;
                EstadoJuego.enDesempate = !!data.enDesempate;
                EstadoJuego.preguntasDesempateJugadas = data.preguntasDesempateJugadas || 0;
                EstadoJuego.ganadorDesempate = data.ganadorDesempate !== undefined ? data.ganadorDesempate : null;
                EstadoJuego.desempateRechazado = !!data.desempateRechazado;
                EstadoJuego.eleccionParImparJ1 = data.eleccionParImparJ1 || "par";
                EstadoJuego.partidaFinalizada = false;
                aplicarConfiguracionAUI();
                return { exito: true, estado: "en_curso", minijuegoAbierto: abierto };
            }

            if (data.estado === "config") {
                EstadoJuego.modo = data.modo || "individual";
                EstadoJuego.duracionModo = data.duracionModo || "hasta-fallar";
                EstadoJuego.numRondas = data.numRondas !== undefined ? data.numRondas : 0;
                EstadoJuego.tiempoLimite = data.tiempoLimite || 0;
                EstadoJuego.jugador1 = { ...EstadoJuego.jugador1, ...data.jugador1 };
                EstadoJuego.jugador2 = { ...EstadoJuego.jugador2, ...data.jugador2 };
                aplicarConfiguracionAUI();
                return { exito: true, estado: "config", minijuegoAbierto: abierto };
            }

            limpiarPartidaPersistida();
            return null;
        } catch (e) {
            console.warn("[LOT-LAB] Error al restaurar partida persistida:", e);
            limpiarPartidaPersistida();
            return null;
        }
    }

    function limpiarPartidaPersistida() {
        try {
            localStorage.removeItem(STORAGE_KEY_PARTIDA);
            sessionStorage.removeItem(STORAGE_KEY_PARTIDA);
        } catch (e) {}
    }

    // ─── CARGA Y GENERACIÓN DE PREGUNTAS ────────────────────

    function obtenerSolaresValidos() {
        const solares = (window.database && Array.isArray(window.database.solares))
            ? window.database.solares
            : [];
        return solares.filter(s =>
            s &&
            typeof s.nombre === "string" && s.nombre.trim().length > 0 &&
            typeof s.mundo === "string" && s.mundo.trim().length > 0 &&
            typeof s.tipoSolar === "string" && s.tipoSolar.trim().length > 0 &&
            typeof s.tipoPack === "string" && s.tipoPack.trim().length > 0
        );
    }

    function obtenerListaMundosDisponibles() {
        const mundosSet = new Set();
        if (window.database) {
            if (Array.isArray(window.database.mundos)) {
                window.database.mundos.forEach(m => {
                    const nombre = Array.isArray(m) ? m[0] : (typeof m === "string" ? m : (m.nombre || ""));
                    if (nombre) mundosSet.add(nombre.trim());
                });
            }
            if (Array.isArray(window.database.solares)) {
                window.database.solares.forEach(s => {
                    if (s && s.mundo) mundosSet.add(s.mundo.trim());
                });
            }
        }
        return Array.from(mundosSet);
    }

    function barajarArray(array) {
        const copia = [...array];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function generarPreguntaUnica(solaresUsadosSet) {
        const solaresValidos = obtenerSolaresValidos();
        if (!solaresValidos || solaresValidos.length === 0) return null;

        let disponibles = solaresValidos.filter(s => !solaresUsadosSet.has(s.id || s.nombre));
        if (disponibles.length === 0) {
            solaresUsadosSet.clear();
            disponibles = solaresValidos;
        }

        const solarSeleccionado = barajarArray(disponibles)[0];
        solaresUsadosSet.add(solarSeleccionado.id || solarSeleccionado.nombre);

        const todosLosMundos = obtenerListaMundosDisponibles();
        const mundoCorrecto = solarSeleccionado.mundo.trim();
        const otrosMundos = todosLosMundos.filter(m => m.toLowerCase() !== mundoCorrecto.toLowerCase());
        const distractores = barajarArray(otrosMundos).slice(0, 3);

        while (distractores.length < 3) {
            distractores.push(`Mundo ${distractores.length + 1}`);
        }

        const opciones = barajarArray([mundoCorrecto, ...distractores]);

        return {
            solar: solarSeleccionado,
            mundoCorrecto: mundoCorrecto,
            opciones: opciones
        };
    }

    function generarPreguntas(totalPreguntasRequeridas) {
        const solaresValidos = obtenerSolaresValidos();
        if (solaresValidos.length < totalPreguntasRequeridas) {
            return null;
        }

        const todosLosMundos = obtenerListaMundosDisponibles();
        const solaresSeleccionados = barajarArray(solaresValidos).slice(0, totalPreguntasRequeridas);

        return solaresSeleccionados.map(solar => {
            const mundoCorrecto = solar.mundo.trim();
            const otrosMundos = todosLosMundos.filter(m => m.toLowerCase() !== mundoCorrecto.toLowerCase());
            const distractores = barajarArray(otrosMundos).slice(0, 3);

            while (distractores.length < 3) {
                distractores.push(`Mundo ${distractores.length + 1}`);
            }

            const opciones = barajarArray([mundoCorrecto, ...distractores]);

            return {
                solar: solar,
                mundoCorrecto: mundoCorrecto,
                opciones: opciones
            };
        });
    }

    function generarPreguntaDesempate() {
        const solaresValidos = obtenerSolaresValidos();
        const solaresUsadosIds = new Set(EstadoJuego.preguntas.map(p => p.solar.id || p.solar.nombre));
        const disponibles = solaresValidos.filter(s => !solaresUsadosIds.has(s.id || s.nombre));

        if (disponibles.length === 0) {
            console.warn("[Desempate] No quedan solares válidos no utilizados en la base de datos.");
            return null;
        }

        const solarSeleccionado = barajarArray(disponibles)[0];
        const todosLosMundos = obtenerListaMundosDisponibles();
        const mundoCorrecto = solarSeleccionado.mundo.trim();
        const otrosMundos = todosLosMundos.filter(m => m.toLowerCase() !== mundoCorrecto.toLowerCase());
        const distractores = barajarArray(otrosMundos).slice(0, 3);

        while (distractores.length < 3) {
            distractores.push(`Mundo ${distractores.length + 1}`);
        }

        const opciones = barajarArray([mundoCorrecto, ...distractores]);

        return {
            solar: solarSeleccionado,
            mundoCorrecto: mundoCorrecto,
            opciones: opciones
        };
    }

    // ─── INICIALIZACIÓN DE LA PARTIDA ───────────────────────

    function iniciarNuevaPartida(mismaConfiguracion = false) {
        limpiarTodosLosTemporizadores();
        limpiarPartidaPersistida();

        minijuegoAbiertoActualmente = true;
        const ventanaCS = document.getElementById("ventanaConocesSolares");
        if (ventanaCS && (ventanaCS.style.display === "none" || getComputedStyle(ventanaCS).display === "none")) {
            if (typeof window.abrirVentana === "function") {
                window.abrirVentana("ventanaConocesSolares", true);
            } else {
                ventanaCS.style.display = "block";
            }
        }

        if (!mismaConfiguracion) {
            leerConfiguracionDesdeUI();
        }

        EstadoJuego.solaresUsadosIds = new Set();
        EstadoJuego.partidaFinalizada = false;

        if (EstadoJuego.duracionModo === "hasta-fallar") {
            const primeraPregunta = generarPreguntaUnica(EstadoJuego.solaresUsadosIds);
            if (!primeraPregunta) {
                alert(`No hay suficientes solares válidos en la base de datos (${obtenerSolaresValidos().length}) para iniciar la partida.`);
                return;
            }
            EstadoJuego.preguntas = [primeraPregunta];
            EstadoJuego.preguntaActualIdx = 0;
            EstadoJuego.numRondas = 0;
        } else {
            const totalPreguntas = EstadoJuego.modo === "individual"
                ? EstadoJuego.numRondas
                : EstadoJuego.numRondas * 2;

            const preguntas = generarPreguntas(totalPreguntas);
            if (!preguntas || preguntas.length === 0) {
                alert(`No hay suficientes solares válidos en la base de datos (${obtenerSolaresValidos().length}) para generar una partida de ${totalPreguntas} preguntas.`);
                return;
            }
            EstadoJuego.preguntas = preguntas;
            EstadoJuego.preguntaActualIdx = 0;
            preguntas.forEach(p => EstadoJuego.solaresUsadosIds.add(p.solar.id || p.solar.nombre));
        }

        EstadoJuego.turnoJugador = 1;
        EstadoJuego.jugador1.puntos = 0;
        EstadoJuego.jugador1.aciertos = 0;
        EstadoJuego.jugador1.respuestasDadas = 0;
        EstadoJuego.jugador1.turnoTerminado = false;

        EstadoJuego.jugador2.puntos = 0;
        EstadoJuego.jugador2.aciertos = 0;
        EstadoJuego.jugador2.respuestasDadas = 0;
        EstadoJuego.jugador2.turnoTerminado = false;

        EstadoJuego.pistasUsadas = 0;
        EstadoJuego.pistasReveladas = { tipo: false, origen: false, foto: false, descarte: false };
        EstadoJuego.opcionesDescartadas = [];
        EstadoJuego.respondida = false;
        EstadoJuego.enDesempate = false;
        EstadoJuego.preguntasDesempateJugadas = 0;
        EstadoJuego.ganadorDesempate = null;
        EstadoJuego.desempateRechazado = false;

        mostrarPantalla("juego");
        cargarPreguntaActual();
        reproducirSonidoSeguro("apertura");
        guardarPartidaPersistida();
    }

    function leerConfiguracionDesdeUI() {
        const inputJ1 = document.getElementById("cjsInputNombreJ1");
        const inputJ2 = document.getElementById("cjsInputNombreJ2");
        const inputIndiv = document.getElementById("cjsInputNombreIndiv");

        if (EstadoJuego.modo === "individual") {
            const nom = (inputIndiv?.value || "").trim();
            EstadoJuego.jugador1.nombre = nom || "Simmer";
        } else {
            const nom1 = (inputJ1?.value || "").trim();
            const nom2 = (inputJ2?.value || "").trim();
            EstadoJuego.jugador1.nombre = nom1 || "Jugador 1";
            EstadoJuego.jugador2.nombre = nom2 || "Jugador 2";
        }
    }

    function cargarPreguntaActual(esRestauracion = false) {
        limpiarTodosLosTemporizadores();

        const idx = EstadoJuego.preguntaActualIdx;
        const pregData = EstadoJuego.preguntas[idx];
        if (!pregData) {
            finalizarPartida();
            return;
        }

        if (!esRestauracion) {
            EstadoJuego.pistasUsadas = 0;
            EstadoJuego.pistasReveladas = { tipo: false, origen: false, foto: false, descarte: false };
            EstadoJuego.opcionesDescartadas = [];
            EstadoJuego.respondida = false;
        }

        // Ocultar transición anterior si estaba visible
        const elTransicion = document.getElementById("cjsTransicionCuentaAtras");
        if (elTransicion) elTransicion.style.display = "none";

        actualizarMarcadorBarra();

        // 1. Nombre del solar: SIN comillas angulares « » (Requisito 10.1)
        const elSolarNombre = document.getElementById("cjsSolarNombre");
        if (elSolarNombre) {
            elSolarNombre.textContent = pregData.solar.nombre;
        }

        // 2. Subtono y marco reforzado del jugador activo en la tarjeta de la pregunta (Requisito 11.2)
        const jugadorActivo = (EstadoJuego.modo === "individual" || EstadoJuego.turnoJugador === 1)
            ? EstadoJuego.jugador1
            : EstadoJuego.jugador2;
        const cardPregunta = document.querySelector(".cjs-pregunta-card");
        if (cardPregunta) {
            const esDia = document.body.classList.contains("modo-dia");
            cardPregunta.style.backgroundColor = hexToRgba(jugadorActivo.color, esDia ? 0.08 : 0.12);
            cardPregunta.style.borderColor = jugadorActivo.color || "#2ecc71";
        }

        // MEJORA 1: Establecer la variable CSS para el hover de respuestas con el color del jugador activo
        const panelJuego = document.getElementById("cjsPanelJuego");
        if (panelJuego) {
            panelJuego.style.setProperty("--cjs-color-jugador-activo", jugadorActivo.color || "#2ecc71");
        }

        // MEJORA 2: Resetear y precargar la foto real del solar
        const fotoWrap = document.getElementById("cjsSolarFotoReveladaWrap");
        const fotoImg = document.getElementById("cjsSolarFotoReveladaImg");
        if (fotoWrap) fotoWrap.classList.remove("expandido");
        restablecerSeccionPistas();
        if (fotoImg && pregData && pregData.solar) {
            obtenerFotoRealSolarPregunta(pregData.solar.id).then(url => {
                if (url) fotoImg.src = url;
            });
        }

        // 3. Badge de Muerte Súbita si corresponde
        const badgeMuerteSubita = document.getElementById("cjsBadgeMuerteSubita");
        if (badgeMuerteSubita) {
            badgeMuerteSubita.style.display = EstadoJuego.enDesempate ? "inline-block" : "none";
        }

        // 4. Renderizar opciones con halos circulares del color de énfasis (Requisito 4.2)
        const contOpciones = document.getElementById("cjsOpcionesGrid");
        if (contOpciones) {
            contOpciones.innerHTML = "";
            pregData.opciones.forEach(mundo => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "cjs-btn-opcion";
                btn.dataset.mundo = mundo;

                const rutaIcono = obtenerRutaIconoMundoSegura(mundo);
                let iconoHTML = "";
                if (rutaIcono) {
                    iconoHTML = `
                        <img src="${escapeHtml(rutaIcono)}" alt="${escapeHtml(mundo)}" class="cjs-opcion-mundo-img" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='inline-flex';">
                        <span class="cjs-opcion-mundo-fallback" style="display:none;">🌍</span>
                    `;
                } else {
                    iconoHTML = `<span class="cjs-opcion-mundo-fallback">🌍</span>`;
                }

                btn.innerHTML = `
                    ${iconoHTML}
                    <span class="cjs-opcion-mundo-nombre">${escapeHtml(mundo)}</span>
                `;

                if (esRestauracion && EstadoJuego.opcionesDescartadas.includes(mundo)) {
                    btn.classList.add("descartada");
                    btn.disabled = true;
                    btn.setAttribute("aria-disabled", "true");
                    btn.tabIndex = -1;
                }

                btn.addEventListener("click", () => responderPregunta(mundo, btn));
                btn.addEventListener("mouseenter", () => reproducirSonidoSeguro("hover"));
                contOpciones.appendChild(btn);
            });
        }

        // 5. Restablecer / Reconstruir panel de pistas
        actualizarIndicadoresPistas();
        const contListaPistas = document.getElementById("cjsListaPistasReveladas");
        if (contListaPistas) contListaPistas.innerHTML = "";

        const limitePistas = EstadoJuego.enDesempate ? 2 : 4;
        const btnPista = document.getElementById("cjsBtnPedirPista");

        if (esRestauracion && EstadoJuego.pistasUsadas > 0) {
            // Reconstruir pistas reveladas previamente sin descontar puntos de nuevo
            if (EstadoJuego.pistasReveladas.tipo && contListaPistas) {
                const item1 = document.createElement("div");
                item1.className = "cjs-pista-item";
                item1.innerHTML = `<strong>Pista 1 — Tipo de solar:</strong> ${escapeHtml(pregData.solar.tipoSolar)}`;
                contListaPistas.appendChild(item1);
            }
            if (EstadoJuego.pistasReveladas.origen && contListaPistas) {
                const item2 = document.createElement("div");
                item2.className = "cjs-pista-item";
                item2.innerHTML = `<strong>Pista 2 — Pack de origen:</strong> ${escapeHtml(obtenerCategoriaOrigenPista2(pregData.solar))}`;
                contListaPistas.appendChild(item2);
            }
            if (EstadoJuego.pistasReveladas.foto && contListaPistas) {
                const item3 = document.createElement("div");
                item3.className = "cjs-pista-item cjs-pista-item-imagen";
                item3.innerHTML = `
                    <div style="font-weight: 700; width: 100%; text-align: left;">Pista 3 — Foto del solar:</div>
                    <img src="img/solares/${encodeURIComponent(pregData.solar.id || '')}/foto1.webp" alt="Foto del solar ${escapeHtml(pregData.solar.nombre)}" class="cjs-pista-img-preview" onerror="this.parentElement.innerHTML='<strong>Pista 3 — Foto del solar:</strong> 📷 Imagen no disponible en la galería de este solar (puedes continuar jugando).'"/>
                `;
                contListaPistas.appendChild(item3);
            }
            if (EstadoJuego.pistasReveladas.descarte && contListaPistas) {
                const item4 = document.createElement("div");
                item4.className = "cjs-pista-item";
                item4.innerHTML = `<strong>Pista 4 — Descarte 50/50:</strong> Se han eliminado 2 opciones incorrectas con destello cálido.`;
                contListaPistas.appendChild(item4);
            }

            if (btnPista) {
                if (EstadoJuego.pistasUsadas < limitePistas) {
                    btnPista.disabled = false;
                    btnPista.innerHTML = `💡 Pedir pista (${EstadoJuego.pistasUsadas + 1} de ${limitePistas}) <span style="font-size: 0.82rem; opacity: 0.85;">[-100 pts]</span>`;
                } else {
                    btnPista.disabled = true;
                    btnPista.innerHTML = EstadoJuego.enDesempate
                        ? `💡 Pistas 3 y 4 desactivadas en desempate`
                        : `💡 Todas las pistas utilizadas`;
                }
            }
        } else if (btnPista) {
            btnPista.disabled = false;
            btnPista.innerHTML = EstadoJuego.enDesempate
                ? `💡 Pedir pista (1 de 2) <span style="font-size: 0.82rem; opacity: 0.85;">[-100 pts]</span>`
                : `💡 Pedir pista (1 de 4) <span style="font-size: 0.82rem; opacity: 0.85;">[-100 pts]</span>`;
        }

        // 6. Iniciar temporizador si está habilitado
        if (esRestauracion && EstadoJuego.tiempoLimite > 0) {
            iniciarTemporizadorPregunta(EstadoJuego.tiempoRestante);
        } else {
            iniciarTemporizadorPregunta();
        }

        guardarPartidaPersistida();
    }

    function actualizarMarcadorBarra() {
        const totalPreguntas = EstadoJuego.modo === "individual"
            ? EstadoJuego.numRondas
            : EstadoJuego.numRondas * 2;

        const elRonda = document.getElementById("cjsInfoRonda");
        if (elRonda) {
            if (EstadoJuego.enDesempate) {
                elRonda.textContent = `Desempate — Ronda ${EstadoJuego.preguntasDesempateJugadas}`;
            } else if (EstadoJuego.duracionModo === "hasta-fallar") {
                if (EstadoJuego.modo === "individual") {
                    elRonda.textContent = `Hasta fallar • Solar ${EstadoJuego.preguntaActualIdx + 1} (Aciertos: ${EstadoJuego.jugador1.aciertos})`;
                } else {
                    const jActivo = EstadoJuego.turnoJugador === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
                    elRonda.textContent = `Hasta fallar • Turno de ${escapeHtml(jActivo.nombre)} (Solar ${jActivo.respuestasDadas + 1})`;
                }
            } else {
                elRonda.textContent = `Pregunta ${EstadoJuego.preguntaActualIdx + 1} de ${totalPreguntas}`;
            }
        }

        const elPuntosPreg = document.getElementById("cjsPuntosEnJuego");
        if (elPuntosPreg) {
            const recompensa = Math.max(100, 500 - (EstadoJuego.pistasUsadas * 100));
            elPuntosPreg.textContent = `Recompensa: ${formatearPuntos(recompensa)}`;
        }

        const elTurno = document.getElementById("cjsMarcadorTurno");
        const contMarcador2J = document.getElementById("cjsMarcadorDosJugadores");

        if (EstadoJuego.modo === "individual") {
            if (elTurno) {
                elTurno.style.backgroundColor = EstadoJuego.jugador1.color;
                elTurno.innerHTML = `👤 ${escapeHtml(EstadoJuego.jugador1.nombre)} • ${formatearPuntosCorto(EstadoJuego.jugador1.puntos)}`;
            }
            if (contMarcador2J) contMarcador2J.style.display = "none";
        } else {
            const jugadorActivo = EstadoJuego.turnoJugador === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
            const turnoNum = jugadorActivo.respuestasDadas + 1;
            const totalTurnos = EstadoJuego.numRondas;

            if (elTurno) {
                elTurno.style.backgroundColor = jugadorActivo.color;
                if (EstadoJuego.enDesempate) {
                    elTurno.innerHTML = `⚔️ Turno: ${escapeHtml(jugadorActivo.nombre)} (Muerte súbita)`;
                } else if (EstadoJuego.duracionModo === "hasta-fallar") {
                    elTurno.innerHTML = `👥 Turno: ${escapeHtml(jugadorActivo.nombre)} (Aciertos: ${jugadorActivo.aciertos})`;
                } else {
                    elTurno.innerHTML = `👥 Turno: ${escapeHtml(jugadorActivo.nombre)} (Respuesta ${Math.min(turnoNum, totalTurnos)} de ${totalTurnos})`;
                }
            }

            if (contMarcador2J) {
                contMarcador2J.style.display = "flex";
                const textoRachaJ1 = EstadoJuego.duracionModo === "hasta-fallar"
                    ? `${EstadoJuego.jugador1.aciertos} aciertos${EstadoJuego.jugador1.turnoTerminado ? ' (Fin turno)' : ''}`
                    : `${EstadoJuego.jugador1.respuestasDadas}/${EstadoJuego.numRondas}`;
                const textoRachaJ2 = EstadoJuego.duracionModo === "hasta-fallar"
                    ? `${EstadoJuego.jugador2.aciertos} aciertos${EstadoJuego.jugador2.turnoTerminado ? ' (Fin turno)' : ''}`
                    : `${EstadoJuego.jugador2.respuestasDadas}/${EstadoJuego.numRondas}`;

                contMarcador2J.innerHTML = `
                    <div class="cjs-jugador-marcador-item ${EstadoJuego.turnoJugador === 1 && !EstadoJuego.jugador1.turnoTerminado ? 'turno-activo' : ''}" style="background-color: ${EstadoJuego.jugador1.color};">
                        <span>👤 ${escapeHtml(EstadoJuego.jugador1.nombre)}</span>
                        <span>•</span>
                        <span>${textoRachaJ1}</span>
                        <span>•</span>
                        <span>${formatearPuntosCorto(EstadoJuego.jugador1.puntos)}</span>
                    </div>
                    <div class="cjs-jugador-marcador-item ${EstadoJuego.turnoJugador === 2 && !EstadoJuego.jugador2.turnoTerminado ? 'turno-activo' : ''}" style="background-color: ${EstadoJuego.jugador2.color};">
                        <span>👤 ${escapeHtml(EstadoJuego.jugador2.nombre)}</span>
                        <span>•</span>
                        <span>${textoRachaJ2}</span>
                        <span>•</span>
                        <span>${formatearPuntosCorto(EstadoJuego.jugador2.puntos)}</span>
                    </div>
                `;
            }
        }
    }

    function obtenerCategoriaOrigenPista2(solar) {
        const tipo = (solar && typeof solar.tipoPack === "string") ? solar.tipoPack.trim() : "";
        if (tipo === "Juego base") return "Juego base";
        if (tipo === "Expansión" || tipo === "Expansion") return "Expansión";
        if (tipo === "Contenido") return "Contenido";
        if (/juego\s*base/i.test(tipo)) return "Juego base";
        if (/expansi[oó]n/i.test(tipo)) return "Expansión";
        if (/contenido/i.test(tipo)) return "Contenido";
        return tipo || "Juego base";
    }

    async function pedirPista() {
        if (EstadoJuego.respondida) return;

        // En desempate, solo pistas 1 y 2 permitidas (Requisito 9.3)
        const limitePistas = EstadoJuego.enDesempate ? 2 : 4;
        if (EstadoJuego.pistasUsadas >= limitePistas) return;

        const pregData = EstadoJuego.preguntas[EstadoJuego.preguntaActualIdx];
        if (!pregData) return;

        EstadoJuego.pistasUsadas++;
        reproducirSonidoSeguro("click");

        const contLista = document.getElementById("cjsListaPistasReveladas");
        const pistaItem = document.createElement("div");
        pistaItem.className = "cjs-pista-item";

        // Pista 1: Tipo de solar
        if (EstadoJuego.pistasUsadas === 1) {
            EstadoJuego.pistasReveladas.tipo = true;
            const tipoSolar = pregData.solar.tipoSolar || "No especificado";
            pistaItem.innerHTML = `<strong>Pista 1 — Tipo de solar:</strong> ${escapeHtml(tipoSolar)}`;
        }
        // Pista 2: Pack de origen (Requisito 5)
        else if (EstadoJuego.pistasUsadas === 2) {
            EstadoJuego.pistasReveladas.origen = true;
            const origenTexto = obtenerCategoriaOrigenPista2(pregData.solar);
            pistaItem.innerHTML = `<strong>Pista 2 — Pack de origen:</strong> ${escapeHtml(origenTexto)}`;
        }
        // Pista 3: Foto del solar (Requisito 5: conserva última foto de galería)
        else if (EstadoJuego.pistasUsadas === 3) {
            EstadoJuego.pistasReveladas.foto = true;
            pistaItem.innerHTML = `<strong>Pista 3 — Foto del solar:</strong> Cargando imagen real...`;

            let urlFoto = null;
            try {
                if (typeof window.obtenerUltimaFotoSolar === "function") {
                    urlFoto = await window.obtenerUltimaFotoSolar(pregData.solar.id);
                } else if (typeof window.obtenerUltimaFotoSolarSync === "function") {
                    urlFoto = window.obtenerUltimaFotoSolarSync(pregData.solar.id);
                }
            } catch (err) {
                console.warn("[Minijuego] Error al consultar la foto del solar:", err);
            }

            if (urlFoto) {
                pistaItem.className = "cjs-pista-item cjs-pista-item-imagen";
                pistaItem.innerHTML = `
                    <div style="font-weight: 700; width: 100%; text-align: left;">Pista 3 — Foto del solar:</div>
                    <img src="${encodeURI(urlFoto)}" alt="Foto del solar ${escapeHtml(pregData.solar.nombre)}" class="cjs-pista-img-preview" onerror="this.parentElement.innerHTML='<strong>Pista 3 — Foto del solar:</strong> 📷 Imagen no disponible en la galería de este solar (puedes continuar jugando).'"/>
                `;
            } else {
                pistaItem.innerHTML = `<strong>Pista 3 — Foto del solar:</strong> 📷 Imagen no disponible en la galería de este solar (puedes continuar jugando normalmente).`;
            }
        }
        // Pista 4: Descarte 50/50 con destello cálido (Requisito 6)
        else if (EstadoJuego.pistasUsadas === 4) {
            EstadoJuego.pistasReveladas.descarte = true;
            pistaItem.innerHTML = `<strong>Pista 4 — Descarte 50/50:</strong> Se han eliminado 2 opciones incorrectas con destello cálido.`;

            const opcionesIncorrectas = pregData.opciones.filter(
                m => m.toLowerCase() !== pregData.mundoCorrecto.toLowerCase()
            );
            const aDescartar = barajarArray(opcionesIncorrectas).slice(0, 2);
            EstadoJuego.opcionesDescartadas = aDescartar;

            const botonesOpciones = document.querySelectorAll("#cjsOpcionesGrid .cjs-btn-opcion");
            botonesOpciones.forEach(btn => {
                const m = btn.dataset.mundo;
                if (aDescartar.includes(m)) {
                    btn.classList.add("descarte-parpadeo");
                    setTimeout(() => {
                        btn.classList.remove("descarte-parpadeo");
                        btn.classList.add("descartada");
                        btn.disabled = true;
                        btn.setAttribute("aria-disabled", "true");
                        btn.tabIndex = -1;
                    }, 700);
                }
            });
        }

        if (contLista) {
            contLista.appendChild(pistaItem);
        }

        actualizarIndicadoresPistas();

        const btnPista = document.getElementById("cjsBtnPedirPista");
        if (btnPista) {
            if (EstadoJuego.pistasUsadas < limitePistas) {
                btnPista.innerHTML = `💡 Pedir pista (${EstadoJuego.pistasUsadas + 1} de ${limitePistas}) <span style="font-size: 0.82rem; opacity: 0.85;">[-100 pts]</span>`;
            } else {
                btnPista.disabled = true;
                btnPista.innerHTML = EstadoJuego.enDesempate
                    ? `💡 Pistas 3 y 4 desactivadas en desempate`
                    : `💡 Todas las pistas utilizadas`;
            }
        }

        actualizarMarcadorBarra();
        guardarPartidaPersistida();
    }

    function actualizarIndicadoresPistas() {
        for (let i = 1; i <= 4; i++) {
            const dot = document.getElementById(`cjsPistaDot${i}`);
            if (dot) {
                dot.classList.toggle("usada", i <= EstadoJuego.pistasUsadas);
                if (EstadoJuego.enDesempate && i > 2) {
                    dot.title = "Pista desactivada en desempate";
                    dot.style.opacity = "0.2";
                } else {
                    dot.style.opacity = "";
                }
            }
        }
    }

    function contraerSeccionPistas() {
        const pistasWrapper = document.getElementById("cjsPistasWrapper") || document.querySelector(".cjs-pistas-wrapper");
        if (pistasWrapper) {
            pistasWrapper.classList.add("contraida");
        }
    }

    function restablecerSeccionPistas() {
        const pistasWrapper = document.getElementById("cjsPistasWrapper") || document.querySelector(".cjs-pistas-wrapper");
        if (pistasWrapper) {
            pistasWrapper.classList.remove("contraida");
        }
    }

    // ─── RESPUESTA Y FLUJO AUTOMÁTICO 3, 2, 1 (Requisito 7) ───

    function responderPregunta(mundoElegido, botonPulsado) {
        if (EstadoJuego.respondida) return;
        EstadoJuego.respondida = true;

        detenerTemporizadorPregunta();

        // Contraer suavemente la sección de pistas de inmediato al seleccionar una respuesta
        contraerSeccionPistas();

        const pregData = EstadoJuego.preguntas[EstadoJuego.preguntaActualIdx];
        if (!pregData) return;

        const esCorrecta = (mundoElegido.trim().toLowerCase() === pregData.mundoCorrecto.trim().toLowerCase());
        const puntosGanados = esCorrecta ? Math.max(100, 500 - (EstadoJuego.pistasUsadas * 100)) : 0;

        // Deshabilitar todas las opciones y marcar correcta/errónea (Requisito 4.3)
        const botonesOpciones = document.querySelectorAll("#cjsOpcionesGrid .cjs-btn-opcion");
        botonesOpciones.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.mundo.trim().toLowerCase() === pregData.mundoCorrecto.trim().toLowerCase()) {
                btn.classList.add("correcta");
            } else if (btn === botonPulsado && !esCorrecta) {
                btn.classList.add("incorrecta");
            }
        });

        // Deshabilitar botón de pedir pista
        const btnPista = document.getElementById("cjsBtnPedirPista");
        if (btnPista) btnPista.disabled = true;

        // Registro de puntos y aciertos
        if (EstadoJuego.enDesempate) {
            const jugadorActivo = EstadoJuego.turnoJugador === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
            jugadorActivo.respuestasDadas++;
            if (esCorrecta) {
                reproducirSonidoSeguro("exito");
                jugadorActivo.puntos += puntosGanados;
                jugadorActivo.aciertos++;
                // Victoria instantánea por muerte súbita
                EstadoJuego.ganadorDesempate = EstadoJuego.turnoJugador;
            } else {
                reproducirSonidoSeguro("error");
            }
        } else if (EstadoJuego.duracionModo === "hasta-fallar") {
            if (EstadoJuego.modo === "individual") {
                EstadoJuego.jugador1.respuestasDadas++;
                if (esCorrecta) {
                    reproducirSonidoSeguro("exito");
                    EstadoJuego.jugador1.puntos += puntosGanados;
                    EstadoJuego.jugador1.aciertos++;
                } else {
                    reproducirSonidoSeguro("error");
                    EstadoJuego.jugador1.turnoTerminado = true;
                }
            } else {
                const jugadorActivo = EstadoJuego.turnoJugador === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
                jugadorActivo.respuestasDadas++;
                if (esCorrecta) {
                    reproducirSonidoSeguro("exito");
                    jugadorActivo.puntos += puntosGanados;
                    jugadorActivo.aciertos++;
                    // Conserva turno mientras acierte
                } else {
                    reproducirSonidoSeguro("error");
                    jugadorActivo.turnoTerminado = true;
                    // Al fallar J1, su turno termina y comienza el de J2
                    if (EstadoJuego.turnoJugador === 1 && !EstadoJuego.jugador2.turnoTerminado) {
                        EstadoJuego.turnoJugador = 2;
                    }
                }
            }
        } else if (EstadoJuego.modo === "individual") {
            EstadoJuego.jugador1.respuestasDadas++;
            if (esCorrecta) {
                reproducirSonidoSeguro("exito");
                EstadoJuego.jugador1.puntos += puntosGanados;
                EstadoJuego.jugador1.aciertos++;
            } else {
                reproducirSonidoSeguro("error");
            }
        } else {
            const jugadorActivo = EstadoJuego.turnoJugador === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
            jugadorActivo.respuestasDadas++;
            if (esCorrecta) {
                reproducirSonidoSeguro("exito");
                jugadorActivo.puntos += puntosGanados;
                jugadorActivo.aciertos++;
            } else {
                reproducirSonidoSeguro("error");
            }

            // Actualizar jugador activo inmediatamente para la siguiente pregunta
            const totalPorJugador = EstadoJuego.numRondas;
            const rivalNum = EstadoJuego.turnoJugador === 1 ? 2 : 1;
            const rivalData = rivalNum === 1 ? EstadoJuego.jugador1 : EstadoJuego.jugador2;

            if (esCorrecta) {
                if (jugadorActivo.respuestasDadas < totalPorJugador) {
                    // Conserva turno
                } else if (rivalData.respuestasDadas < totalPorJugador) {
                    EstadoJuego.turnoJugador = rivalNum;
                }
            } else {
                if (rivalData.respuestasDadas < totalPorJugador) {
                    EstadoJuego.turnoJugador = rivalNum;
                }
            }
        }

        actualizarMarcadorBarra();
        guardarPartidaPersistida();

        // MEJORA 2: Revelar fotografía real del solar antes de pasar a la siguiente
        revelarFotoYTransicionar();
    }

    async function obtenerFotoRealSolarPregunta(idSolar) {
        if (!idSolar) return null;
        try {
            if (typeof window.obtenerUltimaFotoSolar === "function") {
                const url = await window.obtenerUltimaFotoSolar(idSolar);
                if (url) return url;
            }
            if (typeof window.obtenerUltimaFotoSolarSync === "function") {
                const url = window.obtenerUltimaFotoSolarSync(idSolar);
                if (url) return url;
            }
        } catch (e) {
            console.warn("[Minijuego] Error al obtener foto real del solar:", e);
        }
        return `img/solares/${encodeURIComponent(idSolar)}/foto1.webp`;
    }

    function revelarFotoYTransicionar() {
        limpiarTodosLosTemporizadores();

        const pregData = EstadoJuego.preguntas[EstadoJuego.preguntaActualIdx];
        const fotoWrap = document.getElementById("cjsSolarFotoReveladaWrap");
        const fotoImg = document.getElementById("cjsSolarFotoReveladaImg");

        const procederACuentaAtras = () => {
            if (fotoWrap) {
                fotoWrap.classList.remove("expandido");
            }
            timeoutTransicion = setTimeout(() => {
                iniciarCuentaAtrasTransicion();
            }, 350);
        };

        if (fotoWrap && fotoImg && pregData && pregData.solar) {
            obtenerFotoRealSolarPregunta(pregData.solar.id).then(url => {
                if (url) {
                    fotoImg.src = url;
                }
                fotoWrap.classList.add("expandido");

                // Mantener visible entre 2,5 y 3 segundos (2800 ms) para observación completa
                timeoutPlegadoFoto = setTimeout(() => {
                    procederACuentaAtras();
                }, 2800);
            }).catch(() => {
                procederACuentaAtras();
            });
        } else {
            iniciarCuentaAtrasTransicion();
        }
    }

    function iniciarCuentaAtrasTransicion() {
        limpiarTodosLosTemporizadores();

        const elSolarNombre = document.getElementById("cjsSolarNombre");
        let segundos = 3;

        if (elSolarNombre) {
            elSolarNombre.innerHTML = `
                <div class="cjs-transicion-solar-wrap" aria-live="polite">
                    <span class="cjs-transicion-solar-label">Siguiente pregunta</span>
                    <span class="cjs-transicion-solar-num" id="cjsTransicionDigito">${segundos}</span>
                </div>
            `;
        }

        // MEJORA 3: Pitido inicial para 3
        reproducirSonidoSeguro("cuenta_atras", 3);

        intervaloCuentaAtrasTransicion = setInterval(() => {
            segundos--;
            if (segundos > 0) {
                const elDigito = document.getElementById("cjsTransicionDigito");
                if (elDigito) elDigito.textContent = String(segundos);
                // MEJORA 3: Pitido para 2 o pitido extendido tipo salida de carrera para 1
                reproducirSonidoSeguro("cuenta_atras", segundos);
            } else {
                clearInterval(intervaloCuentaAtrasTransicion);
                intervaloCuentaAtrasTransicion = null;
                avanzarSiguientePregunta();
            }
        }, 1000);
    }

    function avanzarSiguientePregunta() {
        limpiarTodosLosTemporizadores();
        window.SonidoGlobal?.detenerSonidosMinijuego?.();

        // 1. Caso Muerte Súbita (Desempate)
        if (EstadoJuego.enDesempate) {
            if (EstadoJuego.ganadorDesempate !== null) {
                // Alguien acertó: victoria inmediata
                finalizarPartida();
                return;
            }

            // Fallo o tiempo agotado: turno alternante con pregunta nueva
            EstadoJuego.turnoJugador = EstadoJuego.turnoJugador === 1 ? 2 : 1;
            EstadoJuego.preguntasDesempateJugadas++;

            const nuevaPreg = generarPreguntaDesempate();
            if (!nuevaPreg) {
                // Salida controlada si se agotaran todos los solares
                alert("Se han agotado los solares únicos disponibles en la base de datos para continuar el desempate. La partida concluirá con la puntuación actual.");
                finalizarPartida();
                return;
            }

            EstadoJuego.preguntas.push(nuevaPreg);
            EstadoJuego.preguntaActualIdx = EstadoJuego.preguntas.length - 1;
            cargarPreguntaActual();
            return;
        }

        // 2. Caso Modalidad Hasta Fallar
        if (EstadoJuego.duracionModo === "hasta-fallar") {
            if (EstadoJuego.modo === "individual") {
                if (EstadoJuego.jugador1.turnoTerminado) {
                    finalizarPartida();
                    return;
                }
                const nuevaPreg = generarPreguntaUnica(EstadoJuego.solaresUsadosIds);
                if (!nuevaPreg) {
                    alert("¡Enhorabuena! Has completado todos los solares disponibles en la base de datos sin fallar.");
                    finalizarPartida();
                    return;
                }
                EstadoJuego.preguntas.push(nuevaPreg);
                EstadoJuego.preguntaActualIdx = EstadoJuego.preguntas.length - 1;
                cargarPreguntaActual();
                return;
            } else {
                if (EstadoJuego.jugador1.turnoTerminado && EstadoJuego.jugador2.turnoTerminado) {
                    // Ambos han terminado su turno al fallar
                    if (EstadoJuego.jugador1.puntos === EstadoJuego.jugador2.puntos && !EstadoJuego.desempateRechazado) {
                        mostrarDialogoDesempate();
                    } else {
                        finalizarPartida();
                    }
                    return;
                }
                const nuevaPreg = generarPreguntaUnica(EstadoJuego.solaresUsadosIds);
                if (!nuevaPreg) {
                    alert("Se han agotado los solares disponibles en la base de datos.");
                    finalizarPartida();
                    return;
                }
                EstadoJuego.preguntas.push(nuevaPreg);
                EstadoJuego.preguntaActualIdx = EstadoJuego.preguntas.length - 1;
                cargarPreguntaActual();
                return;
            }
        }

        // 3. Caso Rondas Normales (5 o 10)
        const totalPorJugador = EstadoJuego.numRondas;
        const totalPreguntas = EstadoJuego.modo === "individual"
            ? totalPorJugador
            : totalPorJugador * 2;

        EstadoJuego.preguntaActualIdx++;

        const finIndividual = EstadoJuego.modo === "individual" && EstadoJuego.preguntaActualIdx >= totalPorJugador;
        const finCompetitivo = EstadoJuego.modo === "dos-jugadores" && (
            (EstadoJuego.jugador1.respuestasDadas >= totalPorJugador && EstadoJuego.jugador2.respuestasDadas >= totalPorJugador) ||
            EstadoJuego.preguntaActualIdx >= totalPreguntas
        );

        if (finIndividual) {
            finalizarPartida();
        } else if (finCompetitivo) {
            // Comprobar si hay empate en modo dos jugadores (Requisito 9.1)
            if (EstadoJuego.jugador1.puntos === EstadoJuego.jugador2.puntos && !EstadoJuego.desempateRechazado) {
                mostrarDialogoDesempate();
            } else {
                finalizarPartida();
            }
        } else {
            cargarPreguntaActual();
        }
    }

    // ─── DESEMPATE Y TIRADA DE DADO (Requisito 9) ──────────────

    function mostrarDialogoDesempate() {
        const modal = document.getElementById("cjsModalDesempate");
        const fasePropuesta = document.getElementById("cjsDesempateFasePropuesta");
        const faseDado = document.getElementById("cjsDesempateFaseDado");
        const txtPuntos = document.getElementById("cjsDesempateMensajePuntos");

        if (!modal) return;

        if (txtPuntos) {
            txtPuntos.textContent = `Ambos jugadores habéis empatado con ${formatearPuntos(EstadoJuego.jugador1.puntos)}. ¿Queréis jugar una ronda de desempate por muerte súbita?`;
        }

        if (fasePropuesta) fasePropuesta.style.display = "block";
        if (faseDado) faseDado.style.display = "none";

        modal.style.display = "flex";
        reproducirSonidoSeguro("apertura");
    }

    function iniciarFaseDado() {
        const fasePropuesta = document.getElementById("cjsDesempateFasePropuesta");
        const faseDado = document.getElementById("cjsDesempateFaseDado");
        const badgeJ1 = document.getElementById("cjsDesempateBadgeJ1");
        const badgeJ2 = document.getElementById("cjsDesempateBadgeJ2");
        const btnLanzar = document.getElementById("cjsBtnLanzarDado");
        const btnComenzar = document.getElementById("cjsBtnComenzarMuerteSubita");
        const dadoCaja = document.getElementById("cjsDadoCaja");
        const txtResultado = document.getElementById("cjsDadoResultadoTexto");

        if (intervaloDadoDesempate) {
            clearInterval(intervaloDadoDesempate);
            intervaloDadoDesempate = null;
        }

        if (fasePropuesta) fasePropuesta.style.display = "none";
        if (faseDado) faseDado.style.display = "block";

        if (badgeJ1) {
            badgeJ1.textContent = EstadoJuego.jugador1.nombre;
            badgeJ1.style.backgroundColor = EstadoJuego.jugador1.color;
        }
        if (badgeJ2) {
            badgeJ2.textContent = EstadoJuego.jugador2.nombre;
            badgeJ2.style.backgroundColor = EstadoJuego.jugador2.color;
        }

        // Selección Par / Impar por defecto: J1 Par, J2 Impar
        actualizarSeleccionParImpar("par");

        if (dadoCaja) {
            dadoCaja.className = "dadoCara";
            dadoCaja.textContent = CARAS_DADO_UNICODE[1];
        }
        if (txtResultado) txtResultado.textContent = "Pulsa el botón para lanzar el dado";
        if (btnLanzar) {
            btnLanzar.disabled = false;
            btnLanzar.style.display = "inline-flex";
        }
        if (btnComenzar) btnComenzar.style.display = "none";

        reproducirSonidoSeguro("click");
    }

    function actualizarSeleccionParImpar(eleccionJ1) {
        EstadoJuego.eleccionParImparJ1 = eleccionJ1;
        const btnPar = document.getElementById("cjsBtnJ1Par");
        const btnImpar = document.getElementById("cjsBtnJ1Impar");
        const infoJ2 = document.getElementById("cjsDesempateInfoJ2");

        if (btnPar) btnPar.classList.toggle("activo", eleccionJ1 === "par");
        if (btnImpar) btnImpar.classList.toggle("activo", eleccionJ1 === "impar");
        if (infoJ2) {
            infoJ2.textContent = eleccionJ1 === "par" ? "IMPAR (1, 3, 5)" : "PAR (2, 4, 6)";
        }
    }

    function lanzarDado() {
        const dadoCaja = document.getElementById("cjsDadoCaja");
        const btnLanzar = document.getElementById("cjsBtnLanzarDado");
        const btnComenzar = document.getElementById("cjsBtnComenzarMuerteSubita");
        const txtResultado = document.getElementById("cjsDadoResultadoTexto");

        if (btnLanzar) btnLanzar.disabled = true;
        if (dadoCaja) {
            dadoCaja.className = "dadoCara rodando";
        }
        reproducirSonidoSeguro("click");

        const resultado = Math.floor(Math.random() * 6) + 1;
        let contador = 0;

        if (intervaloDadoDesempate) {
            clearInterval(intervaloDadoDesempate);
            intervaloDadoDesempate = null;
        }

        // Animación rápida idéntica al Tirador de dados de LOT-LAB
        intervaloDadoDesempate = setInterval(() => {
            if (dadoCaja) {
                dadoCaja.textContent = CARAS_DADO_UNICODE[Math.floor(Math.random() * 6) + 1];
            }
            contador++;
            if (contador >= 8) {
                clearInterval(intervaloDadoDesempate);
                intervaloDadoDesempate = null;

                if (dadoCaja) {
                    dadoCaja.textContent = CARAS_DADO_UNICODE[resultado];
                    dadoCaja.className = "dadoCara";
                }
                if (btnLanzar) btnLanzar.disabled = false;

                const esPar = (resultado % 2 === 0);
                const j1EligioPar = EstadoJuego.eleccionParImparJ1 === "par";
                const j1GanaSalida = (esPar && j1EligioPar) || (!esPar && !j1EligioPar);
                const jugadorInicial = j1GanaSalida ? EstadoJuego.jugador1 : EstadoJuego.jugador2;
                const jugadorInicialNum = j1GanaSalida ? 1 : 2;

                EstadoJuego.turnoJugador = jugadorInicialNum;

                if (txtResultado) {
                    txtResultado.innerHTML = `Resultado: <strong>${resultado}</strong> (${esPar ? 'PAR' : 'IMPAR'}) — Empieza <strong>${escapeHtml(jugadorInicial.nombre)}</strong>`;
                }

                if (btnLanzar) btnLanzar.style.display = "none";
                if (btnComenzar) btnComenzar.style.display = "inline-flex";
                reproducirSonidoSeguro("exito");
            }
        }, 60);
    }

    function comenzarMuerteSubita() {
        if (intervaloDadoDesempate) {
            clearInterval(intervaloDadoDesempate);
            intervaloDadoDesempate = null;
        }

        const modal = document.getElementById("cjsModalDesempate");
        if (modal) modal.style.display = "none";

        EstadoJuego.enDesempate = true;
        EstadoJuego.preguntasDesempateJugadas = 1;
        EstadoJuego.ganadorDesempate = null;

        const primeraPreguntaDesempate = generarPreguntaDesempate();
        if (!primeraPreguntaDesempate) {
            alert("No hay más solares para el desempate. La partida concluirá en empate.");
            finalizarPartida();
            return;
        }

        EstadoJuego.preguntas.push(primeraPreguntaDesempate);
        EstadoJuego.preguntaActualIdx = EstadoJuego.preguntas.length - 1;

        mostrarPantalla("juego");
        cargarPreguntaActual();
    }

    function rechazarDesempate() {
        if (intervaloDadoDesempate) {
            clearInterval(intervaloDadoDesempate);
            intervaloDadoDesempate = null;
        }
        const modal = document.getElementById("cjsModalDesempate");
        if (modal) modal.style.display = "none";

        EstadoJuego.desempateRechazado = true;
        reproducirSonidoSeguro("click");
        finalizarPartida();
    }

    // ─── CANCELACIÓN DE PARTIDA EN CURSO ────────────────────

    function abrirDialogoCancelarPartida() {
        const modal = document.getElementById("cjsModalConfirmarCancelar");
        if (modal) {
            modal.style.display = "flex";
            reproducirSonidoSeguro("click");
        }
    }

    function cerrarDialogoCancelarPartida() {
        const modal = document.getElementById("cjsModalConfirmarCancelar");
        if (modal) {
            modal.style.display = "none";
            reproducirSonidoSeguro("volver");
        }
    }

    function confirmarCancelarPartida() {
        cerrarDialogoCancelarPartida();
        limpiarTodosLosTemporizadores();
        window.SonidoGlobal?.detenerSonidosMinijuego?.();
        limpiarPartidaPersistida();

        EstadoJuego.preguntas = [];
        EstadoJuego.preguntaActualIdx = 0;
        EstadoJuego.turnoJugador = 1;
        EstadoJuego.jugador1.puntos = 0;
        EstadoJuego.jugador1.aciertos = 0;
        EstadoJuego.jugador1.respuestasDadas = 0;
        EstadoJuego.jugador1.turnoTerminado = false;
        EstadoJuego.jugador2.puntos = 0;
        EstadoJuego.jugador2.aciertos = 0;
        EstadoJuego.jugador2.respuestasDadas = 0;
        EstadoJuego.jugador2.turnoTerminado = false;
        EstadoJuego.solaresUsadosIds = new Set();
        EstadoJuego.pistasUsadas = 0;
        EstadoJuego.pistasReveladas = { tipo: false, origen: false, foto: false, descarte: false };
        EstadoJuego.opcionesDescartadas = [];
        EstadoJuego.respondida = false;
        EstadoJuego.partidaFinalizada = false;
        EstadoJuego.enDesempate = false;
        EstadoJuego.preguntasDesempateJugadas = 0;
        EstadoJuego.ganadorDesempate = null;
        EstadoJuego.desempateRechazado = false;

        mostrarPantalla("config");
        reproducirSonidoSeguro("volver");
    }

    // ─── PANTALLA FINAL Y RESULTADOS (Requisitos 9.4, 10.2, 10.3) ──

    function calcularEstrellasHastaFallar(aciertos) {
        if (aciertos <= 0) return 0;
        if (aciertos <= 2) return 1.5;
        if (aciertos <= 4) return 2.5;
        if (aciertos <= 7) return 3.5;
        if (aciertos <= 10) return 4.5;
        return 5.0;
    }

    function obtenerMensajeHastaFallar(aciertos) {
        if (aciertos >= 12) return "¡Racha legendaria! Conoces los solares y mundos de Los Sims 4 a la perfección.";
        if (aciertos >= 7) return "¡Gran racha! Tu conocimiento del mapa y las opciones ha sido formidable.";
        if (aciertos >= 4) return "¡Buen intento! Has logrado una racha muy respetable antes de fallar.";
        if (aciertos >= 1) return "¡Bien luchado! Cada solar cuenta. ¡A por una racha más larga en la próxima!";
        return "¡Tropiezo en el primer solar! La memoria se entrena jugando: ¡inténtalo de nuevo!";
    }

    function finalizarPartida(esRestauracion = false) {
        limpiarTodosLosTemporizadores();
        window.SonidoGlobal?.detenerSonidosMinijuego?.();
        mostrarPantalla("final");

        if (!esRestauracion) {
            reproducirSonidoSeguro("apertura");
        }

        EstadoJuego.partidaFinalizada = true;
        guardarPartidaPersistida();

        const contFinal = document.getElementById("cjsTarjetaResumenFinal");
        if (!contFinal) return;

        contFinal.classList.remove("animacion-entrada-pantalla-final");
        void contFinal.offsetWidth;
        contFinal.classList.add("animacion-entrada-pantalla-final");

        const esHastaFallar = (EstadoJuego.duracionModo === "hasta-fallar");
        const maxPorJugador = esHastaFallar ? 0 : EstadoJuego.numRondas * 500;

        if (EstadoJuego.modo === "individual") {
            const j = EstadoJuego.jugador1;
            const estrellas = esHastaFallar ? calcularEstrellasHastaFallar(j.aciertos) : calcularEstrellas(j.puntos, maxPorJugador);
            const porcentaje = esHastaFallar ? 100 : Math.round((j.puntos / maxPorJugador) * 100);
            const mensaje = esHastaFallar ? obtenerMensajeHastaFallar(j.aciertos) : obtenerMensajeFinal(j.puntos, maxPorJugador);

            const textoPuntosSub = esHastaFallar
                ? `${j.aciertos} ${j.aciertos === 1 ? 'solar acertado' : 'solares acertados'} consecutivos`
                : `de ${formatearPuntos(maxPorJugador)} posibles (${porcentaje}%)`;

            const textoDetalle = esHastaFallar
                ? `Racha final: <strong>${j.aciertos}</strong> ${j.aciertos === 1 ? 'acierto consecutivo' : 'aciertos consecutivos'} antes de fallar.`
                : `Has acertado <strong>${j.aciertos}</strong> de <strong>${EstadoJuego.numRondas}</strong> solares.`;

            contFinal.innerHTML = `
                <div class="cjs-final-titulo-icono">🏆</div>
                <div class="cjs-final-cabecera">
                    <h3>¡Partida completada!</h3>
                    ${esHastaFallar ? '<p class="cjs-duelo-subtitulo">Modalidad «Hasta fallar»</p>' : ''}
                    <div class="cjs-jugador-resumen-badge" style="background-color: ${j.color}; margin: 8px auto 0 auto; display: inline-flex;">
                        👤 ${escapeHtml(j.nombre)}
                    </div>
                </div>

                <div class="cjs-puntos-cero-destacados">
                    <span class="cjs-puntos-cero-valor" style="color: ${j.color};">${formatearPuntos(j.puntos)}</span>
                    <span class="cjs-puntos-cero-maximo">${textoPuntosSub}</span>
                </div>

                ${renderizarEstrellasHTML(estrellas)}

                <p class="cjs-mensaje-final-bracket">${escapeHtml(mensaje)}</p>

                <div style="font-size: 0.95rem; opacity: 0.88;">
                    ${textoDetalle}
                </div>
            `;
        } else {
            const j1 = EstadoJuego.jugador1;
            const j2 = EstadoJuego.jugador2;
            const estrellasJ1 = esHastaFallar ? calcularEstrellasHastaFallar(j1.aciertos) : calcularEstrellas(j1.puntos, maxPorJugador);
            const estrellasJ2 = esHastaFallar ? calcularEstrellasHastaFallar(j2.aciertos) : calcularEstrellas(j2.puntos, maxPorJugador);

            let subtituloDuelo = "";
            if (esHastaFallar) {
                subtituloDuelo = `Modalidad «Hasta fallar» • Cada jugador responde hasta su primer error`;
            } else if (EstadoJuego.enDesempate) {
                const totalNormales = EstadoJuego.numRondas * 2;
                subtituloDuelo = `Modo dos jugadores • ${totalNormales} preguntas en rondas normales + ${EstadoJuego.preguntasDesempateJugadas} en desempate por muerte súbita`;
            } else {
                const totalNormales = EstadoJuego.numRondas * 2;
                subtituloDuelo = `Modo dos jugadores • ${totalNormales} preguntas en total (${EstadoJuego.numRondas} respuestas por jugador)`;
            }

            let ganadorHTML = "";
            let esGanador1 = false;
            let esGanador2 = false;

            if (EstadoJuego.enDesempate && EstadoJuego.ganadorDesempate) {
                const ganador = EstadoJuego.ganadorDesempate === 1 ? j1 : j2;
                if (EstadoJuego.ganadorDesempate === 1) esGanador1 = true;
                else esGanador2 = true;
                ganadorHTML = `
                    <div class="cjs-ganador-banner-destacado" style="border-color: ${ganador.color};">
                        <span>⚔️</span> ¡Victoria por muerte súbita para <strong>${escapeHtml(ganador.nombre)}</strong>!
                    </div>
                `;
            } else if (j1.puntos > j2.puntos) {
                esGanador1 = true;
                ganadorHTML = `
                    <div class="cjs-ganador-banner-destacado" style="border-color: ${j1.color};">
                        <span>🏆</span> ¡Victoria para <strong>${escapeHtml(j1.nombre)}</strong>!
                    </div>
                `;
            } else if (j2.puntos > j1.puntos) {
                esGanador2 = true;
                ganadorHTML = `
                    <div class="cjs-ganador-banner-destacado" style="border-color: ${j2.color};">
                        <span>🏆</span> ¡Victoria para <strong>${escapeHtml(j2.nombre)}</strong>!
                    </div>
                `;
            } else {
                ganadorHTML = `
                    <div class="cjs-ganador-banner-destacado">
                        <span>🤝</span> ¡Empate final acordado! Ambos jugadores habéis igualado en puntuación.
                    </div>
                `;
            }

            const subPuntos1 = esHastaFallar ? `${j1.aciertos} aciertos` : `de ${formatearPuntos(maxPorJugador)} posibles`;
            const subPuntos2 = esHastaFallar ? `${j2.aciertos} aciertos` : `de ${formatearPuntos(maxPorJugador)} posibles`;

            contFinal.innerHTML = `
                <div class="cjs-final-titulo-icono">⚔️</div>
                <div class="cjs-final-cabecera">
                    <h3>Fin del duelo</h3>
                    <p class="cjs-duelo-subtitulo">${subtituloDuelo}</p>
                </div>

                ${ganadorHTML}

                <div class="cjs-comparativa-dos-jugadores">
                    <div class="cjs-jugador-resumen-card ${esGanador1 ? 'es-ganador' : ''}">
                        <div class="cjs-jugador-resumen-badge" style="background-color: ${j1.color};">
                            👤 ${escapeHtml(j1.nombre)}
                        </div>
                        <div class="cjs-jugador-resumen-puntos" style="color: ${j1.color};">
                            ${formatearPuntos(j1.puntos)}
                        </div>
                        <div style="font-size: 0.88rem; opacity: 0.85;">
                            ${subPuntos1}
                        </div>
                        <div style="margin-top: 4px;">
                            ${renderizarEstrellasHTML(estrellasJ1)}
                        </div>
                        <div style="font-size: 0.92rem; font-weight: 600; margin-top: 4px;">
                            ${j1.aciertos} aciertos en ${j1.respuestasDadas} respuestas
                        </div>
                    </div>

                    <div class="cjs-jugador-resumen-card ${esGanador2 ? 'es-ganador' : ''}">
                        <div class="cjs-jugador-resumen-badge" style="background-color: ${j2.color};">
                            👤 ${escapeHtml(j2.nombre)}
                        </div>
                        <div class="cjs-jugador-resumen-puntos" style="color: ${j2.color};">
                            ${formatearPuntos(j2.puntos)}
                        </div>
                        <div style="font-size: 0.88rem; opacity: 0.85;">
                            ${subPuntos2}
                        </div>
                        <div style="margin-top: 4px;">
                            ${renderizarEstrellasHTML(estrellasJ2)}
                        </div>
                        <div style="font-size: 0.92rem; font-weight: 600; margin-top: 4px;">
                            ${j2.aciertos} aciertos en ${j2.respuestasDadas} respuestas
                        </div>
                    </div>
                </div>

                <p style="margin: 6px 0 0 0; font-size: 0.95rem; opacity: 0.88;">
                    Puntuación total acumulada: <strong>${formatearPuntos(j1.puntos + j2.puntos)}</strong>
                </p>
            `;
        }
    }

    // ─── MODAL COMPARTIR RESULTADO (Requisito 14) ────────────

    function generarTextoCompartir() {
        const esHastaFallar = (EstadoJuego.duracionModo === "hasta-fallar");
        const maxPorJugador = esHastaFallar ? 0 : EstadoJuego.numRondas * 500;

        if (EstadoJuego.modo === "individual") {
            const j = EstadoJuego.jugador1;
            if (esHastaFallar) {
                const estrellas = calcularEstrellasHastaFallar(j.aciertos);
                const estrellasSimbolo = "★".repeat(Math.floor(estrellas));
                return `He conseguido ${formatearPuntos(j.puntos)} con una racha de ${j.aciertos} aciertos (${estrellasSimbolo} ${estrellas}/5) en el modo «Hasta fallar» de «¿Conoces los solares?» en LOT-LAB. ¿Puedes superarme?`;
            } else {
                const estrellas = calcularEstrellas(j.puntos, maxPorJugador);
                const estrellasSimbolo = "★".repeat(Math.floor(estrellas));
                return `He conseguido ${formatearPuntos(j.puntos)} de ${formatearPuntos(maxPorJugador)} (${estrellasSimbolo} ${estrellas}/5) en «¿Conoces los solares?» de LOT-LAB. ¿Puedes superarme?`;
            }
        } else {
            const j1 = EstadoJuego.jugador1;
            const j2 = EstadoJuego.jugador2;
            let resultadoDuelo = "";
            if (EstadoJuego.enDesempate && EstadoJuego.ganadorDesempate) {
                const g = EstadoJuego.ganadorDesempate === 1 ? j1.nombre : j2.nombre;
                resultadoDuelo = `¡Ha ganado ${g} por muerte súbita!`;
            } else if (j1.puntos > j2.puntos) {
                resultadoDuelo = `¡Ha ganado ${j1.nombre}!`;
            } else if (j2.puntos > j1.puntos) {
                resultadoDuelo = `¡Ha ganado ${j2.nombre}!`;
            } else {
                resultadoDuelo = `¡Empate!`;
            }
            const sufijoModo = esHastaFallar ? " (Hasta fallar)" : "";
            return `«¿Conoces los solares?»${sufijoModo} en LOT-LAB: ${j1.nombre} (${formatearPuntosCorto(j1.puntos)}) vs ${j2.nombre} (${formatearPuntosCorto(j2.puntos)}). ${resultadoDuelo} ¿Puedes superarnos?`;
        }
    }

    function autoAjustarTextareaCompartir(textarea) {
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }

    function actualizarContadorCompartir() {
        const textarea = document.getElementById("cjsTextoCompartir");
        const contador = document.getElementById("cjsCharCount");
        if (!textarea || !contador) return;

        const longitud = textarea.value.length;
        contador.textContent = `${longitud} / ${LIMITE_CARACTERES_COMPARTIR}`;
        if (longitud >= LIMITE_CARACTERES_COMPARTIR) {
            contador.style.color = "#ef4444";
        } else {
            contador.style.color = "";
        }
    }

    function abrirModalCompartir() {
        const modal = document.getElementById("cjsModalCompartir");
        const textarea = document.getElementById("cjsTextoCompartir");
        if (!modal || !textarea) return;

        textarea.maxLength = LIMITE_CARACTERES_COMPARTIR;
        let texto = generarTextoCompartir();
        if (texto.length > LIMITE_CARACTERES_COMPARTIR) {
            texto = texto.slice(0, LIMITE_CARACTERES_COMPARTIR);
        }
        textarea.value = texto;

        modal.style.display = "flex";
        autoAjustarTextareaCompartir(textarea);
        actualizarContadorCompartir();
        reproducirSonidoSeguro("apertura");
    }

    function cerrarModalCompartir() {
        const modal = document.getElementById("cjsModalCompartir");
        if (modal) {
            modal.style.display = "none";
            reproducirSonidoSeguro("volver");
        }
    }

    function compartirEnX() {
        const textarea = document.getElementById("cjsTextoCompartir");
        const texto = textarea?.value?.trim() || generarTextoCompartir();
        const url = window.location.origin + window.location.pathname + "#conoces-los-solares";
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank", "noopener,noreferrer");
    }

    function compartirEnBluesky() {
        const textarea = document.getElementById("cjsTextoCompartir");
        const texto = textarea?.value?.trim() || generarTextoCompartir();
        const url = window.location.origin + window.location.pathname + "#conoces-los-solares";
        const postText = `${texto} ${url}`;
        const shareUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(postText)}`;
        window.open(shareUrl, "_blank", "noopener,noreferrer");
    }

    function compartirEnFacebook() {
        const url = window.location.origin + window.location.pathname + "#conoces-los-solares";
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank", "noopener,noreferrer");
    }

    async function copiarEnlaceJuego(btn) {
        const url = window.location.origin + window.location.pathname + "#conoces-los-solares";
        try {
            await navigator.clipboard.writeText(url);
            const origHTML = btn.innerHTML;
            btn.innerHTML = `<span>✓</span> ¡Enlace copiado!`;
            setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
            reproducirSonidoSeguro("click");
        } catch (e) {
            prompt("Copia este enlace:", url);
        }
    }

    function ejecutarCapturaVentanaResultado() {
        cerrarModalCompartir();
        setTimeout(() => {
            const ventana = document.getElementById("ventanaConocesSolares");
            if (ventana && typeof window.capturarElemento === "function") {
                window.capturarElemento(ventana, "LOT-LAB_Resultado_Conoces_Los_Solares");
            } else if (ventana) {
                const btnCaptura = ventana.querySelector(".cabeceraVentana .captura");
                if (btnCaptura) btnCaptura.click();
            }
        }, 120);
    }

    // ─── CONTROL DE VISTAS INTERNAS ─────────────────────────

    function mostrarPantalla(pantalla) {
        const pConfig = document.getElementById("cjsPanelConfig");
        const pJuego = document.getElementById("cjsPanelJuego");
        const pFinal = document.getElementById("cjsPanelFinal");

        if (pConfig) pConfig.style.display = pantalla === "config" ? "flex" : "none";
        if (pJuego) pJuego.style.display = pantalla === "juego" ? "flex" : "none";
        if (pFinal) pFinal.style.display = pantalla === "final" ? "flex" : "none";
    }

    // ─── CONFIGURACIÓN DE EVENTOS DEL DOM ───────────────────

    function configurarEventosDOM() {
        // Toggle Modo: Modo individual vs Modo dos jugadores (Requisito 9)
        const btnModoIndiv = document.getElementById("cjsBtnModoIndiv");
        const btnModo2J = document.getElementById("cjsBtnModo2J");
        const wrapIndiv = document.getElementById("cjsWrapJugadorIndiv");
        const wrap2J = document.getElementById("cjsWrapJugadores2J");

        const persistirConfigSiCorresponde = () => {
            const pJuego = document.getElementById("cjsPanelJuego");
            if (!pJuego || pJuego.style.display === "none" || getComputedStyle(pJuego).display === "none") {
                leerConfiguracionDesdeUI();
                guardarPartidaPersistida();
            }
        };

        document.getElementById("cjsInputNombreIndiv")?.addEventListener("input", persistirConfigSiCorresponde);
        document.getElementById("cjsInputNombreJ1")?.addEventListener("input", persistirConfigSiCorresponde);
        document.getElementById("cjsInputNombreJ2")?.addEventListener("input", persistirConfigSiCorresponde);

        btnModoIndiv?.addEventListener("click", () => {
            EstadoJuego.modo = "individual";
            btnModoIndiv.classList.add("activo");
            btnModo2J?.classList.remove("activo");
            if (wrapIndiv) wrapIndiv.style.display = "block";
            if (wrap2J) wrap2J.style.display = "none";
            validarColoresJugadores();
            persistirConfigSiCorresponde();
            reproducirSonidoSeguro("click");
        });

        btnModo2J?.addEventListener("click", () => {
            EstadoJuego.modo = "dos-jugadores";
            btnModo2J.classList.add("activo");
            btnModoIndiv?.classList.remove("activo");
            if (wrapIndiv) wrapIndiv.style.display = "none";
            if (wrap2J) wrap2J.style.display = "grid";
            validarColoresJugadores();
            persistirConfigSiCorresponde();
            reproducirSonidoSeguro("click");
        });

        // Toggle Duración (Hasta fallar / 5 / 10 rondas)
        const btnRondasHastaFallar = document.getElementById("cjsBtnRondasHastaFallar");
        const btnRondas5 = document.getElementById("cjsBtnRondas5");
        const btnRondas10 = document.getElementById("cjsBtnRondas10");

        function seleccionarDuracion(modo) {
            EstadoJuego.duracionModo = modo;
            if (modo === "hasta-fallar") {
                EstadoJuego.numRondas = 0;
            } else {
                EstadoJuego.numRondas = parseInt(modo, 10);
            }
            btnRondasHastaFallar?.classList.toggle("activo", modo === "hasta-fallar");
            btnRondas5?.classList.toggle("activo", modo === "5");
            btnRondas10?.classList.toggle("activo", modo === "10");
            persistirConfigSiCorresponde();
            reproducirSonidoSeguro("click");
        }

        btnRondasHastaFallar?.addEventListener("click", () => seleccionarDuracion("hasta-fallar"));
        btnRondas5?.addEventListener("click", () => seleccionarDuracion("5"));
        btnRondas10?.addEventListener("click", () => seleccionarDuracion("10"));

        // Selector Temporizador: Sin tiempo, 60s, 30s (Requisito 8)
        const btnTimerOff = document.getElementById("cjsBtnTimerOff");
        const btnTimer60 = document.getElementById("cjsBtnTimer60");
        const btnTimer30 = document.getElementById("cjsBtnTimer30");

        function seleccionarTimer(segundos) {
            EstadoJuego.tiempoLimite = segundos;
            [btnTimerOff, btnTimer60, btnTimer30].forEach(b => {
                if (!b) return;
                const coincide = parseInt(b.dataset.timer, 10) === segundos;
                b.classList.toggle("activo", coincide);
                b.setAttribute("aria-checked", coincide ? "true" : "false");
            });
            persistirConfigSiCorresponde();
            reproducirSonidoSeguro("click");
        }

        btnTimerOff?.addEventListener("click", () => seleccionarTimer(0));
        btnTimer60?.addEventListener("click", () => seleccionarTimer(60));
        btnTimer30?.addEventListener("click", () => seleccionarTimer(30));

        // Generar botones de colores
        generarSelectoresColor("cjsColoresIndiv", 0, EstadoJuego.jugador1.color);
        generarSelectoresColor("cjsColoresJ1", 1, EstadoJuego.jugador1.color);
        generarSelectoresColor("cjsColoresJ2", 2, EstadoJuego.jugador2.color);

        // Botón Iniciar Partida
        document.getElementById("cjsBtnIniciarPartida")?.addEventListener("click", () => {
            iniciarNuevaPartida(false);
        });

        // Botón Cancelar Partida durante el juego
        document.getElementById("cjsBtnAbandonarPartida")?.addEventListener("click", () => {
            abrirDialogoCancelarPartida();
        });

        // Botones del Modal Confirmar Cancelación
        document.getElementById("cjsBtnReanudarPartida")?.addEventListener("click", () => {
            cerrarDialogoCancelarPartida();
        });

        document.getElementById("cjsBtnConfirmarCancelar")?.addEventListener("click", () => {
            confirmarCancelarPartida();
        });

        document.getElementById("cjsModalConfirmarCancelar")?.addEventListener("click", (e) => {
            if (e.target.id === "cjsModalConfirmarCancelar") cerrarDialogoCancelarPartida();
        });

        // Botón Pedir Pista
        document.getElementById("cjsBtnPedirPista")?.addEventListener("click", () => {
            pedirPista();
        });

        // Botones del Modal Desempate (Requisito 9)
        document.getElementById("cjsBtnAceptarDesempate")?.addEventListener("click", () => {
            iniciarFaseDado();
        });

        document.getElementById("cjsBtnRechazarDesempate")?.addEventListener("click", () => {
            rechazarDesempate();
        });

        document.getElementById("cjsBtnJ1Par")?.addEventListener("click", () => {
            actualizarSeleccionParImpar("par");
            reproducirSonidoSeguro("click");
        });

        document.getElementById("cjsBtnJ1Impar")?.addEventListener("click", () => {
            actualizarSeleccionParImpar("impar");
            reproducirSonidoSeguro("click");
        });

        document.getElementById("cjsBtnLanzarDado")?.addEventListener("click", () => {
            lanzarDado();
        });

        document.getElementById("cjsBtnComenzarMuerteSubita")?.addEventListener("click", () => {
            comenzarMuerteSubita();
        });

        // Botones Pantalla Final
        document.getElementById("cjsBtnJugarOtraVez")?.addEventListener("click", () => {
            iniciarNuevaPartida(true);
        });

        document.getElementById("cjsBtnCambiarConfig")?.addEventListener("click", () => {
            limpiarTodosLosTemporizadores();
            limpiarPartidaPersistida();
            EstadoJuego.preguntas = [];
            EstadoJuego.preguntaActualIdx = 0;
            EstadoJuego.partidaFinalizada = false;
            mostrarPantalla("config");
            reproducirSonidoSeguro("volver");
        });

        document.getElementById("cjsBtnCompartirFinal")?.addEventListener("click", () => {
            abrirModalCompartir();
        });

        // Botones y Textarea del Modal Compartir
        const textareaCompartir = document.getElementById("cjsTextoCompartir");
        if (textareaCompartir) {
            textareaCompartir.addEventListener("input", () => {
                if (textareaCompartir.value.length > LIMITE_CARACTERES_COMPARTIR) {
                    textareaCompartir.value = textareaCompartir.value.slice(0, LIMITE_CARACTERES_COMPARTIR);
                }
                actualizarContadorCompartir();
                autoAjustarTextareaCompartir(textareaCompartir);
            });
        }

        document.getElementById("cjsModalBtnCerrar")?.addEventListener("click", cerrarModalCompartir);
        document.getElementById("cjsModalCompartir")?.addEventListener("click", (e) => {
            if (e.target.id === "cjsModalCompartir") cerrarModalCompartir();
        });

        document.getElementById("cjsBtnCompartirX")?.addEventListener("click", compartirEnX);
        document.getElementById("cjsBtnCompartirBsky")?.addEventListener("click", compartirEnBluesky);
        document.getElementById("cjsBtnCompartirFb")?.addEventListener("click", compartirEnFacebook);
        document.getElementById("cjsBtnCopiarEnlace")?.addEventListener("click", function () {
            copiarEnlaceJuego(this);
        });
    }

    function generarSelectoresColor(contenedorId, jugadorNum, colorInicial) {
        const cont = document.getElementById(contenedorId);
        if (!cont) return;

        cont.innerHTML = "";
        PALETA_COLORES.forEach(item => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `cjs-color-opcion ${item.hex === colorInicial ? 'seleccionado' : ''}`;
            btn.style.backgroundColor = item.hex;
            btn.dataset.hex = item.hex;
            btn.dataset.nombre = item.nombre;
            btn.title = item.nombre;
            btn.setAttribute("aria-label", `Color ${item.nombre}`);

            btn.addEventListener("click", () => {
                cont.querySelectorAll(".cjs-color-opcion").forEach(b => b.classList.remove("seleccionado"));
                btn.classList.add("seleccionado");

                if (jugadorNum === 0) {
                    EstadoJuego.jugador1.color = item.hex;
                    EstadoJuego.jugador1.colorNombre = item.nombre;
                    const badge = document.getElementById("cjsBadgeIndiv");
                    if (badge) {
                        badge.style.backgroundColor = item.hex;
                        badge.textContent = item.nombre;
                    }
                    const contJ1 = document.getElementById("cjsColoresJ1");
                    if (contJ1) {
                        contJ1.querySelectorAll(".cjs-color-opcion").forEach(b => {
                            b.classList.toggle("seleccionado", b.dataset.hex === item.hex);
                        });
                        const badgeJ1 = document.getElementById("cjsBadgeJ1");
                        if (badgeJ1) {
                            badgeJ1.style.backgroundColor = item.hex;
                            badgeJ1.textContent = item.nombre;
                        }
                    }
                } else if (jugadorNum === 1) {
                    EstadoJuego.jugador1.color = item.hex;
                    EstadoJuego.jugador1.colorNombre = item.nombre;
                    const badge = document.getElementById("cjsBadgeJ1");
                    if (badge) {
                        badge.style.backgroundColor = item.hex;
                        badge.textContent = item.nombre;
                    }
                    const badgeIndiv = document.getElementById("cjsBadgeIndiv");
                    if (badgeIndiv) {
                        badgeIndiv.style.backgroundColor = item.hex;
                        badgeIndiv.textContent = item.nombre;
                    }
                    const contIndiv = document.getElementById("cjsColoresIndiv");
                    if (contIndiv) {
                        contIndiv.querySelectorAll(".cjs-color-opcion").forEach(b => {
                            b.classList.toggle("seleccionado", b.dataset.hex === item.hex);
                        });
                    }
                } else {
                    EstadoJuego.jugador2.color = item.hex;
                    EstadoJuego.jugador2.colorNombre = item.nombre;
                    const badge = document.getElementById("cjsBadgeJ2");
                    if (badge) {
                        badge.style.backgroundColor = item.hex;
                        badge.textContent = item.nombre;
                    }
                }

                validarColoresJugadores();
                if ((!EstadoJuego.preguntas || EstadoJuego.preguntas.length === 0) && !EstadoJuego.partidaFinalizada) {
                    guardarPartidaPersistida();
                }
                reproducirSonidoSeguro("click");
            });

            cont.appendChild(btn);
        });
    }

    function validarColoresJugadores() {
        const alerta = document.getElementById("cjsAlertaColores");
        const btnIniciar = document.getElementById("cjsBtnIniciarPartida");

        if (EstadoJuego.modo === "dos-jugadores" && EstadoJuego.jugador1.color === EstadoJuego.jugador2.color) {
            if (alerta) {
                alerta.style.display = "flex";
                alerta.innerHTML = `⚠️ Los dos jugadores no pueden tener el mismo color. Selecciona un color diferente para el Jugador 2 para comenzar.`;
            }
            if (btnIniciar) btnIniciar.disabled = true;
        } else {
            if (alerta) alerta.style.display = "none";
            if (btnIniciar) btnIniciar.disabled = false;
        }
    }

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // ─── INTEGRACIÓN SEGURA CON NAVEGACIÓN Y CORE ────────────

    function registrarEnNavegacion() {
        if (!Array.isArray(window.REGISTRO_NAVEGACION)) return;

        const catJuegos = window.REGISTRO_NAVEGACION.find(c => c.id === "juegos");
        if (catJuegos && Array.isArray(catJuegos.herramientas)) {
            const yaRegistrada = catJuegos.herramientas.some(h => h.id === "conoces-los-solares");
            if (!yaRegistrada) {
                catJuegos.herramientas.unshift({
                    id: "conoces-los-solares",
                    nombre: "¿Conoces los solares?",
                    icono: "🏘️",
                    disponible: true,
                    descripcion: "Minijuego ¿Conoces los solares?",
                    ruta: "juegos/conoces-los-solares"
                });

                if (typeof window.renderizarNavegacionClasica === "function") {
                    window.renderizarNavegacionClasica();
                }
                if (typeof window.renderizarNavegacionExperimental === "function") {
                    window.renderizarNavegacionExperimental();
                }
            }
        }
    }

    function instalarHooksNavegacion() {
        const origEjecutar = window.ejecutarAccionHerramienta;
        window.ejecutarAccionHerramienta = function (idHerramienta) {
            if (idHerramienta === "conoces-los-solares" || idHerramienta === "juegos/conoces-los-solares") {
                abrirMinijuego();
                return;
            }
            if (typeof origEjecutar === "function") {
                return origEjecutar.apply(this, arguments);
            }
        };

        const origCategoria = window.obtenerCategoriaPorVentana;
        window.obtenerCategoriaPorVentana = function (idVentana) {
            if (idVentana === "ventanaConocesSolares") {
                return "juegos";
            }
            if (typeof origCategoria === "function") {
                return origCategoria.apply(this, arguments);
            }
            return "inicio";
        };

        const origProcesarRutaURL = window.procesarRutaURL;
        window.procesarRutaURL = function () {
            const rawHash = window.location.hash || "";
            const slug = rawHash.replace(/^[#/]+/, "").trim().toLowerCase();
            const esRutaMinijuego = (slug === "conoces-los-solares" || slug === "juegos/conoces-los-solares" || slug === "juego-solares");

            if (esRutaMinijuego) {
                abrirMinijuego();
                return;
            }

            if (!slug) {
                const info = recuperarPartidaPersistida();
                if (info && info.minijuegoAbierto) {
                    abrirMinijuego();
                    return;
                }
            }

            if (typeof origProcesarRutaURL === "function") {
                return origProcesarRutaURL.apply(this, arguments);
            }
        };

        function comprobarHashURL() {
            const hash = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (hash === "conoces-los-solares" || hash === "juegos/conoces-los-solares" || hash === "juego-solares") {
                abrirMinijuego();
            }
        }

        window.addEventListener("hashchange", comprobarHashURL);
        setTimeout(comprobarHashURL, 150);
    }

    function abrirMinijuego() {
        minijuegoAbiertoActualmente = true;
        try {
            if (!window.location.hash.includes("conoces-los-solares")) {
                if (history && history.replaceState) {
                    history.replaceState(null, "", "#conoces-los-solares");
                }
            }
        } catch (e) {}

        if (typeof window.abrirVentana === "function") {
            window.abrirVentana("ventanaConocesSolares", true);
        } else {
            document.querySelectorAll(".ventana").forEach(v => v.style.display = "none");
            const v = document.getElementById("ventanaConocesSolares");
            if (v) v.style.display = "block";
        }

        if (typeof window.actualizarCategoriaClasicaActiva === "function") {
            window.actualizarCategoriaClasicaActiva("juegos");
        }

        if (EstadoJuego.partidaFinalizada) {
            mostrarPantalla("final");
        } else if (EstadoJuego.preguntas && EstadoJuego.preguntas.length > 0) {
            mostrarPantalla("juego");
            actualizarMarcadorBarra();
            reanudarTemporizadorPregunta();
        } else {
            mostrarPantalla("config");
            aplicarConfiguracionAUI();
        }

        guardarPartidaPersistida();
    }

    // ─── INICIALIZACIÓN GENERAL ─────────────────────────────

    function init() {
        configurarEventosDOM();
        registrarEnNavegacion();
        instalarHooksNavegacion();
        iniciarCicloIconosAnimados();
        vigilarSeccionJuegos();

        const infoPersistida = recuperarPartidaPersistida();
        const hashActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
        const esRutaMinijuego = (hashActual === "conoces-los-solares" || hashActual === "juegos/conoces-los-solares" || hashActual === "juego-solares");
        const hayOtraRutaExplicita = hashActual.length > 0 && !esRutaMinijuego;

        if (infoPersistida && !hayOtraRutaExplicita && (esRutaMinijuego || infoPersistida.minijuegoAbierto)) {
            abrirMinijuego();
            if (infoPersistida.estado === "finalizada") {
                finalizarPartida(true);
            } else if (infoPersistida.estado === "en_curso") {
                cargarPreguntaActual(true);
            } else {
                mostrarPantalla("config");
                aplicarConfiguracionAUI();
            }
        }

        document.addEventListener("datosCargados", () => {
            registrarEnNavegacion();
            refrescarIconosOpcionesEnDOM();
        });

        // Pausar temporizador, detener sonidos y marcar como cerrado si se cierra la ventana
        const btnCerrarVentana = document.querySelector("#ventanaConocesSolares .cabeceraVentana .cerrar");
        btnCerrarVentana?.addEventListener("click", () => {
            pausarTemporizadorPregunta();
            marcarMinijuegoCerrado();
        });

        const ventanaCS = document.getElementById("ventanaConocesSolares");
        if (ventanaCS) {
            let fueVisible = (ventanaCS.style.display === "block" || ventanaCS.style.display === "flex" || getComputedStyle(ventanaCS).display !== "none");
            const obsCS = new MutationObserver(() => {
                const visible = (ventanaCS.style.display === "block" || ventanaCS.style.display === "flex" || getComputedStyle(ventanaCS).display !== "none");
                if (visible) {
                    fueVisible = true;
                    reanudarTemporizadorPregunta();
                } else if (fueVisible) {
                    pausarTemporizadorPregunta();
                    marcarMinijuegoCerrado();
                }
            });
            obsCS.observe(ventanaCS, { attributes: true, attributeFilter: ["style", "class"] });
        }

        window.addEventListener("beforeunload", () => {
            guardarPartidaPersistida();
        });
        window.addEventListener("pagehide", () => {
            guardarPartidaPersistida();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // API pública para pruebas y verificación
    window.MinijuegoSolares = {
        EstadoJuego,
        iniciarNuevaPartida,
        pedirPista,
        responderPregunta,
        avanzarSiguientePregunta,
        iniciarTemporizadorPregunta,
        detenerTemporizadorPregunta,
        pausarTemporizadorPregunta,
        reanudarTemporizadorPregunta,
        obtenerCategoriaOrigenPista2,
        obtenerFotoRealSolarPregunta,
        revelarFotoYTransicionar,
        iniciarCuentaAtrasTransicion,
        reproducirSonidoSeguro,
        tiempoAgotado,
        mostrarDialogoDesempate,
        iniciarFaseDado,
        lanzarDado,
        comenzarMuerteSubita,
        rechazarDesempate,
        calcularEstrellas,
        formatearPuntos,
        formatearPuntosCorto,
        abrirDialogoCancelarPartida,
        confirmarCancelarPartida,
        cerrarDialogoCancelarPartida,
        abrirModalCompartir,
        cerrarModalCompartir,
        abrirMinijuego,
        iniciarCicloIconosAnimados,
        detenerCicloIconosAnimados,
        iniciarCicloIconosJuegos,
        detenerCicloIconosJuegos,
        renderizarEstrellasHTML,
        limpiarTodosLosTemporizadores,
        guardarPartidaPersistida,
        recuperarPartidaPersistida,
        limpiarPartidaPersistida,
        finalizarPartida,
        refrescarIconosOpcionesEnDOM,
        contraerSeccionPistas,
        restablecerSeccionPistas
    };

})();
