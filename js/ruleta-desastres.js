/* =========================================================
   RULETA DE DESASTRES
   Arquitectura modular para la generación de imprevistos
   y eventos aleatorios durante los retos de construcción.
   ========================================================= */

// --- 1. MÓDULOS DE DESASTRES (Extensible) ---
const ModulosDesastres = {
    perdidaDinero: {
        id: "perdidaDinero",
        nombre: "💰 Pérdida de presupuesto",
        icono: "💰",
        configurable: true,
        generar: function (config) {
            const min = Math.max(100, parseInt(config.dineroMin, 10) || 5000);
            const max = Math.max(min, parseInt(config.dineroMax, 10) || 25000);
            const cantidad = Math.floor(Math.random() * (max - min + 1)) + min;
            return {
                titulo: "Pérdida de Presupuesto",
                descripcion: `Pierdes ${cantidad.toLocaleString("es-ES")} § de tu presupuesto.`,
                detalle: "Reduce esa cantidad inmediatamente del dinero disponible."
            };
        }
    },

    gananciaDinero: {
        id: "gananciaDinero",
        nombre: "💰 Ganancia de presupuesto",
        icono: "💵",
        configurable: true,
        generar: function (config) {
            const min = Math.max(100, parseInt(config.dineroMin, 10) || 5000);
            const max = Math.max(min, parseInt(config.dineroMax, 10) || 25000);
            const cantidad = Math.floor(Math.random() * (max - min + 1)) + min;
            return {
                titulo: "Ganancia de Presupuesto",
                descripcion: `¡Ganas ${cantidad.toLocaleString("es-ES")} § adicionales!`,
                detalle: "Añade esta cantidad a tu presupuesto de construcción."
            };
        }
    },

    cambiarColor: {
        id: "cambiarColor",
        nombre: "🎨 Cambiar colores permitidos",
        icono: "🎨",
        generar: function () {
            const colores = (typeof obtenerColoresRuleta === "function") 
                ? obtenerColoresRuleta() 
                : ["Blanco", "Negro", "Gris", "Marrón", "Rojo", "Azul", "Verde", "Amarillo", "Rosa", "Morado", "Naranja", "Turquesa", "Madera clara", "Madera oscura"];
            
            const colorElegido = colores[Math.floor(Math.random() * colores.length)];
            const modoAccion = Math.random() > 0.5 ? "sustituir" : "añadir";

            if (modoAccion === "sustituir") {
                return {
                    titulo: "Cambio de Paleta",
                    descripcion: `Sustituye uno de tus colores actuales por: ${colorElegido}.`,
                    detalle: "Elige uno de tus colores previos y cámbialo obligatoriamente por este."
                };
            } else {
                return {
                    titulo: "Nuevo Color Añadido",
                    descripcion: `Añade un nuevo color a tu paleta: ${colorElegido}.`,
                    detalle: "A partir de ahora debes incorporar este color en la construcción."
                };
            }
        }
    },

    estiloArquitectonico: {
        id: "estiloArquitectonico",
        nombre: "🏛 Cambiar estilo arquitectónico",
        icono: "🏛",
        generar: function () {
            let estilo = "Moderno";
            if (typeof database !== "undefined" && database.estilosArquitectonicos && database.estilosArquitectonicos.length > 0) {
                const lista = database.estilosArquitectonicos;
                const fila = lista[Math.floor(Math.random() * lista.length)];
                estilo = (Array.isArray(fila) ? fila[0] : fila) || "Moderno";
            }
            return {
                titulo: "Nuevo Estilo Arquitectónico",
                descripcion: `Debes adaptar el estilo exterior a: ${estilo}.`,
                detalle: "Modifica la fachada y estructura para reflejar este estilo."
            };
        }
    },

    estiloInterior: {
        id: "estiloInterior",
        nombre: "🛋 Cambiar estilo interior",
        icono: "🛋",
        generar: function () {
            let estilo = "Industrial";
            if (typeof database !== "undefined" && database.estilosDecoracion && database.estilosDecoracion.length > 0) {
                const lista = database.estilosDecoracion;
                const fila = lista[Math.floor(Math.random() * lista.length)];
                estilo = (Array.isArray(fila) ? fila[0] : fila) || "Industrial";
            }
            return {
                titulo: "Nuevo Estilo Interior",
                descripcion: `Debes redecorar el interior al estilo: ${estilo}.`,
                detalle: "Cambia muebles y decoración para encajar con el nuevo estilo."
            };
        }
    },

    anadirHabitacion: {
        id: "anadirHabitacion",
        nombre: "🏡 Añadir una habitación",
        icono: "🏡",
        generar: function () {
            const habitaciones = [
                "un despacho / oficina",
                "una terraza o balcón",
                "un gimnasio doméstico",
                "un solárium o jardín de invierno",
                "una piscina (interior o exterior)",
                "un lavadero / cuarto de colada",
                "un baño de visitas extra",
                "una sala de juegos o cine",
                "un estudio de arte / música",
                "un sótano o bodega"
            ];
            const elegida = habitaciones[Math.floor(Math.random() * habitaciones.length)];
            return {
                titulo: "Añadir Habitación",
                descripcion: `Debes añadir: ${elegida}.`,
                detalle: "Crea este espacio obligatoriamente en tu lote."
            };
        }
    },

    eliminarHabitacion: {
        id: "eliminarHabitacion",
        nombre: "❌ Eliminar una habitación",
        icono: "❌",
        generar: function () {
            const habitaciones = [
                "un dormitorio",
                "el comedor (o fusionarlo con la cocina)",
                "un cuarto de baño",
                "el recibidor / hall de entrada",
                "la terraza o porche",
                "la sala de estar secundaria",
                "el garaje / trastero"
            ];
            const elegida = habitaciones[Math.floor(Math.random() * habitaciones.length)];
            return {
                titulo: "Eliminar Habitación",
                descripcion: `Debes eliminar o demoler: ${elegida}.`,
                detalle: "Borra esta habitación y reorganiza el espacio restante."
            };
        }
    },

    restringirPacks: {
        id: "restringirPacks",
        nombre: "📦 Restringir packs",
        icono: "📦",
        generar: function () {
            let packProhibido = "Día de Spa";
            let packsDisponibles = [];

            const esJuegoBase = (nombre) => {
                if (!nombre) return true;
                const n = nombre.toLowerCase().trim();
                return n.includes("juego base") || n.includes("base game") || n === "los sims 4" || n === "sims 4";
            };

            // 1. Intentar obtener los packs seleccionados por el usuario (excluyendo Sims 4 / Juego Base)
            if (typeof obtenerPacksSeleccionadosUsuario === "function") {
                const seleccionados = obtenerPacksSeleccionadosUsuario();
                if (Array.isArray(seleccionados)) {
                    packsDisponibles = seleccionados.filter(p => p && !esJuegoBase(p));
                }
            }

            // 2. Si no hay packs seleccionados por el usuario o solo tiene Juego Base, recurrir a la base de datos global de packs
            if (packsDisponibles.length === 0 && typeof database !== "undefined" && database.packs && Array.isArray(database.packs)) {
                database.packs.forEach(fila => {
                    for (let i = 0; i < fila.length; i += 2) {
                        if (fila[i] && fila[i].trim() && !esJuegoBase(fila[i])) {
                            packsDisponibles.push(fila[i].trim());
                        }
                    }
                });
            }

            if (packsDisponibles.length > 0) {
                packProhibido = packsDisponibles[Math.floor(Math.random() * packsDisponibles.length)];
                const ruta = typeof rutaIconoPack === "function" ? rutaIconoPack(packProhibido) : null;
                const iconoHTML = ruta 
                    ? `<img src="${ruta}" alt="${packProhibido}" class="iconoPackResultado" style="width: 64px; height: 64px; object-fit: contain;">`
                    : "📦";

                return {
                    titulo: "Pack Prohibido",
                    iconoHTML: iconoHTML,
                    descripcion: `No puedes utilizar ningún objeto del pack: <strong>${packProhibido}</strong>.`,
                    detalle: "Si ya has usado objetos de este pack, debes eliminarlos."
                };
            } else {
                return {
                    titulo: "Sin Packs Para Restringir",
                    descripcion: "Solo dispones del Juego Base o no hay packs adicionales seleccionados.",
                    detalle: "No se aplica restricción de packs en esta tirada."
                };
            }
        }
    },

    reducirTiempo: {
        id: "reducirTiempo",
        nombre: "⏱ Reducir tiempo",
        icono: "⏱",
        generar: function () {
            const minutosRestar = [3, 5, 10, 15][Math.floor(Math.random() * 4)];
            return {
                titulo: "Tiempo Reducido",
                descripcion: `¡Pérdida de tiempo! Resta ${minutosRestar} minutos al temporizador.`,
                detalle: "Si estás usando el Temporizador de Retos, reduce esa cantidad del tiempo restante."
            };
        }
    },

    cambiarObjetivo: {
        id: "cambiarObjetivo",
        nombre: "🎯 Cambiar objetivo",
        icono: "🎯",
        generar: function () {
            let nuevoObj = "Construir una casa ecológica y autosuficiente";
            if (typeof database !== "undefined" && database.objetivos && database.objetivos.length > 0) {
                const fila = database.objetivos[Math.floor(Math.random() * database.objetivos.length)];
                nuevoObj = (Array.isArray(fila) ? fila[0] : fila) || nuevoObj;
            }
            return {
                titulo: "Nuevo Objetivo Principal",
                descripcion: `Tu nuevo objetivo es: ${nuevoObj}.`,
                detalle: "Adapta la construcción para cumplir con esta nueva meta."
            };
        }
    },

    eventosEspeciales: {
        id: "eventosEspeciales",
        nombre: "🎲 Eventos especiales",
        icono: "🎲",
        generar: function () {
            const especiales = [
                "Construye una habitación completamente negra (paredes, suelos y muebles).",
                "Todas las puertas de la casa deben ser del mismo modelo exacto.",
                "¡Prohibido ventanas! No puedes colocar ninguna ventana durante el resto del reto.",
                "Todas las lámparas e iluminación deben ser del mismo modelo.",
                "Todos los baños deben tener grifería y accesorios dorados.",
                "La puerta de entrada principal debe colocarse en la segunda planta.",
                "Toda la casa debe tener tejado plano o ajardinado.",
                "Debes colocar al menos 5 plantas en cada habitación de la casa.",
                "No puedes usar paredes rectas en al menos una habitación (usa diagonales).",
                "Toda la madera de la casa debe ser del mismo tono."
            ];
            const evento = especiales[Math.floor(Math.random() * especiales.length)];
            return {
                titulo: "Evento Especial Sorpresa",
                descripcion: evento,
                detalle: "Aplica esta regla especial inmediatamente a tu partida."
            };
        }
    },

    habilidadRequerida: {
        id: "habilidadRequerida",
        nombre: "🧠 Requisito de habilidad",
        icono: "🧠",
        generar: function () {
            let habilidad = "Cocina";
            let packReq = "Juego Base";
            let idImg = "";

            if (typeof database !== "undefined" && database.habilidades && database.habilidades.length > 0) {
                const packsUsuario = typeof obtenerPacksSeleccionadosUsuario === "function"
                    ? obtenerPacksSeleccionadosUsuario().map(p => p.trim().toLowerCase())
                    : [];

                const disponibles = database.habilidades.filter(fila => {
                    const req = (fila[1] || "").trim().toLowerCase();
                    if (!req || req === "base" || req.includes("juego base") || req === "-" || req === "") return true;
                    if (packsUsuario.length === 0) return true;
                    return packsUsuario.some(p => p.includes(req) || req.includes(p));
                });

                if (disponibles.length > 0) {
                    const fila = disponibles[Math.floor(Math.random() * disponibles.length)];
                    habilidad = (fila[0] || "").trim();
                    packReq = (fila[1] || "Juego Base").trim();
                    idImg = (fila[2] || "").trim();
                }
            }

            const imgSrc = idImg ? "img/Habilidades/" + idImg + ".png" : "";

            return {
                titulo: "Requisito de Habilidad",
                descripcion: `Debes añadir en tu solar un rincón / espacio preparado para practicar la habilidad: <strong>${habilidad}</strong> (${packReq}).`,
                detalle: "Añade los objetos necesarios para que un Sim pueda desarrollar esta habilidad.",
                iconoHTML: imgSrc ? `<img src="${imgSrc}" alt="${habilidad}" style="width:52px;height:52px;object-fit:contain;">` : null
            };
        }
    }
};

