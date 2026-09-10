/*
=========================================================
SONIDO
Gestiona el sistema de sonido jerárquico de LOT-LAB:
  - 🔊 Sonido Maestro: control global absoluto ('silencioGlobal').
  - 🖱️ Sonidos de Interfaz: hover, clics, navegación ('silencioInterfaz').
  - ⏰ Sonidos de Alertas: temporizador, ruletas, alarmas ('silencioAlertas').
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

    // Desbloqueo seguro del AudioContext propio ante la primera interacción del usuario
    const desbloquearAudioLotLab = () => {
        if (audioCtxLotLab && audioCtxLotLab.state === 'suspended' && !silenciado) {
            audioCtxLotLab.resume().catch(() => {});
        }
    };
    document.addEventListener('pointerdown', desbloquearAudioLotLab, { capture: true, once: true });
    document.addEventListener('keydown', desbloquearAudioLotLab, { capture: true, once: true });

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

        get interfazHabilitada() {
            return !isObsMode && !silenciado && !silencioInterfaz;
        },

        get alertasHabilitadas() {
            return !isObsMode && !silenciado && !silencioAlertas;
        },

        get audioContextPropio() {
            return obtenerAudioContextLotLab();
        },

        reproducirSonidoUI: reproducirSonidoUI
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
        }
    });

    // ── Actualización de la UI (botón y popover de sonido) ──
    function actualizarUI() {
        // Estado de sonido efectivo: disponible si Maestro = ON Y (Interfaz = ON O Alertas = ON)
        const sonidoEfectivoActivo = !silenciado && (!silencioInterfaz || !silencioAlertas);

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
    });

})();

console.log('✔ sonido cargado');
