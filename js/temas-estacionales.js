/**
 * LOT-LAB Sims 4 â€” Motor de Temas Estacionales y Fondos Multicapa
 * Gestiona modos base, Halloween, Navidad y futuros modos especiales.
 */
(function() {
    'use strict';

    const CONFIG_PREDETERMINADA = {
        modoActivoPredeterminado: "auto",
        modos: [
            {
                id: "base",
                nombre: "Modo Base (ClÃ¡sico)",
                icono: "ðŸŽ®",
                activo: true,
                mostrarControlVisitante: false,
                colorResaltado: "#2ECC71",
                colorResaltadoRgb: "46, 204, 113",
                calendario: { tipo: "siempre" },
                fondoDia: {
                    colorFondo: "#F3EEE3",
                    capas: [
                        {
                            id: "capa_base_dia_1",
                            nombre: "Mosaico clÃ¡sico dÃ­a",
                            visible: true,
                            imagen: "img/fondos/fondo_dia-1.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "top center",
                            tamano: "100% auto",
                            opacidad: 1,
                            orden: 1
                        }
                    ]
                },
                fondoNoche: {
                    colorFondo: "#242868",
                    capas: [
                        {
                            id: "capa_base_noche_1",
                            nombre: "Mosaico clÃ¡sico noche",
                            visible: true,
                            imagen: "img/fondos/fondo_noche-1.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "top center",
                            tamano: "100% auto",
                            opacidad: 1,
                            orden: 1
                        }
                    ]
                },
                efectos: { activo: false, tipo: "ninguno", lista: [] }
            },
            {
                id: "halloween",
                nombre: "Halloween",
                icono: "ðŸ¦‡",
                activo: true,
                mostrarControlVisitante: true,
                colorResaltado: "#981aff",
                colorResaltadoRgb: "152, 26, 255",
                prioridad: 10,
                calendario: {
                    tipo: "fechas",
                    mesInicio: 10,
                    diaInicio: 1,
                    mesFin: 11,
                    diaFin: 1
                },
                fondoDia: {
                    colorFondo: "#ef841f",
                    capas: [
                        {
                            id: "capa_hw_dia_base",
                            nombre: "Fondo ambiente otoÃ±al",
                            visible: true,
                            imagen: "img/fondos/fondo-dia-halloween.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "top center",
                            tamano: "100% auto",
                            opacidad: 0.85,
                            orden: 1
                        }
                    ]
                },
                fondoNoche: {
                    colorFondo: "#150C1E",
                    capas: [
                        {
                            id: "capa_hw_noche_base",
                            nombre: "Noche espeluznante",
                            visible: true,
                            imagen: "img/fondos/fondo-noche-halloween.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "top center",
                            tamano: "100% auto",
                            opacidad: 0.85,
                            orden: 1
                        }
                    ]
                },
                efectos: { activo: true, tipo: "murcielagos", lista: ["murcielagos", "gato_negro"], opacidad: 0.7 }
            },
            {
                id: "navidad",
                nombre: "Navidad",
                icono: "ðŸŽ„",
                activo: true,
                mostrarControlVisitante: true,
                colorResaltado: "#c12110",
                colorResaltadoRgb: "193, 33, 16",
                prioridad: 20,
                calendario: {
                    tipo: "fechas",
                    mesInicio: 12,
                    diaInicio: 1,
                    mesFin: 1,
                    diaFin: 6
                },
                fondoDia: {
                    colorFondo: "#fafbec",
                    capas: [
                        {
                            id: "capa_nav_dia_base",
                            nombre: "Invierno nevado dÃ­a",
                            visible: true,
                            imagen: "img/fondos/fondo-dia-navidad.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "top center",
                            tamano: "100% auto",
                            opacidad: 0.9,
                            orden: 1
                        }
                    ]
                },
                fondoNoche: {
                    colorFondo: "#102e19",
                    capas: [
                        {
                            id: "capa_1791726013551",
                            nombre: "Nueva Capa 2",
                            visible: true,
                            imagen: "img/fondos/fondo-noche-navidad-scroll-fijo.webp",
                            desplazamiento: "fixed",
                            repeticion: "no-repeat",
                            posicion: "center center",
                            tamano: "cover",
                            opacidad: 1,
                            orden: 1
                        },
                        {
                            id: "capa_nav_noche_base",
                            nombre: "Nochebuena invernal",
                            visible: true,
                            imagen: "img/fondos/fondo-noche-navidad-scroll.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "top center",
                            tamano: "100% auto",
                            opacidad: 0.9,
                            orden: 2
                        }
                    ]
                },
                efectos: { activo: true, tipo: "nieve", lista: ["nieve"], opacidad: 0.75 }
            },
            {
                id: "dulce",
                nombre: "Dulce",
                icono: "🧁",
                activo: true,
                mostrarControlVisitante: true,
                colorResaltado: "#429ff5",
                colorResaltadoRgb: "66, 159, 245",
                colorResaltadoDia: "#61cacc",
                colorResaltadoDiaRgb: "97, 202, 204",
                colorResaltadoNoche: "#429ff5",
                colorResaltadoNocheRgb: "66, 159, 245",
                calendario: {
                    tipo: "rango_anual",
                    mesInicio: 3,
                    diaInicio: 20,
                    mesFin: 4,
                    diaFin: 25
                },
                fondoDia: {
                    colorFondo: "#c683c1",
                    colorVentana: "#ffc2c2",
                    opacidadSuperficie: 0.5,
                    blurVentana: true,
                    blurHeader: true,
                    blurNav: true,
                    blurFooter: true,
                    capas: [
                        {
                            id: "capa_1791946072602",
                            nombre: "Nueva Capa 1",
                            visible: true,
                            imagen: "img/fondos/fondo-dia-rosita.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "center center",
                            tamano: "100% auto",
                            opacidad: 1,
                            orden: 1
                        }
                    ]
                },
                fondoNoche: {
                    colorFondo: "#b53179",
                    colorVentana: "#5a1c39",
                    opacidadSuperficie: 0.75,
                    blurVentana: true,
                    blurHeader: true,
                    blurNav: true,
                    blurFooter: true,
                    capas: [
                        {
                            id: "capa_1791946102639",
                            nombre: "Nueva Capa 1",
                            visible: true,
                            imagen: "img/fondos/fondo-noche-rosita.webp",
                            desplazamiento: "scroll",
                            repeticion: "repeat",
                            posicion: "center center",
                            tamano: "100% auto",
                            opacidad: 1,
                            orden: 1
                        }
                    ]
                },
                efectos: { activo: false, tipo: "ninguno", lista: [] },
                clasificacion: "secundario"
            }
        ]
    };

    let configInicial = null;
    try {
        const rawCache = localStorage.getItem('lotlab_settings_temas_cache');
        if (rawCache) {
            configInicial = JSON.parse(rawCache);
        }
    } catch(e) {}
    if (!configInicial) {
        configInicial = CONFIG_PREDETERMINADA;
    }

    let pTemaInicial = null;
    let pDiaNocheInicial = null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        pTemaInicial = urlParams.get('previewTema');
        pDiaNocheInicial = urlParams.get('previewModo');
    } catch(e) {}

    const TemasEstacionales = {
        config: configInicial,
        temaActivo: null,
        modoForzado: pTemaInicial,
        modoDiaForzado: pDiaNocheInicial,
        observerModo: null,

        // Comprueba si una fecha local cae dentro de un rango anual inclusivo
        estaEnRangoAnual(fecha, calendario) {
            if (!calendario) return false;
            if (calendario.tipo === 'siempre') return true;
            if (calendario.tipo !== 'rango_anual' && calendario.tipo !== 'fechas') return false;

            const mes = fecha.getMonth() + 1; // 1-12
            const dia = fecha.getDate();      // 1-31

            const mIni = calendario.mesInicio;
            const dIni = calendario.diaInicio;
            const mFin = calendario.mesFin;
            const dFin = calendario.diaFin;

            if (mIni <= mFin) {
                // Rango dentro del mismo aÃ±o (ej: Halloween 1 oct - 1 nov)
                const despuesDeInicio = (mes > mIni) || (mes === mIni && dia >= dIni);
                const antesDeFin = (mes < mFin) || (mes === mFin && dia <= dFin);
                return despuesDeInicio && antesDeFin;
            } else {
                // Rango que cruza fin de aÃ±o (ej: Navidad 1 dic - 6 ene)
                const enParteDiciembre = (mes > mIni) || (mes === mIni && dia >= dIni);
                const enParteEnero = (mes < mFin) || (mes === mFin && dia <= dFin);
                return enParteDiciembre || enParteEnero;
            }
        },

        // Helper para convertir hex a "r, g, b"
        hexToRgb(hex) {
            if (!hex) return null;
            hex = hex.replace('#', '').trim();
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            if (hex.length !== 6) return null;
            const num = parseInt(hex, 16);
            return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
        },

        // Determina quÃ© modo debe estar activo segÃºn fecha, configuraciÃ³n y preferencias
        // Prioridad: 1=forzado, 2=estacionales en temporada, 3=selecciÃ³n manual, 4=Principal, 5=base
        determinarModoActivo(fecha = new Date()) {
            if (!this.config || !this.config.modos) return null;

            // 1. Modo forzado por URL / CMS preview
            if (this.modoForzado) {
                const modoForzadoObj = this.config.modos.find(m => m.id === this.modoForzado);
                if (modoForzadoObj) return modoForzadoObj;
            }

            // 2. Selección manual guardada (prioridad sobre automático de temporada)
            const temaSeleccionado = localStorage.getItem('lotlab_tema_seleccionado');
            if (temaSeleccionado && temaSeleccionado !== 'auto') {
                const modoManual = this.config.modos.find(m =>
                    m.id === temaSeleccionado && m.activo !== false
                );
                if (modoManual) return modoManual;
                // El tema ya no existe o fue eliminado: limpiar
                localStorage.removeItem('lotlab_tema_seleccionado');
            }

            // 3. Temas estacionales activos en temporada (+ legacy: sin clasificacion pero con calendario tipo fechas)
            const candidatosEstacionales = this.config.modos
                .filter(m => m.activo === true && m.calendario && (
                    m.clasificacion === 'estacional' ||
                    (!m.clasificacion && m.calendario.tipo === 'fechas')
                ))
                .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));

            for (const modo of candidatosEstacionales) {
                if (this.estaEnRangoAnual(fecha, modo.calendario)) {
                    const prefDesactivado = localStorage.getItem('lotlab_tema_desactivado_' + modo.id);
                    if (prefDesactivado === 'true') continue;
                    return modo;
                }
            }

            // 4. Tema con clasificacion === 'principal'
            const principal = this.config.modos.find(m => m.clasificacion === 'principal' && m.activo !== false);
            if (principal) return principal;

            // 5. Fallback: base o primer modo
            return this.config.modos.find(m => m.id === 'base') || this.config.modos[0];
        },

        // Obtiene los recursos visuales y de color que corresponden a la pantalla de carga
        obtenerRecursosPantallaCarga(fecha = new Date()) {
            const modo = this.determinarModoActivo(fecha);
            const urlParams = new URLSearchParams(window.location.search);
            const pModo = this.modoDiaForzado || urlParams.get('previewModo');
            const esDia = pModo !== null
                ? (pModo === 'dia')
                : (document.body ? document.body.classList.contains('modo-dia') : (localStorage.getItem('modoTema') === 'dia'));

            const configFondo = esDia ? (modo?.fondoDia || modo?.fondoNoche) : (modo?.fondoNoche || modo?.fondoDia);
            const colorReserva = configFondo?.colorFondo || (esDia ? '#F3EEE3' : '#242868');

            let imagen = null;
            if (configFondo?.imagenCarga) {
                imagen = configFondo.imagenCarga;
            } else if (modo?.id === 'base') {
                imagen = esDia ? 'img/pantalla%20carga/carga%20Dia.webp' : 'img/pantalla%20carga/carga%20Noche.webp';
            } else if (configFondo?.capas && configFondo.capas.length > 0) {
                const capaVisible = configFondo.capas.find(c => c.visible !== false);
                imagen = capaVisible ? capaVisible.imagen : null;
            }

            const colorResaltadoDia = modo?.colorResaltadoDia || modo?.colorResaltado || '#2ECC71';
            const colorResaltadoNoche = modo?.colorResaltadoNoche || modo?.colorResaltado || '#2ECC71';
            const colorResaltado = esDia ? colorResaltadoDia : colorResaltadoNoche;
            const colorResaltadoRgb = esDia
                ? (modo?.colorResaltadoDiaRgb || this.hexToRgb(colorResaltadoDia) || '46, 204, 113')
                : (modo?.colorResaltadoNocheRgb || this.hexToRgb(colorResaltadoNoche) || '46, 204, 113');

            return {
                temaId: modo?.id || 'base',
                temaNombre: modo?.nombre || 'Modo Base (Clásico)',
                esDia: esDia,
                colorReserva: colorReserva,
                colorResaltado: colorResaltado,
                colorResaltadoRgb: colorResaltadoRgb,
                colorResaltadoDia: colorResaltadoDia,
                colorResaltadoNoche: colorResaltadoNoche,
                imagen: imagen
            };
        },

        // Aplica sincronizadamente las variables y fondos a la pantalla de carga
        aplicarRecursosPantallaCarga() {
            const recursos = this.obtenerRecursosPantallaCarga();
            const root = document.documentElement;

            if (recursos.colorReserva) {
                root.style.setProperty('--color-fondo-carga', recursos.colorReserva);
            }
            if (recursos.colorResaltado) {
                root.style.setProperty('--color-barra-carga', recursos.colorResaltado);
            }
            if (recursos.imagen) {
                root.style.setProperty('--imagen-fondo-carga', `url('${recursos.imagen}')`);
            } else {
                root.style.setProperty('--imagen-fondo-carga', 'none');
            }

            const pantalla = document.getElementById('pantallaCarga');
            const fondo = document.getElementById('pantallaCargaFondo');

            if (pantalla && recursos.colorReserva) {
                pantalla.style.backgroundColor = recursos.colorReserva;
            }
            if (pantalla && recursos.colorResaltado) {
                pantalla.style.setProperty('--color-barra-carga', recursos.colorResaltado);
            }
            if (fondo) {
                if (recursos.imagen) {
                    fondo.style.backgroundImage = `url('${recursos.imagen}')`;
                } else {
                    fondo.style.backgroundImage = 'none';
                }
            }

            const elBy = document.querySelector('.pantallaCargaBy');
            if (elBy && recursos.colorResaltado) {
                elBy.style.color = recursos.colorResaltado;
            }
            const elProgreso = document.getElementById('barraCargaProgreso');
            if (elProgreso && recursos.colorResaltado) {
                elProgreso.style.backgroundColor = recursos.colorResaltado;
            }

            // Sincronizar superficie (color+opacidad+blur) del marco de la pantalla de carga
            // con la configuraciÃ³n del tema y modo activos, igual que las ventanas.
            // Se ejecuta aquÃ­ para garantizar que --superficie-bg y --ventana-blur estÃ©n
            // disponibles desde el primer render, antes de que renderizarCapas se llame.
            try {
                const modoSup = this.determinarModoActivo();
                const urlParamsSup = new URLSearchParams(window.location.search);
                const pModoSup = this.modoDiaForzado || urlParamsSup.get('previewModo');
                const esDiaSup = pModoSup !== null
                    ? (pModoSup === 'dia')
                    : (document.body ? document.body.classList.contains('modo-dia') : (localStorage.getItem('modoTema') === 'dia'));
                const configFondoSup = esDiaSup
                    ? (modoSup?.fondoDia || modoSup?.fondoNoche)
                    : (modoSup?.fondoNoche || modoSup?.fondoDia);

                this.aplicarSuperficieYScrollbar(configFondoSup, esDiaSup);

                const blurActivoSup = configFondoSup ? (configFondoSup.blurVentana !== false) : true;
                root.style.setProperty('--ventana-blur', blurActivoSup ? '18px' : '0px');
                // Blur de barras independientes
                const blurHSup = configFondoSup ? (configFondoSup.blurHeader !== false) : true;
                const blurNSup = configFondoSup ? (configFondoSup.blurNav !== false) : true;
                const blurFSup = configFondoSup ? (configFondoSup.blurFooter !== false) : true;
                root.style.setProperty('--barra-header-blur', blurHSup ? '18px' : '0px');
                root.style.setProperty('--barra-nav-blur', blurNSup ? '18px' : '0px');
                root.style.setProperty('--barra-footer-blur', blurFSup ? '18px' : '0px');
            } catch (e) {}

            if (typeof window.actualizarRecursosPantallaCarga === 'function') {
                window.actualizarRecursosPantallaCarga();
            }
        },

        // Transformaciones HSL para mantener fidelidad de matiz cromático en superficies personalizadas
        _rgbToHsl(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return [Math.round(h * 360), s, l];
        },

        _hslToRgb(h, s, l) {
            h /= 360;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        },

        // Sincroniza las variables de superficie y de scrollbar (fija y móvil) con el color de ventana del tema activo
        aplicarSuperficieYScrollbar(configFondo, esDiaFallback) {
            const root = document.documentElement;
            const body = document.body;
            let colorHex = (configFondo && configFondo.colorVentana) ? configFondo.colorVentana : (esDiaFallback ? '#ffffff' : '#191919');
            let hex = colorHex.replace('#', '').trim();
            if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
                hex = esDiaFallback ? 'ffffff' : '191919';
            }
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const op = (configFondo && typeof configFondo.opacidadSuperficie === 'number' && !isNaN(configFondo.opacidadSuperficie))
                ? Math.min(1, Math.max(0.1, configFondo.opacidadSuperficie))
                : (esDiaFallback ? 0.5 : 0.75);

            const [h, s, l] = this._rgbToHsl(r, g, b);

            let carril, indicador, hover;

            if (l < 0.5) {
                // Ventana oscura (modo noche o temas con superficie oscura)
                const rgbC = this._hslToRgb(h, s, Math.max(0.04, l * 0.65));
                const opC = Math.min(0.92, Math.max(0.68, op));
                carril = `rgba(${rgbC[0]}, ${rgbC[1]}, ${rgbC[2]}, ${opC.toFixed(2)})`;

                const sI = s > 0 ? Math.min(1, s * 1.15 + 0.05) : 0;
                const lI = Math.min(0.65, l + 0.25);
                const rgbI = this._hslToRgb(h, sI, lI);
                indicador = `rgba(${rgbI[0]}, ${rgbI[1]}, ${rgbI[2]}, 0.85)`;

                const sH = s > 0 ? Math.min(1, s * 1.25 + 0.10) : 0;
                const lH = Math.min(0.78, l + 0.38);
                const rgbH = this._hslToRgb(h, sH, lH);
                hover = `rgba(${rgbH[0]}, ${rgbH[1]}, ${rgbH[2]}, 0.95)`;
            } else {
                // Ventana clara (modo día o temas con superficie clara)
                const sC = s > 0 ? Math.min(0.60, s * 0.60) : 0;
                const lC = Math.max(0.40, l - 0.14);
                const rgbC = this._hslToRgb(h, sC, lC);
                const opC = Math.min(0.28, Math.max(0.12, +(op * 0.28).toFixed(2)));
                carril = `rgba(${rgbC[0]}, ${rgbC[1]}, ${rgbC[2]}, ${opC.toFixed(2)})`;

                const sI = s > 0 ? Math.min(0.55, Math.max(0.25, s * 0.65)) : 0;
                const lI = Math.max(0.35, l - 0.38);
                const rgbI = this._hslToRgb(h, sI, lI);
                const opI = Math.min(0.55, Math.max(0.32, +(op * 0.70).toFixed(2)));
                indicador = `rgba(${rgbI[0]}, ${rgbI[1]}, ${rgbI[2]}, ${opI.toFixed(2)})`;

                const sH = s > 0 ? Math.min(0.65, Math.max(0.30, s * 0.75)) : 0;
                const lH = Math.max(0.25, l - 0.50);
                const rgbH = this._hslToRgb(h, sH, lH);
                const opH = Math.min(0.75, Math.max(0.48, +(op * 0.95).toFixed(2)));
                hover = `rgba(${rgbH[0]}, ${rgbH[1]}, ${rgbH[2]}, ${opH.toFixed(2)})`;
            }

            const superficieBg = `rgba(${r}, ${g}, ${b}, ${op.toFixed(2)})`;

            // Aplicar simultáneamente en documentElement y body para garantizar prioridad sin sombras CSS
            root.style.setProperty('--superficie-bg', superficieBg);
            root.style.setProperty('--superficie-carril', carril);
            root.style.setProperty('--superficie-indicador', indicador);
            root.style.setProperty('--superficie-indicador-hover', hover);

            if (body) {
                body.style.setProperty('--superficie-bg', superficieBg);
                body.style.setProperty('--superficie-carril', carril);
                body.style.setProperty('--superficie-indicador', indicador);
                body.style.setProperty('--superficie-indicador-hover', hover);
            }
        },

        // Aplica los colores de resaltado del tema (Día y Noche independientes)
        aplicarColores(modo) {
            const root = document.documentElement;
            if (!modo) return;

            const esDia = this.modoDiaForzado !== null 
                ? (this.modoDiaForzado === 'dia')
                : (document.body ? document.body.classList.contains('modo-dia') : false);

            const hexDia = modo.colorResaltadoDia || modo.colorResaltado || '#2ECC71';
            const rgbDia = modo.colorResaltadoDiaRgb || this.hexToRgb(hexDia) || '46, 204, 113';

            const hexNoche = modo.colorResaltadoNoche || modo.colorResaltado || '#2ECC71';
            const rgbNoche = modo.colorResaltadoNocheRgb || this.hexToRgb(hexNoche) || '46, 204, 113';

            const hexActivo = esDia ? hexDia : hexNoche;
            const rgbActivo = esDia ? rgbDia : rgbNoche;

            root.style.setProperty('--color-resaltado', hexActivo);
            root.style.setProperty('--color-resaltado-rgb', rgbActivo);
            root.style.setProperty('--color-resaltado-dia', hexDia);
            root.style.setProperty('--color-resaltado-dia-rgb', rgbDia);
            root.style.setProperty('--color-resaltado-noche', hexNoche);
            root.style.setProperty('--color-resaltado-noche-rgb', rgbNoche);
            root.style.setProperty('--color-barra-carga', hexActivo);

            // Clase CSS en body para selectores específicos de tema
            if (this.config && Array.isArray(this.config.modos)) {
                this.config.modos.forEach(m => {
                    document.body.classList.remove('tema-' + m.id);
                });
            }
            document.body.classList.add('tema-' + modo.id);
        },

        // Comprueba si la instancia actual es una salida de OBS Studio
        esModoOBS() {
            try {
                if (document.body && document.body.classList.contains('modo-obs')) return true;
                if (document.documentElement && document.documentElement.classList.contains('modo-obs')) return true;
                const sp = new URLSearchParams(window.location.search);
                if (sp.get('obs') === '1') return true;
                const hp = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
                if (hp.get('obs') === '1') return true;
            } catch (e) {}
            return false;
        },

        // Renderiza las capas en #contenedorCapasFondo
        renderizarCapas(modo) {
            if (this.esModoOBS()) {
                const contenedorExistente = document.getElementById('contenedorCapasFondo');
                if (contenedorExistente) contenedorExistente.remove();
                document.body?.classList.remove('tema-multicapa-activo');
                const esDia = this.modoDiaForzado !== null 
                    ? (this.modoDiaForzado === 'dia')
                    : (document.body ? document.body.classList.contains('modo-dia') : false);
                const configFondo = esDia ? (modo?.fondoDia || modo?.fondoNoche) : (modo?.fondoNoche || modo?.fondoDia);
                if (configFondo) {
                    this.aplicarSuperficieYScrollbar(configFondo, esDia);
                    const blurActivo = configFondo.blurVentana !== false;
                    document.documentElement.style.setProperty('--ventana-blur', blurActivo ? '18px' : '0px');
                }
                return;
            }

            let contenedor = document.getElementById('contenedorCapasFondo');
            if (!contenedor) {
                contenedor = document.createElement('div');
                contenedor.id = 'contenedorCapasFondo';
                contenedor.className = 'contenedorCapasFondo';
                contenedor.setAttribute('aria-hidden', 'true');
                document.body.prepend(contenedor);
            }

            const esDia = this.modoDiaForzado !== null 
                ? (this.modoDiaForzado === 'dia')
                : document.body.classList.contains('modo-dia');

            const configFondo = esDia ? (modo.fondoDia || modo.fondoNoche) : (modo.fondoNoche || modo.fondoDia);
            
            contenedor.innerHTML = '';
            document.body.classList.remove('tema-multicapa-activo');

            if (!configFondo) return;

            // Si es el modo base, body.modo-dia y body.modo-noche manejan la imagen y fondo nativamente vÃ­a css/style.css
            if (modo.id === 'base') {
                // Aplicar de todos modos el color+opacidad+blur de superficie configurados para base
                this.aplicarSuperficieYScrollbar(configFondo, esDia);
                const blurBase = configFondo && configFondo.blurVentana !== false;
                document.documentElement.style.setProperty('--ventana-blur', blurBase ? '18px' : '0px');
                // Blur independiente de barras (header, nav, footer)
                const blurHBase = configFondo && configFondo.blurHeader !== false;
                const blurNBase = configFondo && configFondo.blurNav !== false;
                const blurFBase = configFondo && configFondo.blurFooter !== false;
                document.documentElement.style.setProperty('--barra-header-blur', blurHBase ? '18px' : '0px');
                document.documentElement.style.setProperty('--barra-nav-blur', blurNBase ? '18px' : '0px');
                document.documentElement.style.setProperty('--barra-footer-blur', blurFBase ? '18px' : '0px');
                document.documentElement.style.removeProperty('--color-fondo-tema');
                document.body.classList.remove('tema-multicapa-activo');
                contenedor.innerHTML = '';
                return;
            }

            if (configFondo.colorFondo) {
                document.documentElement.style.setProperty('--color-fondo-tema', configFondo.colorFondo);
            } else {
                document.documentElement.style.removeProperty('--color-fondo-tema');
            }

            // Aplicar color+opacidad de superficie a ventanas, nav, barras y scrollbar
            this.aplicarSuperficieYScrollbar(configFondo, esDia);

            // Aplicar blur controlable de las ventanas
            const blurActivo = configFondo.blurVentana !== false; // true por defecto
            document.documentElement.style.setProperty('--ventana-blur', blurActivo ? '18px' : '0px');
            // Blur independiente de cada barra
            const blurH = configFondo.blurHeader !== false;
            const blurN = configFondo.blurNav !== false;
            const blurF = configFondo.blurFooter !== false;
            document.documentElement.style.setProperty('--barra-header-blur', blurH ? '18px' : '0px');
            document.documentElement.style.setProperty('--barra-nav-blur', blurN ? '18px' : '0px');
            document.documentElement.style.setProperty('--barra-footer-blur', blurF ? '18px' : '0px');

            // Para temas con capas adicionales o temas especiales:
            if (configFondo.capas && configFondo.capas.length > 0) {
                // Ocultar background de body para evitar duplicaciÃ³n con el contenedor multicapa
                document.body.classList.add('tema-multicapa-activo');

                const capasOrdenadas = [...configFondo.capas]
                    .filter(c => c.visible !== false)
                    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

                capasOrdenadas.forEach((capa, idx) => {
                    const elCapa = document.createElement('div');
                    const esFija = capa.desplazamiento === 'fixed';
                    elCapa.className = 'capa-fondo ' + (esFija ? 'capa-fondo-fija' : 'capa-fondo-scroll');
                    elCapa.dataset.capaId = capa.id || ('capa_' + idx);

                    elCapa.style.backgroundImage = `url('${capa.imagen}')`;
                    elCapa.style.backgroundRepeat = capa.repeticion || 'repeat';
                    elCapa.style.backgroundPosition = capa.posicion || 'top center';
                    elCapa.style.backgroundSize = capa.tamano || '100% auto';
                    elCapa.style.opacity = capa.opacidad !== undefined ? capa.opacidad : 1;
                    elCapa.style.zIndex = capa.orden || (idx + 1);

                    contenedor.appendChild(elCapa);
                });
            } else {
                document.body.classList.remove('tema-multicapa-activo');
            }
        },

        // Obtiene la lista de identificadores de efectos activos para el modo actual
        obtenerEfectosActivos(modo) {
            if (!modo || !modo.efectos || modo.efectos.activo === false) return [];
            if (Array.isArray(modo.efectos.lista) && modo.efectos.lista.length > 0) {
                return modo.efectos.lista.filter(id => id && id !== 'ninguno');
            }
            if (modo.efectos.tipo && modo.efectos.tipo !== 'ninguno') {
                return [modo.efectos.tipo];
            }
            return [];
        },

        detenerEfectosHalloween() {
            if (this._timerHalloween) {
                clearTimeout(this._timerHalloween);
                this._timerHalloween = null;
            }
            this._vueloHalloweenActivo = false;
        },

        iniciarEfectosHalloween(contenedor) {
            this.detenerEfectosHalloween();
            this._vueloHalloweenActivo = true;
            this._ultimoVueloBruja = 0;

            // ParÃ¡metros de frecuencia y apariciones configurables
            const INTERVALO_MIN_MS = 1800;
            const INTERVALO_MAX_MS = 5200;
            const COOLDOWN_BRUJA_MS = 32000;
            const PROBABILIDAD_BRUJA = 0.35;
            const PROBABILIDAD_GRUPO = 0.45;
            const PROBABILIDAD_TRIO = 0.18;
            const MAX_SILUETAS_SIMULTANEAS = 6;

            const lanzarMurcielago = (deltaY = 0) => {
                if (!this._vueloHalloweenActivo || !contenedor.isConnected) return;
                const activos = contenedor.querySelectorAll('.ente-halloween').length;
                if (activos >= MAX_SILUETAS_SIMULTANEAS) return;

                const el = document.createElement('div');
                const dirH = Math.random() > 0.45 ? 'izq-a-der' : 'der-a-izq';
                const escala = 0.55 + Math.random() * 0.50;
                const duracionVuelo = 7.5 + Math.random() * 5.5;
                const aleteoSeg = (0.22 + Math.random() * 0.12).toFixed(2);
                const yBase = 8 + Math.random() * 62;
                const yInicio = Math.min(78, Math.max(6, yBase + deltaY));
                const curvatura = (Math.random() > 0.5 ? 'onda-alta' : 'onda-baja');

                el.className = `ente-halloween murcielago-vuelo ${dirH} ${curvatura}`;
                el.style.top = `${yInicio.toFixed(1)}vh`;
                el.style.setProperty('--escala-vuelo', escala.toFixed(2));
                el.style.setProperty('--duracion-vuelo', `${duracionVuelo.toFixed(1)}s`);
                el.style.setProperty('--duracion-aleteo', `${aleteoSeg}s`);

                el.innerHTML = `<svg viewBox="0 0 84 51" class="silueta-svg-murcielago" aria-hidden="true">
                    <!-- CAPA 1: Ala lejana -->
                    <g class="alas-fase alas-fase-1"><path fill="#110e17" d="M44,19 C39,14 36,7 42,2 C44,2 42,6 40,11 C45,13 48,16 49,20 Z" /></g>
                    <g class="alas-fase alas-fase-2"><path fill="#110e17" d="M44,19 C43,13 44,5 49,1 C50,2 47,7 46,12 C50,14 52,17 52,20 Z" /></g>
                    <g class="alas-fase alas-fase-3"><path fill="#110e17" d="M44,19 C47,13 51,6 56,3 C55,6 51,10 49,14 C53,17 54,19 53,21 Z" /></g>
                    <g class="alas-fase alas-fase-4"><path fill="#110e17" d="M44,19 C46,20 50,25 51,32 C48,29 46,26 43,23 Z" /></g>
                    <g class="alas-fase alas-fase-5"><path fill="#110e17" d="M44,19 C44,25 45,34 45,42 C42,36 41,29 42,23 Z" /></g>
                    <g class="alas-fase alas-fase-6"><path fill="#110e17" d="M44,19 C40,17 37,14 39,9 C42,11 44,14 45,18 Z" /></g>

                    <!-- CAPA 2: Cuerpo mamÃ­fero quiroprÃ¡ctico nÃ­tido -->
                    <g class="cuerpo-mamifero">
                        <path fill="#110e17" d="M63,23 C63,22 62,21.5 59.5,19.5 L60.5,11 L56.5,17.5 L54.5,12 L53,17.5 C48,19.5 42,21.5 34,24.5 C30,26 28.5,27 30,28 C33,28.5 38,28.5 45,28 C51,27.5 55,26.5 58,25 C61,24.5 63,24 63,23 Z" />
                        <path fill="#110e17" d="M53,24 C56,26 56,28.5 51,29.5 C46,30 39,29.5 34,28.5 C31,28 32,27 35,26.5 C40,25.5 47,24.5 53,24 Z" />
                        <path fill="#110e17" d="M33,28.5 C31,29 29,28 28,26.5 C30,26 32,27 33,28.5 Z" />
                    </g>

                    <!-- CAPA 3: Ala cercana en 6 fases de aleteo natural -->
                    <g class="alas-fase alas-fase-1">
                        <path fill="#110e17" d="M47,21.5 C42,15.5 38,9.5 40,4.5 C42,2.5 44,4.5 43,7.5 C46,11.5 48,16.5 50,21.5 Z" />
                        <path fill="#110e17" d="M40,4.5 C35,2.5 29,4.5 24,7.5 C29,9.5 32,12.5 27,15.5 C32,16.5 37,17.5 47,21.5 C43,14.5 41,8.5 40,4.5 Z" />
                        <path fill="#110e17" d="M27,15.5 C22,18.5 19,21.5 17,23.5 C24,22.5 31,23.5 39,25.5 C34,21.5 30,18.5 27,15.5 Z" />
                    </g>
                    <g class="alas-fase alas-fase-2">
                        <path fill="#110e17" d="M47,21.5 C45,13.5 46,6.5 49,1.5 C50,2.5 48,7.5 48,11.5 C51,14.5 52,17.5 52,21.5 Z" />
                        <path fill="#110e17" d="M49,1.5 C43,2.5 35,5.5 29,9.5 C34,12.5 37,15.5 31,19.5 C37,20.5 42,20.5 50,21.5 C48,13.5 48,7.5 49,1.5 Z" />
                        <path fill="#110e17" d="M31,19.5 C25,22.5 21,24.5 18,27.5 C25,25.5 32,25.5 40,25.5 C35,23.5 32,21.5 31,19.5 Z" />
                    </g>
                    <g class="alas-fase alas-fase-3">
                        <path fill="#110e17" d="M47,21.5 C49,14.5 53,8.5 58,3.5 C59,4.5 56,8.5 53,13.5 C55,16.5 55,18.5 54,22.5 Z" />
                        <path fill="#110e17" d="M58,3.5 C50,6.5 41,10.5 34,15.5 C39,18.5 41,21.5 35,25.5 C41,24.5 46,23.5 51,22.5 C52,15.5 54,8.5 58,3.5 Z" />
                        <path fill="#110e17" d="M35,25.5 C29,27.5 24,29.5 20,32.5 C27,28.5 34,27.5 41,26.5 C38,25.5 36,25.5 35,25.5 Z" />
                    </g>
                    <g class="alas-fase alas-fase-4">
                        <path fill="#110e17" d="M47,21.5 C49,23.5 52,27.5 53,34.5 C51,30.5 48,26.5 46,23.5 Z" />
                        <path fill="#110e17" d="M53,34.5 C46,32.5 39,30.5 31,30.5 C36,26.5 38,23.5 42,21.5 C46,23.5 49,28.5 53,34.5 Z" />
                        <path fill="#110e17" d="M31,30.5 C24,31.5 19,32.5 15,33.5 C21,29.5 29,27.5 37,25.5 C34,27.5 32,29.5 31,30.5 Z" />
                    </g>
                    <g class="alas-fase alas-fase-5">
                        <path fill="#110e17" d="M47,21.5 C46,26.5 46,35.5 47,44.5 C44,37.5 43,29.5 44,23.5 Z" />
                        <path fill="#110e17" d="M47,44.5 C41,39.5 35,35.5 29,33.5 C33,29.5 35,26.5 39,24.5 C42,29.5 44,36.5 47,44.5 Z" />
                        <path fill="#110e17" d="M29,33.5 C23,33.5 18,34.5 14,35.5 C20,30.5 28,27.5 36,25.5 C32,28.5 30,31.5 29,33.5 Z" />
                    </g>
                    <g class="alas-fase alas-fase-6">
                        <path fill="#110e17" d="M47,21.5 C42,18.5 39,14.5 41,9.5 C44,12.5 46,16.5 48,20.5 Z" />
                        <path fill="#110e17" d="M41,9.5 C36,11.5 30,13.5 25,16.5 C29,18.5 32,20.5 28,23.5 C33,22.5 39,22.5 46,21.5 C43,16.5 42,12.5 41,9.5 Z" />
                        <path fill="#110e17" d="M28,23.5 C23,24.5 20,25.5 18,27.5 C24,25.5 31,25.5 38,25.5 C33,24.5 30,23.5 28,23.5 Z" />
                    </g>
                </svg>`;

                contenedor.appendChild(el);
                el.addEventListener('animationend', () => el.remove(), { once: true });
            };

            const lanzarBruja = () => {
                if (!this._vueloHalloweenActivo || !contenedor.isConnected) return;
                const activos = contenedor.querySelectorAll('.ente-halloween').length;
                if (activos >= MAX_SILUETAS_SIMULTANEAS) return;

                const el = document.createElement('div');
                const dirH = Math.random() > 0.5 ? 'izq-a-der' : 'der-a-izq';
                const escala = 0.75 + Math.random() * 0.30;
                const duracion = 14 + Math.random() * 5;
                const yInicio = 10 + Math.random() * 45;

                el.className = `ente-halloween bruja-vuelo ${dirH}`;
                el.style.top = `${yInicio.toFixed(1)}vh`;
                el.style.setProperty('--escala-vuelo', escala.toFixed(2));
                el.style.setProperty('--duracion-vuelo', `${duracion.toFixed(1)}s`);

                el.innerHTML = `<svg viewBox="0 -18 140 108" class="silueta-svg-bruja" aria-hidden="true">
                    <!-- Haz de cerdas de la escoba (cola trasera con textura) -->
                    <path fill="#141118" d="M26,58 C20,53 11,50 3,49 C1,54 0,61 1,67 C4,73 9,78 15,81 C20,81 24,72 26,63 Z" />
                    <path fill="#141118" d="M26,59 C18,57 9,58 2,62 C5,68 11,73 18,74 Z" opacity="0.95" />
                    <!-- Amarra de las cerdas -->
                    <rect x="25" y="58" width="4" height="6" rx="1" fill="#141118" transform="rotate(-6 27 61)" />
                    <!-- Mango largo y recto de la escoba proyectado al frente -->
                    <path fill="#141118" d="M27,62 L134,48 L134,51 L27,65 Z" />
                    <!-- Ropaje y falda ondeante hacia atrÃ¡s -->
                    <path fill="#141118" d="M54,42 C46,44 36,47 28,52 C32,56 38,58 44,59 C41,63 46,65 52,65 C58,64 64,61 68,57 Z" />
                    <!-- Espalda y torso inclinado en conducciÃ³n aerodinÃ¡mica -->
                    <path fill="#141118" d="M54,42 C56,36 60,32 66,32 C72,32 76,37 77,43 L71,56 C66,58 60,57 56,54 Z" />
                    <!-- Piernas y botas puntiagudas a horcajadas -->
                    <path fill="#141118" d="M68,55 C73,54 80,55 84,61 C86,64 88,69 93,71 C95,72 98,71 100,70 L98,74 C93,76 88,74 85,70 C81,65 77,63 71,63 Z" />
                    <!-- Brazos y manos asiendo el mango de la escoba -->
                    <path fill="#141118" d="M68,36 C73,40 81,46 91,48 C94,48 97,50 99,53 C98,55 94,56 90,54 C82,51 76,46 70,42 Z" />
                    <!-- Cabeza y perfil con nariz caracterÃ­stica y mentÃ³n -->
                    <path fill="#141118" d="M68,30 C69,33 73,35 77,35 C79,35 83,34 85,31 C88,31 92,29 93,26 C90,26 87,27 85,25 C83,23 81,21 77,21 C73,21 69,25 68,30 Z" />
                    <!-- Mechones de pelo ondeando al viento -->
                    <path fill="#141118" d="M68,26 C64,28 58,32 54,39 C58,37 63,36 68,34 Z" />

                    <!-- Sombrero de bruja clÃ¡sico perfeccionado: ala ancha 60px + copa cÃ³nica con punta doblada atrÃ¡s -->
                    <path fill="#141118" d="M48,27 C68,23 88,19 108,16 C110,16 111,18 109,20 C89,24 68,28 47,31 C45,30 46,28 48,27 Z" />
                    <path fill="#141118" d="M66,24 C68,14 70,3 64,-3 C59,-5 51,0 52,4 C57,2 62,3 62,7 C62,13 64,20 66,24 Z" />
                    <path fill="#141118" d="M64,24 L87,19 C83,11 77,3 72,-2 L63,-3 Z" />
                </svg>`;

                contenedor.appendChild(el);
                el.addEventListener('animationend', () => el.remove(), { once: true });
            };

            const programarCiclo = (demoraInicial = null) => {
                if (!this._vueloHalloweenActivo) return;
                const demora = demoraInicial !== null ? demoraInicial : (INTERVALO_MIN_MS + Math.random() * (INTERVALO_MAX_MS - INTERVALO_MIN_MS));

                this._timerHalloween = setTimeout(() => {
                    if (!this._vueloHalloweenActivo || !contenedor.isConnected) return;

                    const ahora = Date.now();
                    const puedeBruja = (ahora - this._ultimoVueloBruja > COOLDOWN_BRUJA_MS);
                    const lanzaBruja = puedeBruja && (Math.random() < PROBABILIDAD_BRUJA);

                    if (lanzaBruja) {
                        this._ultimoVueloBruja = ahora;
                        lanzarBruja();
                    } else {
                        lanzarMurcielago();
                        if (Math.random() < PROBABILIDAD_GRUPO) {
                            setTimeout(() => {
                                if (this._vueloHalloweenActivo && contenedor.isConnected) {
                                    const delta = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 14);
                                    lanzarMurcielago(delta);
                                }
                            }, 350 + Math.random() * 700);

                            if (Math.random() < PROBABILIDAD_TRIO) {
                                setTimeout(() => {
                                    if (this._vueloHalloweenActivo && contenedor.isConnected) {
                                        const delta = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 16);
                                        lanzarMurcielago(delta);
                                    }
                                }, 900 + Math.random() * 800);
                            }
                        }
                    }

                    programarCiclo();
                }, demora);
            };

            programarCiclo(600);
        },

        // Limpieza segura del efecto decorativo Gato Negro
        detenerEfectoGatoNegro() {
            if (this._timerGatoVisita) {
                clearTimeout(this._timerGatoVisita);
                this._timerGatoVisita = null;
            }
            if (this._timerGatoPaso) {
                clearTimeout(this._timerGatoPaso);
                this._timerGatoPaso = null;
            }
            if (this._animGatoFrame) {
                cancelAnimationFrame(this._animGatoFrame);
                this._animGatoFrame = null;
            }
            if (this._observerGatoBarra) {
                this._observerGatoBarra.disconnect();
                this._observerGatoBarra = null;
            }
            this._gatoNegroActivo = false;
            const elCont = document.getElementById('contenedorGatoNegro');
            if (elCont) elCont.remove();
        },

        // InicializaciÃ³n del efecto Gato Negro y RatÃ³n en la barra inferior
        iniciarEfectoGatoNegro() {
            this.detenerEfectoGatoNegro();
            if (this.esModoOBS()) return;
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const barra = document.querySelector('.footer-controles');
            if (!barra) return;

            this._gatoNegroActivo = true;

            let cont = document.getElementById('contenedorGatoNegro');
            if (!cont) {
                cont = document.createElement('div');
                cont.id = 'contenedorGatoNegro';
                cont.className = 'contenedorGatoNegro';
                cont.setAttribute('aria-hidden', 'true');
                barra.appendChild(cont);
            }

            // Trazados de las siluetas anatÃ³micas reales aprobadas
            const PATH_PATA_DEL_1 = "M 161.9,60.4 L 175.7,84.7 L 178.2,87.6 L 184.7,91.6 L 185.6,94.1 L 183.2,96.5 L 178.7,96.5 L 174.3,94.1 L 145,64.4 L 141.1,62.4 C 146,55 156,54 161.9,60.4 Z";
            const PATH_PATA_DEL_2 = "M 141.1,62.4 L 136.1,69.3 L 131.2,87.1 L 131.7,92.6 L 136.1,94.1 L 137.6,95.5 L 137.6,98 L 132.7,100 L 126.7,99 L 124.8,95.5 L 123.8,89.6 L 123.8,60.4 L 122.8,59.4 C 128,54 136,54 141.1,62.4 Z";
            const PATH_PATA_TRAS_1 = "M 89.6,59.9 L 84.2,72.3 L 79.2,80.2 L 79.2,82.7 L 87.6,92.1 L 92.6,92.1 L 96,95 L 96,97 L 94.6,98.5 L 84.2,98.5 L 77.2,93.1 L 69.3,84.7 L 65.8,78.7 L 67.3,72.8 L 67.3,65.8 L 66.3,63.9 C 72,55 83,55 89.6,59.9 Z";
            const PATH_PATA_TRAS_2 = "M 66.3,63.9 L 56.9,69.3 L 45,73.8 L 42.1,76.7 L 38.6,86.6 L 38.6,89.6 L 41.1,92.1 L 41.6,95 L 39.6,96.5 L 35.6,96.5 L 32.7,94.1 L 31.2,89.6 L 32.7,78.7 L 36.1,64.9 L 44.6,57.4 L 47.5,52.5 C 54,49 61,54 66.3,63.9 Z";
            const PATH_COLA = "M 48.5,38.1 L 47.5,38.1 L 37.6,55.4 L 30.7,61.9 L 22.3,65.8 L 12.9,65.8 L 6.4,62.9 L 0,54.5 L 0,48 L 2,47.5 L 5,49 L 8.9,55 L 12.4,57.4 L 19.3,57.9 L 23.8,55.9 L 31.7,47.5 L 39.1,31.7 L 42.6,26.7 L 50,20.3 C 51,26 50,33 48.5,38.1 Z";
            const PATH_CUERPO = "M 179.7,0 L 181.2,0.5 L 181.7,4.5 L 187.1,1.5 L 184.7,8.4 L 191.6,14.9 L 192.6,20.3 L 196,25.2 L 196,27.2 L 190.1,33.2 L 180.7,32.2 L 174.3,34.2 L 169.3,37.1 L 164.4,43.1 L 161.9,60.4 C 153,64 135,64 122.8,59.4 L 89.6,59.9 C 78,63 60,63 47.5,52.5 L 48.5,38.1 C 49,30 49,24 50,20.3 L 61.4,15.3 L 76.7,12.4 L 104,13.4 L 125.7,16.3 L 131.2,16.3 L 137.1,14.4 L 149.5,14.9 L 169.8,8.4 L 179.2,0.5 Z";
            const PATH_SENTADO = "M 57.6,0 L 58.9,0.7 L 59.6,4 L 63.2,0.7 L 62.6,7 L 68.5,11.3 L 69.9,15.6 L 72.5,18.5 L 71.9,21.5 L 69.2,24.8 L 65.2,25.2 L 63.6,26.5 L 63.9,42.4 L 61.9,47.4 L 57,54.3 L 55.3,58.9 L 54.6,77.5 L 55.6,78.8 L 58.9,79.8 L 59.9,81.5 L 57.9,83.8 L 57.9,85.1 L 55,86.4 L 52,86.4 L 49.3,85.4 L 47.7,82.8 L 44.4,71.5 L 43.4,74.8 L 41.1,78.1 L 45.4,79.5 L 46,82.1 L 43,83.1 L 42.7,85.4 L 41.1,86.4 L 17.9,86.4 L 12.6,84.4 L 9.3,85.8 L 7.6,87.4 L 7.3,89.7 L 9.3,92.1 L 15.2,94.7 L 23.5,95 L 32.5,92.4 L 34.8,92.4 L 34.4,95 L 30.1,98 L 21.9,100 L 10.9,99.3 L 3.3,95.7 L 1.3,93.4 L 0,90.1 L 0,87.1 L 1.7,83.1 L 7.9,76.5 L 7.6,65.9 L 8.3,60.3 L 11.3,48.3 L 14.9,41.1 L 17.2,37.7 L 23.8,32.1 L 30.5,29.5 L 37.4,28.1 L 43.4,21.2 L 45.4,14.2 L 47,11.3 L 53,6 L 57.3,0.3 Z";

            // Estirado normalizado (mismo volumen 1:1, orientaciÃ³n a la derecha y contacto de almohadillas en Y=100)
            const PATH_ESTIRADO_NORMALIZADO = "M 42.5,-42.0 L 36.6,-42.0 L 29.7,-40.0 L 23.4,-36.6 L 17.6,-31.8 L 12.2,-25.4 L 8.2,-18.6 L 4.4,-4.9 L 4.8,11.7 L 0.0,22.9 L 0.0,31.7 L 8.8,56.5 L 8.8,77.0 L 12.6,85.8 L 20.4,97.0 L 24.8,99.6 L 31.2,99.0 L 33.2,98.0 L 33.7,95.2 L 38.1,94.6 L 39.5,92.6 L 37.5,89.2 L 32.7,88.8 L 26.8,81.0 L 26.8,75.6 L 31.2,68.3 L 49.3,82.0 L 64.9,88.8 L 74.7,90.2 L 93.7,89.2 L 115.6,96.2 L 150.8,100.0 L 157.1,99.6 L 160.0,97.6 L 160.0,95.6 L 154.6,89.2 L 145.4,89.2 L 137.0,86.8 L 118.6,80.0 L 113.7,75.2 L 115.2,73.6 L 123.0,74.2 L 126.8,71.2 L 128.8,67.8 L 128.8,65.4 L 125.8,61.5 L 124.0,54.6 L 118.0,49.3 L 120.0,41.9 L 115.2,44.3 L 114.6,41.5 L 112.2,40.9 L 103.9,47.3 L 95.6,48.3 L 88.3,52.1 L 85.9,52.1 L 78.5,48.3 L 72.7,47.3 L 65.3,41.9 L 56.1,25.9 L 45.9,14.1 L 35.1,7.3 L 19.5,4.3 L 17.0,1.9 L 15.6,-2.5 L 15.6,-8.8 L 17.0,-14.2 L 21.4,-22.0 L 28.8,-29.8 L 38.5,-34.6 L 42.9,-34.6 L 49.3,-32.8 L 54.7,-33.8 L 55.1,-36.2 L 53.1,-38.2 L 42.9,-41.6 Z";

            const HTML_GATO_CAPAS = `
                <div class="gato-capa gato-capa-caminando">
                    <svg viewBox="0 0 196 100" class="svg-gato-articulado" aria-hidden="true">
                        <path class="pata-lejana pata-tras-2" fill="#0d0a12" d="${PATH_PATA_TRAS_2}" />
                        <path class="pata-lejana pata-del-2" fill="#0d0a12" d="${PATH_PATA_DEL_2}" />
                        <g class="cola-grupo">
                            <path fill="#110e17" d="${PATH_COLA}" />
                        </g>
                        <g class="cuerpo-grupo">
                            <path fill="#110e17" d="${PATH_CUERPO}" />
                        </g>
                        <path class="pata-cercana pata-tras-1" fill="#110e17" d="${PATH_PATA_TRAS_1}" />
                        <path class="pata-cercana pata-del-1" fill="#110e17" d="${PATH_PATA_DEL_1}" />
                    </svg>
                </div>
                <div class="gato-capa gato-capa-sentado">
                    <svg viewBox="0 0 73 100" aria-hidden="true">
                        <path fill="#110e17" d="${PATH_SENTADO}" />
                    </svg>
                </div>
                <div class="gato-capa gato-capa-estirado">
                    <svg viewBox="0 -42 160 142" aria-hidden="true">
                        <path fill="#110e17" d="${PATH_ESTIRADO_NORMALIZADO}" />
                    </svg>
                </div>`;

            const SVG_RATON_HTML = `<svg viewBox="0 0 60 21" width="40" height="14" aria-hidden="true">
              <path fill="#110e17" d="M15,19 C10,18 4,14 1,9 C-1,6 -1,3 1,2 C2,1 3,2 3,4 C2,7 6,11 11,15 C13,16 15,17 17,17 Z" />
              <path fill="#110e17" d="M48,18 C45,18 42,19 39,21 L36,21 C37,19 38,17 38,15 C36,14 33,14 29,15 C27,17 26,19 25,21 L22,21 C23,19 24,16 23,14 C19,14 15,16 14,19 C12,17 11,14 13,11 C15,7 21,6 27,6 C33,6 38,8 41,10 C40,8 41,5 44,4 C47,3 49,4 49,7 C50,6 52,6 54,7 C55,8 55,10 54,11 C57,12 60,14 62,15 C63,16 62,17 60,17 C57,17 54,16 51,15 C50,16 49,18 48,18 Z" />
            </svg>`;

            const setPoseGato = (el, pose) => {
                el.classList.remove('gato-estado-caminando', 'gato-estado-corriendo', 'gato-estado-sentado', 'gato-estado-estirado', 'gato-anim-caminando', 'gato-anim-corriendo', 'gato-anim-sentado');
                if (pose === 'caminando') {
                    el.classList.add('gato-estado-caminando', 'gato-anim-caminando');
                } else if (pose === 'corriendo') {
                    el.classList.add('gato-estado-corriendo', 'gato-anim-corriendo');
                } else if (pose === 'sentado') {
                    el.classList.add('gato-estado-sentado', 'gato-anim-sentado');
                } else if (pose === 'estirado') {
                    el.classList.add('gato-estado-estirado');
                }
            };

            const ejecutarVisita = () => {
                if (!this._gatoNegroActivo || !cont.isConnected) return;

                const barraRect = barra.getBoundingClientRect();
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 800;
                const catWidth = 80;

                // Entrada estrictamente desde fuera del borde izquierdo real de la ventana
                const startX = -barraRect.left - catWidth - 10;
                let posX = startX;

                const gato = document.createElement('div');
                gato.className = 'gato-barra-personaje';
                gato.innerHTML = HTML_GATO_CAPAS;
                setPoseGato(gato, 'caminando');
                gato.style.left = posX.toFixed(1) + 'px';
                cont.appendChild(gato);

                // Localizar la zona real ocupada por los botones interactivos para parada coherente
                const botones = barra.querySelectorAll('button, .toggleModo');
                let firstBtnLeft = 30;
                let lastBtnRight = Math.max(100, barra.clientWidth - 100);
                if (botones.length > 0) {
                    const bRect = barra.getBoundingClientRect();
                    const rects = Array.from(botones).map(b => b.getBoundingClientRect()).filter(r => r.width > 0);
                    if (rects.length > 0) {
                        firstBtnLeft = Math.min(...rects.map(r => r.left - bRect.left));
                        lastBtnRight = Math.max(...rects.map(r => r.right - bRect.left));
                    }
                }
                const minStop = firstBtnLeft + 15;
                const maxStop = Math.max(minStop + 30, lastBtnRight - catWidth - 15);
                const puntoParada = minStop + Math.random() * (maxStop - minStop);

                let estado = 'entrando';
                const velocidadCaminar = 46;
                const velocidadCorrer = 138;
                let velocidadActual = velocidadCaminar; // px / s

                const hayRaton = Math.random() < 0.35; // Probabilidad de persecuciÃ³n coordinada
                let ratonEl = null;
                let ratonX = startX + 65; // El ratÃ³n parte por delante del gato fuera de la pantalla
                let ratonVelocidad = 72; // Trote ligero mientras no se asusta
                let ratonTriggered = false;
                let ratonPresente = false;

                if (hayRaton) {
                    ratonEl = document.createElement('div');
                    ratonEl.className = 'raton-barra-personaje raton-anim-corriendo';
                    ratonEl.innerHTML = SVG_RATON_HTML;
                    ratonEl.style.left = ratonX.toFixed(1) + 'px';
                    cont.appendChild(ratonEl);
                    ratonPresente = true;
                }

                let ultimoTiempo = performance.now();

                const loopAnimacion = (ahora) => {
                    if (!this._gatoNegroActivo || !gato.isConnected) return;
                    const dt = Math.min(0.08, (ahora - ultimoTiempo) / 1000);
                    ultimoTiempo = ahora;

                    // LÃ­mite de salida recalculado dinÃ¡micamente segÃºn viewport actual
                    const barraRectActual = barra.getBoundingClientRect();
                    const viewWidthActual = window.innerWidth || document.documentElement.clientWidth || 800;
                    const exitX = (viewWidthActual - barraRectActual.left) + 40;

                    // Avance del ratÃ³n si estÃ¡ en escena
                    if (ratonPresente && ratonEl) {
                        ratonX += ratonVelocidad * dt;
                        ratonEl.style.left = ratonX.toFixed(1) + 'px';

                        // DetecciÃ³n espacial por proximidad real (el gato divisa al ratÃ³n por delante)
                        const distancia = ratonX - posX;
                        if (!ratonTriggered && distancia <= 110 && distancia >= 10) {
                            ratonTriggered = true;
                            estado = 'persecucion';
                            velocidadActual = velocidadCorrer;
                            setPoseGato(gato, 'corriendo');
                            ratonVelocidad = 158; // El ratÃ³n acelera a toda velocidad asustado
                        }

                        // Salida completa del ratÃ³n por el borde derecho
                        if (ratonX > exitX) {
                            ratonEl.remove();
                            ratonEl = null;
                            ratonPresente = false;
                        }
                    }

                    if (estado === 'entrando') {
                        posX += velocidadActual * dt;
                        gato.style.left = posX.toFixed(1) + 'px';

                        // Si no hay persecuciÃ³n activa y el gato llega al punto de parada sobre la barra
                        if (!ratonTriggered && posX >= puntoParada) {
                            posX = puntoParada;
                            gato.style.left = posX.toFixed(1) + 'px';
                            estado = 'frenando';

                            // TransiciÃ³n fluida a sentado
                            setPoseGato(gato, 'sentado');
                            estado = 'sentado';

                            const tiempoSentado = 4500 + Math.random() * 3500;
                            this._timerGatoPaso = setTimeout(() => {
                                if (!this._gatoNegroActivo || !gato.isConnected) return;
                                estado = 'estirandose';
                                setPoseGato(gato, 'estirado');

                                this._timerGatoPaso = setTimeout(() => {
                                    if (!this._gatoNegroActivo || !gato.isConnected) return;
                                    // TransiciÃ³n fluida de recuperaciÃ³n a caminata
                                    setPoseGato(gato, 'caminando');
                                    estado = 'saliendo';
                                    velocidadActual = velocidadCaminar;
                                }, 2800);
                            }, tiempoSentado);
                        }
                    } else if (estado === 'persecucion') {
                        posX += velocidadActual * dt;
                        gato.style.left = posX.toFixed(1) + 'px';

                        if (posX >= exitX) {
                            finalizarVisita(gato, ratonEl);
                            return;
                        }
                    } else if (estado === 'saliendo') {
                        posX += velocidadActual * dt;
                        gato.style.left = posX.toFixed(1) + 'px';

                        if (posX >= exitX) {
                            finalizarVisita(gato, ratonEl);
                            return;
                        }
                    }

                    this._animGatoFrame = requestAnimationFrame(loopAnimacion);
                };

                this._animGatoFrame = requestAnimationFrame((t) => {
                    ultimoTiempo = t;
                    loopAnimacion(t);
                });
            };

            const finalizarVisita = (gato, raton) => {
                if (this._animGatoFrame) {
                    cancelAnimationFrame(this._animGatoFrame);
                    this._animGatoFrame = null;
                }
                if (gato && gato.isConnected) gato.remove();
                if (raton && raton.isConnected) raton.remove();

                // ReapariciÃ³n rÃ¡pida: estrictamente entre 15 y 30 segundos tras terminar de salir
                const cooldownMin = 15000;
                const cooldownMax = 30000;
                const cooldown = (typeof window.__LOTLAB_GATO_COOLDOWN_MS === 'number')
                    ? window.__LOTLAB_GATO_COOLDOWN_MS
                    : Math.floor(cooldownMin + Math.random() * (cooldownMax - cooldownMin));

                this._timerGatoVisita = setTimeout(() => {
                    if (this._gatoNegroActivo && cont.isConnected) {
                        ejecutarVisita();
                    }
                }, cooldown);
            };

            // Primera visita con breve retardo inicial
            this._timerGatoVisita = setTimeout(ejecutarVisita, 1200);
        },

        // Efecto decorativo Nieve (Navidad / Invierno)
        iniciarEfectoNieve(contenedor) {
            for (let i = 0; i < 24; i++) {
                const copo = document.createElement('div');
                copo.className = 'particula-nieve';
                copo.style.left = `${Math.random() * 100}%`;
                copo.style.animationDuration = `${4 + Math.random() * 6}s`;
                copo.style.animationDelay = `${Math.random() * 5}s`;
                copo.style.opacity = `${0.3 + Math.random() * 0.7}`;
                copo.style.width = `${4 + Math.random() * 6}px`;
                copo.style.height = copo.style.width;
                contenedor.appendChild(copo);
            }
        },

        // DetenciÃ³n y limpieza de todos los efectos decorativos
        detenerTodosLosEfectos() {
            this.detenerEfectosHalloween();
            this.detenerEfectoGatoNegro();
            const contenedorEfectos = document.getElementById('contenedorEfectosTema');
            if (contenedorEfectos) {
                contenedorEfectos.remove();
            }
        },

        // Renderiza efectos decorativos (soporta mÃºltiples simultÃ¡neos: murciÃ©lagos, gato negro, nieve)
        renderizarEfectos(modo) {
            this.detenerTodosLosEfectos();

            if (this.esModoOBS()) {
                return;
            }

            const efectosActivos = this.obtenerEfectosActivos(modo);
            if (efectosActivos.length === 0) {
                return;
            }

            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            let contenedorEfectos = document.getElementById('contenedorEfectosTema');
            if (!contenedorEfectos) {
                contenedorEfectos = document.createElement('div');
                contenedorEfectos.id = 'contenedorEfectosTema';
                contenedorEfectos.className = 'contenedorEfectosTema';
                contenedorEfectos.setAttribute('aria-hidden', 'true');
                document.body.prepend(contenedorEfectos);
            }

            efectosActivos.forEach(tipo => {
                try {
                    if (tipo === 'nieve') {
                        this.iniciarEfectoNieve(contenedorEfectos);
                    } else if (tipo === 'murcielagos') {
                        this.iniciarEfectosHalloween(contenedorEfectos);
                    } else if (tipo === 'gato_negro') {
                        this.iniciarEfectoGatoNegro();
                    }
                } catch (e) {
                    console.error("Error al iniciar efecto estacional:", tipo, e);
                }
            });
        },

        // Selector Ãºnico de temas para el visitante:
        // Un Ãºnico botÃ³n circular #botonSelectorTemas que muestra el emoji del tema activo
        // y abre el popover #popoverTemas con todos los temas disponibles.
        actualizarControlesVisitante(modoActivo) {
            // Retirar cualquier botÃ³n individual anterior (migraciÃ³n desde sistema anterior)
            document.querySelectorAll('.botonTemaEstacional, .botonTemaSecundario').forEach(b => b.remove());

            // Actualizar el botÃ³n circular si existe
            const btn = document.getElementById('botonSelectorTemas');
            if (btn) {
                const icono = modoActivo?.icono || 'ðŸŽ®';
                btn.setAttribute('aria-label', `Tema activo: ${modoActivo?.nombre || 'Base'}`);
                btn.setAttribute('data-tooltip', `Tema: ${modoActivo?.nombre || 'Base'}`);
                btn.innerHTML = `<span class="icono-tema" style="font-size:1.4rem;line-height:1;">${icono}</span>`;
                btn.classList.toggle('tema-activo', true);
            }

            // Actualizar el popover si estÃ¡ abierto
            this._renderizarPopoverTemas(modoActivo);
        },

        // Obtiene la lista de modos/temas disponibles para selección pública o transmisión según calendario
        obtenerTemasDisponibles(fecha = new Date()) {
            const modos = this.config?.modos || [];
            return modos.filter(m => {
                if (m.activo === false) return false;
                const esEstacional = m.clasificacion === 'estacional' ||
                    (!m.clasificacion && m.calendario?.tipo === 'fechas');
                if (esEstacional) {
                    return this.estaEnRangoAnual(fecha, m.calendario);
                }
                return true;
            });
        },

        esTemaDisponible(idTema, fecha = new Date()) {
            if (!idTema || idTema === 'auto') return true;
            const disponibles = this.obtenerTemasDisponibles(fecha);
            return disponibles.some(m => m.id === idTema);
        },

        // Aplica el tema visual exclusivamente para la transmisión de OBS (sin alterar la web)
        aplicarTemaOBS(idTema, modoDiaNoche) {
            if (!this.config || !this.config.modos) return;

            let modo = null;
            if (!idTema || idTema === 'auto') {
                modo = this.determinarModoActivo();
            } else {
                modo = this.config.modos.find(m => m.id === idTema && m.activo !== false);
                // Si el tema solicitado es estacional y está fuera de temporada, fallback seguro
                if (modo) {
                    const esEstacional = modo.clasificacion === 'estacional' ||
                        (!modo.clasificacion && modo.calendario?.tipo === 'fechas');
                    if (esEstacional && !this.estaEnRangoAnual(new Date(), modo.calendario)) {
                        modo = this.determinarModoActivo();
                    }
                }
            }
            if (!modo) modo = this.config.modos.find(m => m.id === 'base') || this.config.modos[0];
            if (!modo) return;

            if (this.esModoOBS()) {
                this.temaActivo = modo;
            }

            const esDia = (modoDiaNoche === 'dia');

            // 1. Colores de resaltado
            const hexDia = modo.colorResaltadoDia || modo.colorResaltado || '#2ECC71';
            const rgbDia = modo.colorResaltadoDiaRgb || this.hexToRgb(hexDia) || '46, 204, 113';
            const hexNoche = modo.colorResaltadoNoche || modo.colorResaltado || '#2ECC71';
            const rgbNoche = modo.colorResaltadoNocheRgb || this.hexToRgb(hexNoche) || '46, 204, 113';

            const hexActivo = esDia ? hexDia : hexNoche;
            const rgbActivo = esDia ? rgbDia : rgbNoche;

            const root = document.documentElement;
            root.style.setProperty('--color-resaltado', hexActivo);
            root.style.setProperty('--color-resaltado-rgb', rgbActivo);
            root.style.setProperty('--color-resaltado-dia', hexDia);
            root.style.setProperty('--color-resaltado-dia-rgb', rgbDia);
            root.style.setProperty('--color-resaltado-noche', hexNoche);
            root.style.setProperty('--color-resaltado-noche-rgb', rgbNoche);
            root.style.setProperty('--color-barra-carga', hexActivo);

            // 2. Clases tema-<id> en body
            if (this.config && Array.isArray(this.config.modos)) {
                this.config.modos.forEach(m => {
                    document.body.classList.remove('tema-' + m.id);
                });
            }
            document.body.classList.add('tema-' + modo.id);

            // 3. Superficie y scrollbar
            const configFondo = esDia ? (modo.fondoDia || modo.fondoNoche) : (modo.fondoNoche || modo.fondoDia);
            if (configFondo) {
                this.aplicarSuperficieYScrollbar(configFondo, esDia);
                const blurActivo = configFondo.blurVentana !== false;
                root.style.setProperty('--ventana-blur', blurActivo ? '18px' : '0px');
            }
        },

        // Renderiza el contenido del popover de temas (solo temas visibles)
        // - Principal y Secundarios: siempre visibles si activo !== false
        // - Estacionales (y legacy sin clasificacion con tipo fechas): solo en temporada
        // - Varios estacionales en temporada simultanea -> todos aparecen
        // - Solo nombre: sin etiquetas de clasificacion ni estado
        _renderizarPopoverTemas(modoActivo) {
            const lista = document.getElementById('listaTemas');
            if (!lista) return;

            const temaSeleccionado = localStorage.getItem('lotlab_tema_seleccionado');
            const fechaActual = new Date();

            lista.innerHTML = '';

            this.obtenerTemasDisponibles(fechaActual).forEach(modo => {
                const nombrePublico = modo.id === 'rosita' ? 'Dulce' : (modo.nombre || modo.id);
                const esActivo = (modoActivo?.id === modo.id);

                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'opcionModoNav' + (esActivo ? ' activa' : '');
                item.dataset.temaId = modo.id;
                item.innerHTML =
                    '<span class="opcionModoIcono">' + (modo.icono || '\ud83c\udfa8') + '</span>' +
                    '<span class="opcionModoTexto">' + nombrePublico + '</span>';

                item.addEventListener('click', () => {
                    this.modoForzado = null;
                    if (modo.id === modoActivo?.id) {
                        if (temaSeleccionado === modo.id) {
                            localStorage.removeItem('lotlab_tema_seleccionado');
                        }
                    } else {
                        localStorage.setItem('lotlab_tema_seleccionado', modo.id);
                    }
                    const popover = document.getElementById('popoverTemas');
                    if (popover) popover.classList.remove('abierto');
                    const btn = document.getElementById('botonSelectorTemas');
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                    const wrapper = document.getElementById('selectorTemasWrapper');
                    if (wrapper) wrapper.classList.remove('popover-abierto');
                    TemasEstacionales.aplicarTema();
                });

                lista.appendChild(item);
            });
        },


        // Aplica el tema completo (colores, capas, efectos, controles, pantalla de carga)
        aplicarTema() {
            const modo = this.determinarModoActivo();
            if (!modo) return;

            this.temaActivo = modo;
            this.aplicarColores(modo);
            this.renderizarCapas(modo);
            this.renderizarEfectos(modo);
            this.actualizarControlesVisitante(modo);
            this.aplicarRecursosPantallaCarga();
            this.renderizarDockTestingLocal();

            // Notificar sincronización con OBS Viewer
            if (typeof window.emitirEventoOBS === 'function') {
                window.emitirEventoOBS('SYNC_TEMA_WEB', { temaId: modo.id });
            }
        },

        // Respuesta inmediata al alternar modo día/noche
        onCambioModoDiaNoche() {
            if (this.esModoOBS()) {
                if (typeof window.aplicarBrandingOBS === 'function') {
                    window.aplicarBrandingOBS();
                }
                return;
            }
            if (this.temaActivo) {
                this.aplicarColores(this.temaActivo);
                this.renderizarCapas(this.temaActivo);
                this.aplicarRecursosPantallaCarga();
            }
            if (typeof window.emitirEventoOBS === 'function') {
                const esDia = document.body ? document.body.classList.contains('modo-dia') : false;
                window.emitirEventoOBS('SYNC_MODO_DIA_NOCHE', { modoTema: esDia ? 'dia' : 'noche' });
            }
        },

        // Dock de pruebas en local / testing (invisible en producciÃ³n)
        renderizarDockTestingLocal() {
            if (this.esModoOBS()) {
                const dockExistente = document.getElementById('lotlabDockTestTemas');
                if (dockExistente) dockExistente.remove();
                return;
            }

            const esLocal = (window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname === '');
            const activadoEnCMS = localStorage.getItem('lotlab_dev_mostrar_selector_temas') === 'true';

            // Debe estar oculto por defecto.
            // Solo se muestra en entornos locales Y si fue activado explÃ­citamente desde el CMS.
            // En dominios pÃºblicos / producciÃ³n NUNCA se muestra, incluso con parÃ¡metros de URL.
            if (!esLocal || !activadoEnCMS) {
                const dockExistente = document.getElementById('lotlabDockTestTemas');
                if (dockExistente) dockExistente.remove();
                return;
            }

            let dock = document.getElementById('lotlabDockTestTemas');
            if (!dock) {
                dock = document.createElement('div');
                dock.id = 'lotlabDockTestTemas';
                dock.className = 'lotlab-dock-test-temas';
                dock.setAttribute('role', 'region');
                dock.setAttribute('aria-label', 'Control de pruebas local de temas');
                document.body.appendChild(dock);
            }

            const modoActualId = this.temaActivo?.id || 'base';
            const modos = this.config?.modos || CONFIG_PREDETERMINADA.modos;

            let html = `<span class="dock-label" title="Selector local de temas (Dev)">\u{1F9EA} Dev Temas</span>`;
            modos.forEach(m => {
                const esActivo = (this.modoForzado === m.id) ? 'activo' : '';
                html += `<button type="button" class="lotlab-dock-btn ${esActivo}" data-test-tema="${m.id}" title="Forzar tema ${m.nombre}">
                    <span>${m.icono || '\u{1F3A8}'}</span> <span>${m.id.charAt(0).toUpperCase() + m.id.slice(1)}</span>
                </button>`;
            });

            html += `<button type="button" class="lotlab-dock-btn lotlab-dock-btn-reset ${this.modoForzado === null ? 'activo' : ''}" data-test-reset="true" title="Auto: aplica el tema estacional según las fechas del calendario actual">
                <span>\u21BA</span> <span>Auto</span>
            </button>`;

            html += `<button type="button" class="lotlab-dock-btn lotlab-dock-btn-cerrar" data-test-cerrar="true" title="Ocultar selector de pruebas">
                <span>\u2715</span>
            </button>`;

            dock.innerHTML = html;

            dock.querySelectorAll('[data-test-tema]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-test-tema');
                    this.forzarTema(id);
                });
            });

            const btnReset = dock.querySelector('[data-test-reset]');
            if (btnReset) {
                btnReset.addEventListener('click', () => {
                    this.restablecer();
                });
            }

            const btnCerrar = dock.querySelector('[data-test-cerrar]');
            if (btnCerrar) {
                btnCerrar.addEventListener('click', () => {
                    localStorage.setItem('lotlab_dev_mostrar_selector_temas', 'false');
                    dock.remove();
                    if (this.canalTemas) {
                        try { this.canalTemas.postMessage({ tipo: 'LOTLAB_DOCK_PRUEBAS_CERRADO' }); } catch(e) {}
                    }
                    if (window.opener && !window.opener.closed) {
                        try { window.opener.postMessage({ tipo: 'LOTLAB_DOCK_PRUEBAS_CERRADO' }, '*'); } catch(e) {}
                    }
                    if (window.parent && window.parent !== window) {
                        try { window.parent.postMessage({ tipo: 'LOTLAB_DOCK_PRUEBAS_CERRADO' }, '*'); } catch(e) {}
                    }
                });
            }
        },

        // API para CMS Preview y Testing Local
        forzarTema(idTema, modoDiaONoche = null) {
            this.modoForzado = idTema;
            this.modoDiaForzado = modoDiaONoche;
            this.aplicarTema();
        },

        restablecer() {
            this.modoForzado = null;
            this.modoDiaForzado = null;
            this.aplicarTema();
        },

        obtenerTemaActivo() {
            return this.temaActivo;
        },

        // InicializaciÃ³n
        async inicializar() {
            try {
                // Verificar si hay parÃ¡metros de URL para preview
                const urlParams = new URLSearchParams(window.location.search);
                const pTema = urlParams.get('previewTema');
                const pDiaNoche = urlParams.get('previewModo');
                if (pTema) this.modoForzado = pTema;
                if (pDiaNoche) this.modoDiaForzado = pDiaNoche;

                // Cargar configuraciÃ³n de temas
                const response = await fetch('data/settings-temas.json');
                if (response.ok) {
                    this.config = await response.json();
                    try {
                        localStorage.setItem('lotlab_settings_temas_cache', JSON.stringify(this.config));
                    } catch(e) {}
                } else {
                    console.warn('[TemasEstacionales] No se pudo cargar data/settings-temas.json');
                }
            } catch (err) {
                console.warn('[TemasEstacionales] Error cargando settings-temas:', err);
            }

            if (!this.config) {
                this.config = CONFIG_PREDETERMINADA;
            }

            // Aplicar tema inicial
            this.aplicarTema();
            if (this.esModoOBS() && typeof window.aplicarBrandingOBS === 'function') {
                window.aplicarBrandingOBS();
            }
            if (typeof window.actualizarModalOBSUI === 'function') {
                window.actualizarModalOBSUI();
            }

            // Observar cambios en el body únicamente cuando el usuario conmuta día/noche
            if (!this.observerModo && window.MutationObserver && document.body) {
                let ultimoEsDia = document.body.classList.contains('modo-dia');
                this.observerModo = new MutationObserver(() => {
                    const esDia = document.body.classList.contains('modo-dia');
                    if (esDia !== ultimoEsDia) {
                        ultimoEsDia = esDia;
                        if (this.esModoOBS()) {
                            // En OBS el modo día/noche y el tema visual son gestionados exclusivamente por aplicarBrandingOBS
                            return;
                        }
                        if (this.temaActivo) {
                            this.aplicarColores(this.temaActivo);
                            this.renderizarCapas(this.temaActivo);
                            this.aplicarRecursosPantallaCarga();
                        }
                    }
                });
                this.observerModo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            }

            // Canal local (BroadcastChannel) para sincronizaciÃ³n en tiempo real
            if (typeof BroadcastChannel !== 'undefined') {
                try {
                    this.canalTemas = new BroadcastChannel('lotlab_canal_temas');
                    this.canalTemas.addEventListener('message', (event) => {
                        if (!event.data || typeof event.data !== 'object') return;
                        if (event.data.tipo === 'LOTLAB_ACTUALIZAR_DOCK_PRUEBAS') {
                            this.renderizarDockTestingLocal();
                        } else if (event.data.tipo === 'LOTLAB_PREVIEW_TEMA') {
                            if (event.data.temaConfig) {
                                const idx = this.config.modos.findIndex(m => m.id === event.data.temaConfig.id);
                                if (idx >= 0) {
                                    this.config.modos[idx] = event.data.temaConfig;
                                } else {
                                    this.config.modos.push(event.data.temaConfig);
                                }
                            }
                            this.forzarTema(event.data.idTema, event.data.modoDiaONoche);
                        } else if (event.data.tipo === 'LOTLAB_PREVIEW_RESTABLECER') {
                            this.restablecer();
                        }
                    });
                } catch(e) {}
            }

            // Escuchar mensajes de postMessage desde el iframe del CMS (con verificaciÃ³n de origen seguro)
            window.addEventListener('message', (event) => {
                if (!event.data || typeof event.data !== 'object') return;
                const esOrigenSeguro = (
                    event.origin === window.location.origin ||
                    event.origin === 'http://localhost:4000' ||
                    event.origin === 'http://127.0.0.1:4000' ||
                    event.origin === ''
                );
                if (!esOrigenSeguro) return;

                if (event.data.tipo === 'LOTLAB_PREVIEW_TEMA') {
                    if (event.data.temaConfig) {
                        // Actualizar configuraciÃ³n en caliente
                        const idx = this.config.modos.findIndex(m => m.id === event.data.temaConfig.id);
                        if (idx >= 0) {
                            this.config.modos[idx] = event.data.temaConfig;
                        } else {
                            this.config.modos.push(event.data.temaConfig);
                        }
                    }
                    this.forzarTema(event.data.idTema, event.data.modoDiaONoche);
                } else if (event.data.tipo === 'LOTLAB_PREVIEW_RESTABLECER') {
                    this.restablecer();
                } else if (event.data.tipo === 'LOTLAB_ACTUALIZAR_DOCK_PRUEBAS') {
                    this.renderizarDockTestingLocal();
                }
            });

            // Escuchar cambios de localStorage para sincronizar dock dev entre pestaÃ±as
            window.addEventListener('storage', (event) => {
                if (event.key === 'lotlab_dev_mostrar_selector_temas') {
                    this.renderizarDockTestingLocal();
                }
            });

            // â”€â”€ LÃ³gica del selector Ãºnico de temas (popover) â”€â”€
            // Usa la clase .abierto igual que popoverModoNav y popoverSonido
            const iniciarSelectorTemas = () => {
                const btnSelector = document.getElementById('botonSelectorTemas');
                const popoverT    = document.getElementById('popoverTemas');
                if (!btnSelector || !popoverT) return;

                const abrirPopover = () => {
                    TemasEstacionales._renderizarPopoverTemas(TemasEstacionales.temaActivo);
                    popoverT.classList.add('abierto');
                    btnSelector.setAttribute('aria-expanded', 'true');
                    // Elevar z-index del wrapper (igual que selectorModoNavWrapper)
                    const wrapper = document.getElementById('selectorTemasWrapper');
                    if (wrapper) wrapper.classList.add('popover-abierto');
                    // Cerrar otras ventanas emergentes del footer (grupo mutuamente excluyente)
                    document.getElementById('popoverModoNav')?.classList.remove('abierto');
                    document.getElementById('selectorModoNavWrapper')?.classList.remove('popover-abierto');
                    document.getElementById('popoverSonido')?.classList.remove('abierto');
                    document.getElementById('controlSonidoWrapper')?.classList.remove('popover-abierto');
                    document.getElementById('listaIdiomas')?.classList.remove('abierta');
                };
                const cerrarPopover = () => {
                    popoverT.classList.remove('abierto');
                    btnSelector.setAttribute('aria-expanded', 'false');
                    const wrapper = document.getElementById('selectorTemasWrapper');
                    if (wrapper) wrapper.classList.remove('popover-abierto');
                };

                btnSelector.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (popoverT.classList.contains('abierto')) {
                        cerrarPopover();
                    } else {
                        abrirPopover();
                    }
                });

                // Cerrar al hacer clic fuera
                document.addEventListener('click', (e) => {
                    if (popoverT.classList.contains('abierto') &&
                        !popoverT.contains(e.target) &&
                        e.target !== btnSelector &&
                        !btnSelector.contains(e.target)) {
                        cerrarPopover();
                    }
                });

                // Cerrar con Escape
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') cerrarPopover();
                });
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', iniciarSelectorTemas);
            } else {
                iniciarSelectorTemas();
            }
        }
    };

    window.TemasEstacionales = TemasEstacionales;
    window.lotlabForzarTema = (id, modoDiaONoche = null) => TemasEstacionales.forzarTema(id, modoDiaONoche);
    window.lotlabRestablecerTema = () => TemasEstacionales.restablecer();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TemasEstacionales.inicializar());
    } else {
        TemasEstacionales.inicializar();
    }
})();