// --- 2. GESTOR CENTRAL DE LA RULETA DE DESASTRES ---
let ruletaDesastresInterval = null;
let ruletaDesastresTiempoRestante = 0;
let enPeriodoPausa = false;
let temporizadorPausado = false;
let tiradasRealizadas = 0;
let ruletaDesastresHistorial = [];

const EstadoRuletaDesastres = {
    modo: "manual", // "manual" | "auto"
    intervaloMinutos: 5,
    pausaMinutos: 1, // 1 a 5 minutos
    tiradasAutoMax: 0, // 0 = ilimitadas
    dineroMin: 5000,
    dineroMax: 25000,
    categoriasActivas: {}
};

// Inicializar todas las categorías como activas por defecto
Object.keys(ModulosDesastres).forEach(catId => {
    EstadoRuletaDesastres.categoriasActivas[catId] = true;
});

document.addEventListener("DOMContentLoaded", () => {
    inicializarUIRuletaDesastres();
});

function inicializarUIRuletaDesastres() {
    const btnComenzar = document.getElementById("btnComenzarRuletaDesastres");
    const btnGirar = document.getElementById("btnGirarRuletaDesastres");
    const btnConfig = document.getElementById("btnConfigRuletaDesastres");
    const btnLimpiarHistorial = document.getElementById("btnLimpiarHistorialDesastres");
    const btnToggleTemp = document.getElementById("toggleTemporizadorRuletaBtn");
    const btnVolverPacksConfig = document.getElementById("btnVolverPacksDesdeRuletaConfig");
    const btnVolverPacksJuego = document.getElementById("btnVolverPacksDesdeRuletaJuego");
    const btnToggleTodos = document.getElementById("btnToggleTodosDesastres");
    const btnPausarReanudar = document.getElementById("btnPausarReanudarRuleta");

    if (btnComenzar) btnComenzar.addEventListener("click", comenzarRuletaDesastres);
    if (btnGirar) btnGirar.addEventListener("click", () => ejecutarGiroDesastre(true));
    if (btnConfig) btnConfig.addEventListener("click", mostrarPantallaConfiguracionDesastres);
    if (btnLimpiarHistorial) btnLimpiarHistorial.addEventListener("click", limpiarHistorialDesastres);
    if (btnToggleTemp) {
        btnToggleTemp.addEventListener("click", () => {
            if (typeof toggleTemporizadorReto === "function") toggleTemporizadorReto();
        });
    }

    const irASelectorPacks = () => {
        window.proximaVentanaTrasPacks = "ventanaRuletaDesastres";
        if (typeof abrirVentana === "function") abrirVentana("ventanaRetos", true);
    };
    if (btnVolverPacksConfig) btnVolverPacksConfig.addEventListener("click", irASelectorPacks);
    if (btnVolverPacksJuego) btnVolverPacksJuego.addEventListener("click", irASelectorPacks);

    if (btnToggleTodos) btnToggleTodos.addEventListener("click", alternarTodasCategoriasDesastres);
    if (btnPausarReanudar) btnPausarReanudar.addEventListener("click", togglePausaReanudarRuletaDesastres);

    // Manejo de cambio de modo (Manual / Auto)
    const radioManual = document.getElementById("modoManualRuletaDesastres");
    const radioAuto = document.getElementById("modoAutoRuletaDesastres");
    if (radioManual) radioManual.addEventListener("change", actualizarVisibilidadModoAuto);
    if (radioAuto) radioAuto.addEventListener("change", actualizarVisibilidadModoAuto);

    // Inputs min/max dinero e intervalo con la rueda del ratón
    ["inputDesastreDineroMin", "inputDesastreDineroMax", "inputDesastreIntervalo", "inputDesastrePausa", "inputDesastreTiradasAuto"].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("wheel", (e) => {
                e.preventDefault();
                let val = parseInt(input.value, 10) || 0;
                const step = (id === "inputDesastreIntervalo" || id === "inputDesastrePausa" || id === "inputDesastreTiradasAuto") ? 1 : 1000;
                val += e.deltaY < 0 ? step : -step;
                const min = parseInt(input.min, 10) || 0;
                const max = parseInt(input.max, 10) || 1000000;
                if (val < min) val = min;
                if (val > max) val = max;
                input.value = val;
            });
        }
    });

    renderizarBotonesCategorias();
    actualizarVisibilidadModoAuto();
    actualizarVisibilidadSeccionDinero();
}

