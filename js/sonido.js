/*
=========================================================
SONIDO
Gestiona el silenciado/activación global de todo el audio
de la web (presente y futuro):
  - Intercepta y envuelve Web Audio API (AudioContext / webkitAudioContext):
    suspende inmediatamente cualquier contexto si está silenciado
    y suspende/reanuda los contextos activos al pulsar el botón.
  - Intercepta HTMLMediaElement (audio/video): silencia elementos
    actuales, futuros (MutationObserver) y al llamar a .play().
  - Modo OBS (overlay en stream): se mantiene silenciado por defecto
    para evitar que OBS Studio emita sonidos en segundo plano
    incluso si el navegador web está cerrado.
  - Sincronización multi-pestaña mediante el evento 'storage'.
  - Persistencia de preferencia en localStorage.
=========================================================
*/

(function () {
    // ── Detección de Modo OBS ──
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    const isObsMode = urlParams.get('obs') === '1' || hashParams.get('obs') === '1';

    // ── Estado inicial ──
    // Si estamos en OBS, siempre silenciado para que OBS Studio no reproduzca ruidos
    let silenciado = isObsMode ? true : (localStorage.getItem('silencioGlobal') === 'true');

    // ── Registro de contextos de audio activos ──
    const contextosActivos = new Set();

    function actualizarContextosAudio() {
        contextosActivos.forEach(ctx => {
            try {
                if (ctx.state === 'closed') {
                    contextosActivos.delete(ctx);
                    return;
                }
                if (silenciado && ctx.state === 'running') {
                    ctx.suspend();
                } else if (!silenciado && ctx.state === 'suspended') {
                    ctx.resume();
                }
            } catch (e) {}
        });
    }

    // ── Intercepción universal de AudioContext y webkitAudioContext ──
    const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
    if (NativeAudioContext) {
        const AudioContextProxy = function (...args) {
            const ctx = new NativeAudioContext(...args);
            contextosActivos.add(ctx);

            if (silenciado) {
                try {
                    ctx.suspend();
                } catch (e) {}
            }

            const origClose = ctx.close;
            ctx.close = function () {
                contextosActivos.delete(ctx);
                return origClose.apply(ctx, arguments);
            };

            return ctx;
        };

        AudioContextProxy.prototype = NativeAudioContext.prototype;
        window.AudioContext = AudioContextProxy;
        if (window.webkitAudioContext) {
            window.webkitAudioContext = AudioContextProxy;
        }
    }

    // ── Intercepción universal de HTMLMediaElement (audio/video) ──
    if (window.HTMLMediaElement) {
        const origPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            if (silenciado) {
                this.muted = true;
            }
            return origPlay.apply(this, arguments);
        };
    }

    function aplicarSilencioMedia(el) {
        if (el) el.muted = silenciado;
    }

    function silenciarTodosMedia() {
        document.querySelectorAll('audio, video').forEach(aplicarSilencioMedia);
    }

    // ── MutationObserver para multimedia futura ──
    if (window.MutationObserver) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mut) => {
                mut.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    if (node.matches?.('audio, video')) aplicarSilencioMedia(node);
                    node.querySelectorAll?.('audio, video').forEach(aplicarSilencioMedia);
                });
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // ── API pública accesible por otros módulos ──
    window.SonidoGlobal = {
        get silenciado() { return silenciado; },
        setSilenciado(valor) {
            silenciado = !!valor;
            if (!isObsMode) {
                localStorage.setItem('silencioGlobal', silenciado);
            }
            silenciarTodosMedia();
            actualizarContextosAudio();
            actualizarBoton();
        },
        toggleSilenciado() {
            this.setSilenciado(!silenciado);
        }
    };

    // ── Sincronización entre pestañas ──
    window.addEventListener('storage', (e) => {
        if (e.key === 'silencioGlobal' && !isObsMode) {
            silenciado = e.newValue === 'true';
            silenciarTodosMedia();
            actualizarContextosAudio();
            actualizarBoton();
        }
    });

    // ── Actualización del botón visual en el footer ──
    function actualizarBoton() {
        const btn = document.getElementById('botonSonido');
        if (!btn) return;
        btn.querySelector('.icono-sonido-on')?.classList.toggle('oculto-sonido', silenciado);
        btn.querySelector('.icono-sonido-off')?.classList.toggle('oculto-sonido', !silenciado);
        btn.classList.toggle('silenciado', silenciado);
        btn.title = silenciado ? 'Activar sonido' : 'Silenciar';
    }

    // ── Inicialización de la UI cuando el DOM esté listo ──
    silenciarTodosMedia();

    document.addEventListener('DOMContentLoaded', () => {
        silenciarTodosMedia();
        actualizarContextosAudio();
        actualizarBoton();

        const btn = document.getElementById('botonSonido');
        btn?.addEventListener('click', () => {
            window.SonidoGlobal.toggleSilenciado();
        });
    });

})();

console.log('✔ sonido cargado');
