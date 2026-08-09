/* =========================================================
   LOT-LAB SIMS 4 - INTEGRACIÓN OBS STUDIO (BROWSER SOURCE)
   ========================================================= */

(function () {
    // ─── CONFIGURACIÓN DE ESTADO ─────────────────────────
    const OBS_STORAGE_KEY = 'lotlab_obs_settings';
    
    // Configuración por defecto
    let obsConfig = {
        pos: 'right',        // 'left' | 'center' | 'right'
        theme: 'noche',      // 'auto' | 'dia' | 'noche'
        bg: 'transparent'    // 'transparent' | 'dark'
    };

    // Cargar configuración guardada si existe
    try {
        const saved = localStorage.getItem(OBS_STORAGE_KEY);
        if (saved) {
            obsConfig = Object.assign(obsConfig, JSON.parse(saved));
        }
    } catch (e) {}

    // ─── DETECCIÓN MODO OBS EN URL ─────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    
    const isObsMode = urlParams.get('obs') === '1' || urlParams.get('obs') === 'true' || 
                      hashParams.get('obs') === '1' || hashParams.get('obs') === 'true';

    // Si viene por parámetro URL, prevalecen esos parámetros sobre el localStorage
    if (urlParams.has('pos')) obsConfig.pos = urlParams.get('pos');
    if (urlParams.has('theme')) obsConfig.theme = urlParams.get('theme');
    if (urlParams.has('bg')) obsConfig.bg = urlParams.get('bg');

    // ─── BROADCAST CHANNEL PARA SINCRONIZACIÓN EN TIEMPO REAL ───
    let obsChannel = null;
    if ('BroadcastChannel' in window) {
        try {
            obsChannel = new BroadcastChannel('lotlab_obs_sync_channel');
        } catch (e) {}
    }

    // ─── INICIALIZACIÓN MODO OBS (FUENTES DE NAVEGADOR OBS) ───
    function aplicarModoOBSVisual() {
        document.body.classList.add('modo-obs');
        
        // Aplicar clase de posición
        document.body.classList.remove('obs-pos-left', 'obs-pos-center', 'obs-pos-right');
        document.body.classList.add('obs-pos-' + (obsConfig.pos || 'right'));

        // Aplicar clase de fondo
        document.body.classList.remove('obs-bg-transparent', 'obs-bg-dark', 'obs-bg-light');
        document.body.classList.add('obs-bg-' + (obsConfig.bg || 'transparent'));

        // Aplicar tema (Día / Noche / Auto)
        document.body.classList.remove('modo-dia', 'modo-noche', 'modo-obs-dia', 'modo-obs-noche');
        if (obsConfig.theme === 'dia') {
            document.body.classList.add('modo-dia', 'modo-obs-dia');
        } else if (obsConfig.theme === 'noche') {
            document.body.classList.add('modo-noche', 'modo-obs-noche');
        } else {
            // Auto: respeta el tema que esté activo o guardado
            const temaGuardado = localStorage.getItem('modo-color') || 'modo-noche';
            document.body.classList.add(temaGuardado);
        }
    }

    if (isObsMode) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', aplicarModoOBSVisual);
        } else {
            aplicarModoOBSVisual();
        }

        // Escuchar por BroadcastChannel
        if (obsChannel) {
            obsChannel.onmessage = (event) => {
                procesarMensajeObs(event.data);
            };
        }

        // Escuchar por StorageEvent (fallback para navegadores/pestañas)
        window.addEventListener('storage', (event) => {
            if (event.key === 'lotlab_obs_broadcast_event' && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    procesarMensajeObs(data);
                } catch (e) {}
            }
        });
    }

    function procesarMensajeObs(data) {
        if (!data || !data.tipo) return;

        switch (data.tipo) {
            case 'SYNC_CONFIG':
                if (data.config) {
                    obsConfig = Object.assign(obsConfig, data.config);
                    aplicarModoOBSVisual();
                }
                break;

            case 'SYNC_ABRIR_VENTANA':
                if (data.idVentana && typeof window.abrirVentana === 'function') {
                    window.abrirVentana(data.idVentana, false);
                }
                break;

            case 'SYNC_CERRAR_VENTANA':
                if (data.idVentana && typeof window.cerrarVentana === 'function') {
                    window.cerrarVentana(data.idVentana);
                }
                break;

            case 'SYNC_MODAL_PACKS':
                if (data.visible && typeof window.abrirModalPacksFlotante === 'function' && data.titulo && data.packs) {
                    window.abrirModalPacksFlotante(data.titulo, data.packs);
                } else if (typeof window.cerrarModalPacksFlotante === 'function') {
                    window.cerrarModalPacksFlotante();
                } else {
                    const modalPacks = document.getElementById('modalPacksCategoria');
                    if (modalPacks) {
                        modalPacks.classList.toggle('activo', !!data.visible);
                    }
                }
                break;

            case 'SYNC_ACCION':
                if (data.accion === 'GIRAR_RULETA_DESASTRES' && typeof window.ejecutarGiroRuletaDesastresObs === 'function') {
                    window.ejecutarGiroRuletaDesastresObs(data.payload);
                } else if (data.accion === 'GIRAR_RULETA_COLOR' && typeof window.ejecutarGiroRuletaColorObs === 'function') {
                    window.ejecutarGiroRuletaColorObs(data.payload);
                } else if (data.accion === 'TIRAR_DADOS' && typeof window.ejecutarTiradaDadosObs === 'function') {
                    window.ejecutarTiradaDadosObs(data.payload);
                } else if (data.accion === 'TEMPORIZADOR' && typeof window.ejecutarTemporizadorObs === 'function') {
                    window.ejecutarTemporizadorObs(data.payload);
                }
                break;
        }
    }

    // ─── EMITIR MENSAJES DESDE LA VENTANA PRINCIPAL ─────────
    window.emitirEventoOBS = function (tipo, payload = {}) {
        const mensaje = Object.assign({ tipo, timestamp: Date.now() }, payload);

        if (obsChannel) {
            try {
                obsChannel.postMessage(mensaje);
            } catch (e) {}
        }

        try {
            localStorage.setItem('lotlab_obs_broadcast_event', JSON.stringify(mensaje));
        } catch (e) {}
    };

    function generarUrlOBS() {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        params.set('obs', '1');
        params.set('pos', obsConfig.pos || 'right');
        params.set('theme', obsConfig.theme || 'noche');
        params.set('bg', obsConfig.bg || 'transparent');
        return baseUrl + '?' + params.toString();
    }

    window.actualizarModalOBSUI = function () {
        const inputUrlOBS = document.getElementById('inputUrlOBS');
        const btnProbarOBS = document.getElementById('btnProbarOBS');

        document.querySelectorAll('.obsBtnPos').forEach(b => {
            b.classList.toggle('activo', b.dataset.val === obsConfig.pos);
        });
        document.querySelectorAll('.obsBtnTheme').forEach(b => {
            b.classList.toggle('activo', b.dataset.val === obsConfig.theme);
        });
        document.querySelectorAll('.obsBtnBg').forEach(b => {
            b.classList.toggle('activo', b.dataset.val === obsConfig.bg);
        });

        const fullUrl = generarUrlOBS();
        if (inputUrlOBS) inputUrlOBS.value = fullUrl;
        if (btnProbarOBS) btnProbarOBS.href = fullUrl;
    };

    window.abrirModalOBS = function () {
        const modalOBS = document.getElementById('modalOBS');
        if (!modalOBS) return;
        window.actualizarModalOBSUI();
        modalOBS.classList.add('activo');
        modalOBS.style.display = 'flex';
    };

    window.cerrarModalOBS = function () {
        const modalOBS = document.getElementById('modalOBS');
        if (modalOBS) {
            modalOBS.classList.remove('activo');
            modalOBS.style.display = 'none';
        }
    };

    function guardarYNotificarConfigOBS() {
        try {
            localStorage.setItem(OBS_STORAGE_KEY, JSON.stringify(obsConfig));
        } catch (e) {}

        window.actualizarModalOBSUI();
        window.emitirEventoOBS('SYNC_CONFIG', { config: obsConfig });
    }

    // ─── LÓGICA DEL MODAL OBS EN LA VENTANA PRINCIPAL ─────────
    function inicializarModalOBS() {
        const btnAbrirOBS = document.getElementById('botonOBS');
        const btnCerrarOBS = document.getElementById('cerrarModalOBSBtn');
        const overlayOBS = document.getElementById('overlayOBS');
        const btnCopiarUrl = document.getElementById('btnCopiarUrlOBS');
        const inputUrlOBS = document.getElementById('inputUrlOBS');

        btnAbrirOBS?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.abrirModalOBS();
        });

        btnCerrarOBS?.addEventListener('click', window.cerrarModalOBS);
        overlayOBS?.addEventListener('click', window.cerrarModalOBS);

        document.querySelectorAll('.obsBtnPos').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.obsBtnPos').forEach(b => b.classList.remove('activo'));
                this.classList.add('activo');
                obsConfig.pos = this.dataset.val;
                guardarYNotificarConfigOBS();
            });
        });

        document.querySelectorAll('.obsBtnTheme').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.obsBtnTheme').forEach(b => b.classList.remove('activo'));
                this.classList.add('activo');
                obsConfig.theme = this.dataset.val;
                guardarYNotificarConfigOBS();
            });
        });

        document.querySelectorAll('.obsBtnBg').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.obsBtnBg').forEach(b => b.classList.remove('activo'));
                this.classList.add('activo');
                obsConfig.bg = this.dataset.val;
                guardarYNotificarConfigOBS();
            });
        });

        btnCopiarUrl?.addEventListener('click', () => {
            if (!inputUrlOBS) return;
            inputUrlOBS.select();
            inputUrlOBS.setSelectionRange(0, 99999);
            
            const urlTexto = inputUrlOBS.value;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(urlTexto).then(notificarCopiado).catch(copyFallback);
            } else {
                copyFallback();
            }

            function notificarCopiado() {
                const textoOriginal = btnCopiarUrl.innerHTML;
                btnCopiarUrl.innerHTML = '✅ ¡Enlace Copiado!';
                btnCopiarUrl.classList.add('copiado');
                setTimeout(() => {
                    btnCopiarUrl.innerHTML = textoOriginal;
                    btnCopiarUrl.classList.remove('copiado');
                }, 2000);
            }

            function copyFallback() {
                try {
                    document.execCommand('copy');
                    notificarCopiado();
                } catch (err) {}
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarModalOBS);
    } else {
        inicializarModalOBS();
    }

})();