function alternarTodasCategoriasDesastres() {
    const keys = Object.keys(ModulosDesastres);
    const todasActivas = keys.every(catId => EstadoRuletaDesastres.categoriasActivas[catId] !== false);
    const nuevoEstado = !todasActivas;

    keys.forEach(catId => {
        EstadoRuletaDesastres.categoriasActivas[catId] = nuevoEstado;
    });

    renderizarBotonesCategorias();
}

// Muestra u oculta las opciones del modo automático (intervalo, pausa y tiradas)
function actualizarVisibilidadModoAuto() {
    const radioAuto = document.getElementById("modoAutoRuletaDesastres");
    const opcionesAuto = document.getElementById("opcionesModoAutoDesastres");
    if (!opcionesAuto) return;

    if (radioAuto && radioAuto.checked) {
        opcionesAuto.style.display = "flex";
    } else {
        opcionesAuto.style.display = "none";
    }
}

// Muestra u oculta la sección de rango para desastres financieros según si está activa la pérdida o ganancia de dinero
function actualizarVisibilidadSeccionDinero() {
    const seccionDinero = document.getElementById("seccionDineroDesastres");
    if (!seccionDinero) return;

    const hayDineroActivo = !!(
        EstadoRuletaDesastres.categoriasActivas["perdidaDinero"] ||
        EstadoRuletaDesastres.categoriasActivas["gananciaDinero"]
    );

    seccionDinero.style.display = hayDineroActivo ? "block" : "none";
}

