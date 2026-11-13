/*
=========================================================
SONIDO
Gestiona el sistema de sonido jerárquico de LOT-LAB:
  - 🔊 Sonido Maestro: control global absoluto ('silencioGlobal').
  - 🖱️ Sonidos de Interfaz: hover, clics, navegación, ruletas ('silencioInterfaz').
  - ⏰ Sonidos de Alertas: temporizador, alarmas ('silencioAlertas').
  - 🎮 Sonidos de Minijuegos: aciertos y errores ('silencioMinijuegos').
  - Único AudioContext propiedad de LOT-LAB para micro-sonidos.
  - SIN interceptar AudioContext ni HTMLMediaElement ajenos.
  - Modo OBS: silenciado por defecto para la transmisión.
  - Micro-sonidos sintéticos en tiempo real con cooldown.
  - Los controles secundarios son 100% interactivos con Maestro OFF.
  - Sincronización multi-pestaña mediante 'storage'.
=========================================================
*/

(function () {
    // ── Detección de Modo OBS ──
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    const isObsMode = urlParams.get('obs') === '1' || hashParams.get('obs') === '1';

    // ── Estado inicial ──
    // En OBS siempre silenciado por defecto para que la fuente de navegador no emita ruidos no deseados
    let silenciado = isObsMode ? true : (localStorage.getItem('silencioGlobal') === 'true');
    let silencioInterfaz = localStorage.getItem('silencioInterfaz') === 'true';
    let silencioAlertas = localStorage.getItem('silencioAlertas') === 'true';
    let silencioMinijuegos = localStorage.getItem('silencioMinijuegos') === 'true';

    // ── Único AudioContext propiedad exclusiva de LOT-LAB ──
    let audioCtxLotLab = null;

    function obtenerAudioContextLotLab() {
        if (isObsMode) return null;
        const AudioContextCls = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCls) return null;

        if (!audioCtxLotLab || audioCtxLotLab.state === 'closed') {
            try {
                audioCtxLotLab = new AudioContextCls();
            } catch (e) {
                return null;
            }
        }

        if (audioCtxLotLab && audioCtxLotLab.state === 'suspended' && !silenciado) {
            audioCtxLotLab.resume().catch(() => {});
        }

        return audioCtxLotLab;
    }

    // Desbloqueo seguro del AudioContext propio ante cualquier interacción del usuario
    const desbloquearAudioLotLab = () => {
        const ctx = obtenerAudioContextLotLab();
        if (ctx && ctx.state === 'suspended' && !silenciado) {
            ctx.resume().catch(() => {});
        }
    };
    document.addEventListener('pointerdown', desbloquearAudioLotLab, { capture: true });
    document.addEventListener('keydown', desbloquearAudioLotLab, { capture: true });

    // ── Síntesis de Micro-sonidos de Interfaz (Web Audio API con contexto propio) ──
    let ultimoHover = 0;

    function reproducirSonidoUI(tipo) {
        if (isObsMode || silenciado || silencioInterfaz) return;
        try {
            const ctx = obtenerAudioContextLotLab();
            if (!ctx) return;

            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            if (tipo === 'hover') {
                const ahora = Date.now();
                if (ahora - ultimoHover < 90) return; // Cooldown anti-ráfagas
                ultimoHover = ahora;

                // Sonido "pup": blip sutil con modulación rápida y rampa suave
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(460, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.02);
                gain.gain.setValueAtTime(0.09, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.038);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.04);
            } else if (tipo === 'click') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(820, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.025);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.035);
            } else if (tipo === 'apertura') {
                const notas = [523.25, 659.25]; // Do5, Mi5
                notas.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    const inicio = ctx.currentTime + i * 0.028;
                    osc.frequency.setValueAtTime(freq, inicio);
                    gain.gain.setValueAtTime(0.08, inicio);
                    gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.055);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(inicio);
                    osc.stop(inicio + 0.06);
                });
            } else if (tipo === 'volver') {
                const notas = [659.25, 523.25]; // Mi5, Do5
                notas.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    const inicio = ctx.currentTime + i * 0.028;
                    osc.frequency.setValueAtTime(freq, inicio);
                    gain.gain.setValueAtTime(0.08, inicio);
                    gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.055);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(inicio);
                    osc.stop(inicio + 0.06);
                });
            }
        } catch (e) {}
    }

    // ── Síntesis de Sonidos de Minijuegos (Acierto / Error) ──
    let nodosMinijuegoActivos = [];

    function detenerSonidosMinijuego() {
        if (!nodosMinijuegoActivos || nodosMinijuegoActivos.length === 0) return;
        nodosMinijuegoActivos.forEach(item => {
            try {
                if (item.osc) {
                    item.osc.stop();
                    item.osc.disconnect();
                }
                if (item.gain) {
                    item.gain.disconnect();
                }
            } catch (e) {}
        });
        nodosMinijuegoActivos = [];
    }

    function reproducirSonidoMinijuego(tipo, param) {
        if (isObsMode || silenciado) return;

        // Sonidos del temporizador (tic-tac y alarma de tiempo) gobernados por 'Sonidos de Alertas'
        const esAlertaTemporizador = (tipo === 'tictac' || tipo === 'alarma_tiempo');
        if (esAlertaTemporizador) {
            if (silencioAlertas) return;
        } else {
            // Sonidos de juego (aciertos y errores) gobernados por 'Sonidos de Minijuegos'
            if (silencioMinijuegos) return;
        }

        try {
            const ctx = obtenerAudioContextLotLab();
            if (!ctx) return;

            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            detenerSonidosMinijuego();

            if (tipo === 'acierto' || tipo === 'exito') {
                // Arpegio alegre ascendente, brillante y satisfactorio (Do5, Mi5, Sol5, Do6)
                const notas = [
                    { f: 523.25, dur: 0.11, t: 0 },
                    { f: 659.25, dur: 0.11, t: 0.08 },
                    { f: 783.99, dur: 0.13, t: 0.16 },
                    { f: 1046.50, dur: 0.28, t: 0.24 }
                ];

                notas.forEach(nota => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';

                    const inicio = ctx.currentTime + nota.t;
                    const fin = inicio + nota.dur;

                    osc.frequency.setValueAtTime(nota.f, inicio);

                    gain.gain.setValueAtTime(0.0001, inicio);
                    gain.gain.linearRampToValueAtTime(0.24, inicio + 0.015);
                    gain.gain.exponentialRampToValueAtTime(0.0001, fin);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(inicio);
                    osc.stop(fin + 0.02);

                    nodosMinijuegoActivos.push({ osc, gain });
                });
            } else if (tipo === 'error') {
                // Sonido breve, suave y no estridente de respuesta errónea (Fa4 a Do4, < 0.4s)
                const notas = [
                    { f: 349.23, dur: 0.15, t: 0 },
                    { f: 261.63, dur: 0.22, t: 0.12 }
                ];

                notas.forEach(nota => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';

                    const inicio = ctx.currentTime + nota.t;
                    const fin = inicio + nota.dur;

                    osc.frequency.setValueAtTime(nota.f, inicio);

                    gain.gain.setValueAtTime(0.0001, inicio);
                    gain.gain.linearRampToValueAtTime(0.20, inicio + 0.015);
                    gain.gain.exponentialRampToValueAtTime(0.0001, fin);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(inicio);
                    osc.stop(fin + 0.02);

                    nodosMinijuegoActivos.push({ osc, gain });
                });
            } else if (tipo === 'tictac') {
                // Tic-tac reconocible y suave para el temporizador por pregunta
                const esTic = (param !== undefined && param !== null) ? (param % 2 === 0) : true;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = esTic ? 800 : 670; // alterna tic agudo y tac grave

                const inicio = ctx.currentTime;
                const fin = inicio + 0.05;

                gain.gain.setValueAtTime(0.0001, inicio);
                gain.gain.linearRampToValueAtTime(0.12, inicio + 0.006);
                gain.gain.exponentialRampToValueAtTime(0.0001, fin);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(inicio);
                osc.stop(fin + 0.01);
                nodosMinijuegoActivos.push({ osc, gain });
            } else if (tipo === 'alarma_tiempo') {
                // Secuencia breve y rápida de 3 pitidos al agotarse el tiempo (< 0.25s)
                const pitidos = [0, 0.08, 0.16];
                pitidos.forEach(offset => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(820, ctx.currentTime + offset);

                    const inicio = ctx.currentTime + offset;
                    const fin = inicio + 0.05;

                    gain.gain.setValueAtTime(0.0001, inicio);
                    gain.gain.linearRampToValueAtTime(0.18, inicio + 0.008);
                    gain.gain.exponentialRampToValueAtTime(0.0001, fin);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(inicio);
                    osc.stop(fin + 0.01);
                    nodosMinijuegoActivos.push({ osc, gain });
                });
            } else if (tipo === 'cuenta_atras' || tipo === 'pitido_transicion') {
                // MEJORA 3: Pitidos breves sincronizados con la cuenta atrás (3, 2, 1)
                // 3 y 2: pitido breve y nítido (0.08s, 587 Hz)
                // 1: pitido extendido y triunfal (0.22s, 880 Hz, salida de carrera de coches)
                const esFinal = (param === 1 || param === '1' || param === 'salida');
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(esFinal ? 880 : 587.33, ctx.currentTime);

                const duracion = esFinal ? 0.22 : 0.08;
                const inicio = ctx.currentTime;
                const fin = inicio + duracion;

                gain.gain.setValueAtTime(0.0001, inicio);
                gain.gain.linearRampToValueAtTime(esFinal ? 0.24 : 0.18, inicio + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, fin);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(inicio);
                osc.stop(fin + 0.02);
                nodosMinijuegoActivos.push({ osc, gain });
            }
        } catch (e) {}
    }

    // ── Sonidos de Giro para Ruletas y Generadores (Dependen de Interfaz) ──
    function reproducirTickRuleta(intensidad = 1) {
        if (isObsMode || silenciado || silencioInterfaz) return;
        try {
            const ctx = obtenerAudioContextLotLab();
            if (!ctx) return;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';

            const freq = 650 + (intensidad * 150);
            const inicio = ctx.currentTime;
            const fin = inicio + 0.022;

            osc.frequency.setValueAtTime(freq, inicio);
            osc.frequency.exponentialRampToValueAtTime(320, fin);

            gain.gain.setValueAtTime(0.06, inicio);
            gain.gain.exponentialRampToValueAtTime(0.001, fin);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(inicio);
            osc.stop(fin + 0.005);
        } catch (e) {}
    }

    function reproducirDetencionRuleta() {
        if (isObsMode || silenciado || silencioInterfaz) return;
        try {
            const ctx = obtenerAudioContextLotLab();
            if (!ctx) return;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const inicio = ctx.currentTime;
            [0, 0.04].forEach((offset, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';

                const f = idx === 0 ? 520 : 880;
                const t = inicio + offset;
                const dur = 0.04;

                osc.frequency.setValueAtTime(f, t);
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(t);
                osc.stop(t + dur + 0.005);
            });
        } catch (e) {}
    }

    function iniciarSecuenciaGiroAudio({ duracionMs, cantidadTicks = 20, onTick, alDetenerse }) {
        if (isObsMode || silenciado || silencioInterfaz || !duracionMs || duracionMs <= 0) {
            return {
                cancelar() {}
            };
        }

        const timers = [];
        const totalTicks = Math.max(3, cantidadTicks);

        for (let k = 0; k <= totalTicks; k++) {
            let t = 0;
            if (k > 0) {
                // Curva cubic ease-out invertida: los ticks se espacian progresivamente a medida que frena
                const progreso = k / totalTicks;
                t = Math.round(duracionMs * (1 - Math.cbrt(1 - progreso)));
                if (t > duracionMs) t = duracionMs;
            }

            if (k < totalTicks) {
                const timer = setTimeout(() => {
                    const progreso = k / totalTicks;
                    if (window.SonidoGlobal && typeof window.SonidoGlobal.reproducirTickRuleta === 'function') {
                        window.SonidoGlobal.reproducirTickRuleta(1 - progreso * 0.4);
                    } else {
                        reproducirTickRuleta(1 - progreso * 0.4);
                    }
                    if (typeof onTick === 'function') {
                        onTick(progreso);
                    }
                }, t);
                timers.push(timer);
            } else {
                const timer = setTimeout(() => {
                    if (window.SonidoGlobal && typeof window.SonidoGlobal.reproducirDetencionRuleta === 'function') {
                        window.SonidoGlobal.reproducirDetencionRuleta();
                    } else {
                        reproducirDetencionRuleta();
                    }
                    if (typeof alDetenerse === 'function') {
                        alDetenerse();
                    }
                }, duracionMs);
                timers.push(timer);
            }
        }

        return {
            cancelar() {
                timers.forEach(id => clearTimeout(id));
                timers.length = 0;
            }
        };
    }

    // ── API pública de SonidoGlobal ──
    window.SonidoGlobal = {
        get silenciado() { return silenciado; },
        setSilenciado(valor) {
            silenciado = !!valor;
            if (!isObsMode) {
                localStorage.setItem('silencioGlobal', silenciado);
            }
            if (silenciado && audioCtxLotLab && audioCtxLotLab.state === 'running') {
                audioCtxLotLab.suspend().catch(() => {});
            } else if (!silenciado && audioCtxLotLab && audioCtxLotLab.state === 'suspended') {
                audioCtxLotLab.resume().catch(() => {});
            }
            actualizarUI();
        },
        toggleSilenciado() {
            this.setSilenciado(!silenciado);
        },

        get silencioInterfaz() { return silencioInterfaz; },
        setSilencioInterfaz(valor) {
            silencioInterfaz = !!valor;
            if (!isObsMode) {
                localStorage.setItem('silencioInterfaz', silencioInterfaz);
            }
            actualizarUI();
        },

        get silencioAlertas() { return silencioAlertas; },
        setSilencioAlertas(valor) {
            silencioAlertas = !!valor;
            if (!isObsMode) {
                localStorage.setItem('silencioAlertas', silencioAlertas);
            }
            actualizarUI();
        },

        get silencioMinijuegos() { return silencioMinijuegos; },
        setSilencioMinijuegos(valor) {
            silencioMinijuegos = !!valor;
            if (!isObsMode) {
                localStorage.setItem('silencioMinijuegos', silencioMinijuegos);
            }
            actualizarUI();
        },

        get interfazHabilitada() {
            return !isObsMode && !silenciado && !silencioInterfaz;
        },

        get alertasHabilitadas() {
            return !isObsMode && !silenciado && !silencioAlertas;
        },

        get minijuegosHabilitados() {
            return !isObsMode && !silenciado && !silencioMinijuegos;
        },

        get audioContextPropio() {
            return obtenerAudioContextLotLab();
        },

        reproducirSonidoUI: reproducirSonidoUI,
        reproducirSonidoMinijuego: reproducirSonidoMinijuego,
        detenerSonidosMinijuego: detenerSonidosMinijuego,
        reproducirTickRuleta: reproducirTickRuleta,
        reproducirDetencionRuleta: reproducirDetencionRuleta,
        iniciarSecuenciaGiroAudio: iniciarSecuenciaGiroAudio
    };

    window.reproducirSonidoUI = reproducirSonidoUI;

    // ── Sincronización multi-pestaña ──
    window.addEventListener('storage', (e) => {
        if (isObsMode) return;
        if (e.key === 'silencioGlobal') {
            silenciado = e.newValue === 'true';
            actualizarUI();
        } else if (e.key === 'silencioInterfaz') {
            silencioInterfaz = e.newValue === 'true';
            actualizarUI();
        } else if (e.key === 'silencioAlertas') {
            silencioAlertas = e.newValue === 'true';
            actualizarUI();
        } else if (e.key === 'silencioMinijuegos') {
            silencioMinijuegos = e.newValue === 'true';
            actualizarUI();
        }
    });

    // ── Actualización de la UI (botón y popover de sonido) ──
    function actualizarUI() {
        // Estado de sonido efectivo: disponible si Maestro = ON Y (Interfaz = ON O Alertas = ON O Minijuegos = ON)
        const sonidoEfectivoActivo = !silenciado && (!silencioInterfaz || !silencioAlertas || !silencioMinijuegos);

        const btn = document.getElementById('botonSonido');
        if (btn) {
            btn.querySelector('.icono-sonido-on')?.classList.toggle('oculto-sonido', !sonidoEfectivoActivo);
            btn.querySelector('.icono-sonido-off')?.classList.toggle('oculto-sonido', sonidoEfectivoActivo);
            btn.classList.toggle('silenciado', !sonidoEfectivoActivo);
            const txtSonido = sonidoEfectivoActivo ? 'Sonido activado' : 'Sonido silenciado';
            btn.setAttribute('data-tooltip', txtSonido);
            btn.setAttribute('aria-label', txtSonido);
            btn.removeAttribute('title');
        }

        const switchMaestro = document.getElementById('switchSonidoMaestro');
        if (switchMaestro) switchMaestro.checked = !silenciado;

        const switchInterfaz = document.getElementById('switchSonidoInterfaz');
        if (switchInterfaz) switchInterfaz.checked = !silencioInterfaz;

        const switchAlertas = document.getElementById('switchSonidoAlertas');
        if (switchAlertas) switchAlertas.checked = !silencioAlertas;

        const switchMinijuegos = document.getElementById('switchSonidoMinijuegos');
        if (switchMinijuegos) switchMinijuegos.checked = !silencioMinijuegos;

        const popover = document.getElementById('popoverSonido');
        if (popover) {
            popover.classList.toggle('maestro-apagado', silenciado);
        }
    }

    // ── Inicialización de eventos al cargar el DOM ──
    document.addEventListener('DOMContentLoaded', () => {
        actualizarUI();

        const btnSonido = document.getElementById('botonSonido');
        const popoverSonido = document.getElementById('popoverSonido');
        const wrapperSonido = document.getElementById('controlSonidoWrapper');

        // Toggle del popover de sonido
        btnSonido?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!popoverSonido) return;
            const abierto = popoverSonido.classList.toggle('abierto');
            wrapperSonido?.classList.toggle('popover-abierto', abierto);
            if (abierto) {
                // Cerrar otros popovers del footer si estuvieran abiertos
                document.getElementById('listaIdiomas')?.classList.remove('abierta');
                document.getElementById('popoverModoNav')?.classList.remove('abierto');
                document.getElementById('selectorModoNavWrapper')?.classList.remove('popover-abierto');
                document.getElementById('popoverTemas')?.classList.remove('abierto');
                document.getElementById('selectorTemasWrapper')?.classList.remove('popover-abierto');
                actualizarUI();
            }
        });

        // Cerrar popover al pulsar botón de cierre interno si existe
        document.getElementById('cerrarPopoverSonido')?.addEventListener('click', (e) => {
            e.stopPropagation();
            popoverSonido?.classList.remove('abierto');
            wrapperSonido?.classList.remove('popover-abierto');
        });

        // Cerrar popover al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (popoverSonido && !popoverSonido.contains(e.target) && e.target !== btnSonido && !btnSonido?.contains(e.target)) {
                popoverSonido.classList.remove('abierto');
                wrapperSonido?.classList.remove('popover-abierto');
            }
        });

        // Switch Maestro: controla el audio global
        document.getElementById('switchSonidoMaestro')?.addEventListener('change', function () {
            window.SonidoGlobal.setSilenciado(!this.checked);
        });

        // Switch Interfaz: 100% interactivo incluso si Maestro está OFF
        document.getElementById('switchSonidoInterfaz')?.addEventListener('change', function () {
            window.SonidoGlobal.setSilencioInterfaz(!this.checked);
        });

        // Switch Alertas: 100% interactivo incluso si Maestro está OFF
        document.getElementById('switchSonidoAlertas')?.addEventListener('change', function () {
            window.SonidoGlobal.setSilencioAlertas(!this.checked);
        });

        // Switch Minijuegos: 100% interactivo incluso si Maestro está OFF
        document.getElementById('switchSonidoMinijuegos')?.addEventListener('change', function () {
            window.SonidoGlobal.setSilencioMinijuegos(!this.checked);
        });
    });

})();

console.log('✔ sonido cargado');