// Renderiza los botones estilo toggle para las categorías (resaltados en verde al activarse)
function renderizarBotonesCategorias() {
    const contenedor = document.getElementById("contenedorCheckboxesDesastres");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    Object.values(ModulosDesastres).forEach(mod => {
        const btnToggle = document.createElement("button");
        btnToggle.type = "button";
        const estaActivo = EstadoRuletaDesastres.categoriasActivas[mod.id] !== false;
        
        btnToggle.className = `botonDesastreToggle ${estaActivo ? "activo" : ""}`;
        btnToggle.dataset.catId = mod.id;

        btnToggle.innerHTML = `
            <span class="iconoDesastre">${mod.icono}</span>
            <span class="nombreDesastre">${mod.nombre}</span>
        `;

        btnToggle.addEventListener("click", () => {
            const nuevoEstado = !EstadoRuletaDesastres.categoriasActivas[mod.id];
            EstadoRuletaDesastres.categoriasActivas[mod.id] = nuevoEstado;
            if (nuevoEstado) {
                btnToggle.classList.add("activo");
            } else {
                btnToggle.classList.remove("activo");
            }
            actualizarVisibilidadSeccionDinero();
        });

        contenedor.appendChild(btnToggle);
    });

    actualizarVisibilidadSeccionDinero();
}

function comenzarRuletaDesastres() {
    const activas = Object.keys(EstadoRuletaDesastres.categoriasActivas).filter(id => EstadoRuletaDesastres.categoriasActivas[id]);
    if (activas.length === 0) {
        alert("Por favor, activa al menos una categoría de desastres.");
        return;
    }

    const radioModoAuto = document.getElementById("modoAutoRuletaDesastres");
    EstadoRuletaDesastres.modo = radioModoAuto && radioModoAuto.checked ? "auto" : "manual";

    const inputMin = document.getElementById("inputDesastreDineroMin");
    const inputMax = document.getElementById("inputDesastreDineroMax");
    const inputInt = document.getElementById("inputDesastreIntervalo");
    const inputPausa = document.getElementById("inputDesastrePausa");
    const inputTir = document.getElementById("inputDesastreTiradasAuto");

    if (inputMin) EstadoRuletaDesastres.dineroMin = Math.max(100, parseInt(inputMin.value, 10) || 5000);
    if (inputMax) EstadoRuletaDesastres.dineroMax = Math.max(EstadoRuletaDesastres.dineroMin, parseInt(inputMax.value, 10) || 25000);
    if (inputInt) EstadoRuletaDesastres.intervaloMinutos = Math.max(1, parseInt(inputInt.value, 10) || 5);
    if (inputPausa) EstadoRuletaDesastres.pausaMinutos = Math.max(1, Math.min(5, parseInt(inputPausa.value, 10) || 1));
    if (inputTir) EstadoRuletaDesastres.tiradasAutoMax = Math.max(0, parseInt(inputTir.value, 10) || 0);

    const pantallaConfig = document.getElementById("pantallaConfigRuletaDesastres");
    const pantallaJuego = document.getElementById("pantallaJuegoRuletaDesastres");

    if (pantallaConfig) pantallaConfig.style.display = "none";
    if (pantallaJuego) pantallaJuego.style.display = "block";

    if (ruletaDesastresInterval) clearInterval(ruletaDesastresInterval);

    const divCuentaAtras = document.getElementById("divCuentaAtrasRuletaDesastres");
    const btnPausarReanudar = document.getElementById("btnPausarReanudarRuleta");

    if (EstadoRuletaDesastres.modo === "auto") {
        if (divCuentaAtras) divCuentaAtras.style.display = "flex";
        if (btnPausarReanudar) btnPausarReanudar.style.display = "inline-block";
        iniciarTemporizadorAutoDesastres();
    } else {
        if (divCuentaAtras) divCuentaAtras.style.display = "none";
        if (btnPausarReanudar) btnPausarReanudar.style.display = "none";
    }
}

function mostrarPantallaConfiguracionDesastres() {
    if (ruletaDesastresInterval) clearInterval(ruletaDesastresInterval);

    const pantallaConfig = document.getElementById("pantallaConfigRuletaDesastres");
    const pantallaJuego = document.getElementById("pantallaJuegoRuletaDesastres");
    const btnPausarReanudar = document.getElementById("btnPausarReanudarRuleta");

    if (pantallaConfig) pantallaConfig.style.display = "block";
    if (pantallaJuego) pantallaJuego.style.display = "none";
    if (btnPausarReanudar) btnPausarReanudar.style.display = "none";
}

function togglePausaReanudarRuletaDesastres() {
    const btn = document.getElementById("btnPausarReanudarRuleta");
    const displayTimer = document.getElementById("displayCuentaAtrasDesastres");
    const divTimer = document.getElementById("divCuentaAtrasRuletaDesastres");
    if (!btn) return;

    temporizadorPausado = !temporizadorPausado;
    if (temporizadorPausado) {
        btn.innerHTML = "▶️ Reanudar";
        btn.style.background = "#e67e22";
        if (displayTimer) displayTimer.style.color = "#e67e22";
        if (divTimer) divTimer.classList.add("pausado");
        actualizarLabelEstadoTimer(enPeriodoPausa ? "⏳ Margen de pausa (Pausado)" : "⏸️ Temporizador en pausa");
    } else {
        btn.innerHTML = "⏸️ Pausar";
        btn.style.background = "";
        if (displayTimer) displayTimer.style.color = "";
        if (divTimer) divTimer.classList.remove("pausado");
        actualizarLabelEstadoTimer(enPeriodoPausa ? `⏳ Margen de pausa (${EstadoRuletaDesastres.pausaMinutos} min):` : "Siguiente desastre en:");
    }
}

function iniciarTemporizadorAutoDesastres() {
    enPeriodoPausa = false;
    temporizadorPausado = false;
    tiradasRealizadas = 0;
    ruletaDesastresTiempoRestante = EstadoRuletaDesastres.intervaloMinutos * 60;
    
    const btnPausarReanudar = document.getElementById("btnPausarReanudarRuleta");
    const displayTimer = document.getElementById("displayCuentaAtrasDesastres");
    const divTimer = document.getElementById("divCuentaAtrasRuletaDesastres");
    if (btnPausarReanudar) {
        btnPausarReanudar.innerHTML = "⏸️ Pausar";
        btnPausarReanudar.style.background = "";
    }
    if (displayTimer) displayTimer.style.color = "";
    if (divTimer) divTimer.classList.remove("pausado");

    actualizarLabelEstadoTimer("Siguiente desastre en:");
    actualizarDisplayCuentaAtrasDesastres();

    ruletaDesastresInterval = setInterval(() => {
        if (temporizadorPausado) return;

        ruletaDesastresTiempoRestante--;
        actualizarDisplayCuentaAtrasDesastres();

        if (ruletaDesastresTiempoRestante <= 0) {
            if (!enPeriodoPausa) {
                // 1. Ejecutar desastre y reproducir alarma sonora
                sonarAlarmaDesastre();
                ejecutarGiroDesastre(false);
                tiradasRealizadas++;

                // 2. Comprobar si se ha alcanzado el límite de tiradas automáticas
                if (EstadoRuletaDesastres.tiradasAutoMax > 0 && tiradasRealizadas >= EstadoRuletaDesastres.tiradasAutoMax) {
                    clearInterval(ruletaDesastresInterval);
                    sonarFanfarriaFinTiradas();
                    actualizarLabelEstadoTimer("✅ Tiradas completadas");
                    const display = document.getElementById("displayCuentaAtrasDesastres");
                    if (display) display.textContent = "FIN";
                    if (btnPausarReanudar) btnPausarReanudar.style.display = "none";
                    return;
                }

                // 3. Entrar en TIEMPO DE PAUSA CONFIGURADO (de 1 a 5 min) antes del siguiente ciclo
                enPeriodoPausa = true;
                ruletaDesastresTiempoRestante = EstadoRuletaDesastres.pausaMinutos * 60;
                actualizarLabelEstadoTimer(`⏳ Margen de pausa (${EstadoRuletaDesastres.pausaMinutos} min):`);
            } else {
                // 4. Finalizar tiempo de pausa -> arrancar nuevo ciclo de intervalo
                enPeriodoPausa = false;
                ruletaDesastresTiempoRestante = EstadoRuletaDesastres.intervaloMinutos * 60;
                actualizarLabelEstadoTimer("Siguiente desastre en:");
            }
        }
    }, 1000);
}

function actualizarLabelEstadoTimer(texto) {
    const lbl = document.getElementById("labelEstadoCuentaAtrasDesastres");
    if (lbl) lbl.textContent = texto;
}

function actualizarDisplayCuentaAtrasDesastres() {
    const display = document.getElementById("displayCuentaAtrasDesastres");
    if (!display) return;
    const min = Math.floor(ruletaDesastresTiempoRestante / 60);
    const seg = ruletaDesastresTiempoRestante % 60;
    const fMin = min < 10 ? "0" + min : min;
    const fSeg = seg < 10 ? "0" + seg : seg;
    display.textContent = `${fMin}:${fSeg}`;
}

// Alarma sonora del desastre (Web Audio API)
function sonarAlarmaDesastre() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const pitidos = [0, 0.35, 0.70];
        pitidos.forEach(inicio => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime + inicio);
            osc.frequency.setValueAtTime(1046, ctx.currentTime + inicio + 0.1);

            gain.gain.setValueAtTime(0, ctx.currentTime + inicio);
            gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + inicio + 0.02);
            gain.gain.setValueAtTime(0.4, ctx.currentTime + inicio + 0.20);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + inicio + 0.28);

            osc.start(ctx.currentTime + inicio);
            osc.stop(ctx.currentTime + inicio + 0.30);
        });
    } catch (e) { }
}

// Sonido especial DIFERENTE para indicar la finalización de todas las tiradas automáticas (Fanfarria arpegiada)
function sonarFanfarriaFinTiradas() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // 4 notas ascendentes (Do5, Mi5, Sol5, Do6)
        const notas = [
            { f: 523.25, t: 0 },
            { f: 659.25, t: 0.18 },
            { f: 783.99, t: 0.36 },
            { f: 1046.50, t: 0.54 }
        ];

        notas.forEach(nota => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "triangle";
            osc.frequency.setValueAtTime(nota.f, ctx.currentTime + nota.t);

            const duracion = nota.f === 1046.50 ? 0.6 : 0.22;
            gain.gain.setValueAtTime(0, ctx.currentTime + nota.t);
            gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + nota.t + 0.03);
            gain.gain.setValueAtTime(0.4, ctx.currentTime + nota.t + duracion - 0.05);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + nota.t + duracion);

            osc.start(ctx.currentTime + nota.t);
            osc.stop(ctx.currentTime + nota.t + duracion);
        });
    } catch (e) { }
}

// Ejecuta un giro de la ruleta de desastres
function ejecutarGiroDesastre(esManual) {
    const activasKeys = Object.keys(EstadoRuletaDesastres.categoriasActivas).filter(id => EstadoRuletaDesastres.categoriasActivas[id]);
    if (activasKeys.length === 0) return;

    // Seleccionar módulo al azar
    const modId = activasKeys[Math.floor(Math.random() * activasKeys.length)];
    const modulo = ModulosDesastres[modId];
    if (!modulo) return;

    const resultado = modulo.generar(EstadoRuletaDesastres);

    // Animación visual de tarjeta
    const cardRes = document.getElementById("tarjetaResultadoDesastre");
    if (cardRes) {
        cardRes.classList.add("animarGiroDesastre");
        setTimeout(() => {
            const containerIcono = document.getElementById("iconoResultadoDesastre");
            if (containerIcono) {
                if (resultado.iconoHTML) {
                    containerIcono.innerHTML = resultado.iconoHTML;
                } else {
                    containerIcono.textContent = modulo.icono;
                }
            }
            document.getElementById("tituloResultadoDesastre").textContent = resultado.titulo;
            document.getElementById("descResultadoDesastre").innerHTML = resultado.descripcion;
            document.getElementById("detalleResultadoDesastre").textContent = resultado.detalle || "";
            cardRes.classList.remove("animarGiroDesastre");
        }, 200);
    }

    // Registrar en el historial
    const ahora = new Date();
    const horaFmt = ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    
    ruletaDesastresHistorial.unshift({
        hora: horaFmt,
        icono: modulo.icono,
        iconoHTML: resultado.iconoHTML || null,
        descripcion: resultado.descripcion
    });

    renderizarHistorialDesastres();
}

function renderizarHistorialDesastres() {
    const listaHist = document.getElementById("listaHistorialDesastres");
    if (!listaHist) return;

    if (ruletaDesastresHistorial.length === 0) {
        listaHist.innerHTML = '<div class="historialVacio">Aún no ha ocurrido ningún desastre. ¡Gira la ruleta!</div>';
        return;
    }

    listaHist.innerHTML = ruletaDesastresHistorial.map(item => `
        <div class="itemHistorialDesastre">
            <span class="horaHistorial">${item.hora}</span>
            <span class="iconoHistorial">${item.iconoHTML || item.icono}</span>
            <span class="textoHistorial">${item.descripcion}</span>
        </div>
    `).join("");
}

function limpiarHistorialDesastres() {
    ruletaDesastresHistorial = [];
    renderizarHistorialDesastres();
}
