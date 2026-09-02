/* ==========================================================
   AUTH PRE-LAUNCH & EARLY ACCESS SYSTEM
   LOT-LAB SIMS 4
========================================================== */

(function () {
    "use strict";

    const URL_WEB_APP =
        (typeof CONFIG !== "undefined" && CONFIG.AUTH_WEB_APP)
            ? CONFIG.AUTH_WEB_APP
            : "https://script.google.com/macros/s/AKfycbxOx2AAaD8zuTJWOX8y-vOkhrYGz_y0-E0AEhqJPDi1Dvq8oxgJnT8drZY8E_RQOJIbRw/exec";

    // 17 de septiembre de 2026 a las 18:00:00 (Madrid)
    const FECHA_STR =
        (typeof CONFIG !== "undefined" && CONFIG.FECHA_LANZAMIENTO_MADRID)
            ? CONFIG.FECHA_LANZAMIENTO_MADRID
            : "2026-09-17T18:00:00+02:00";

    const FECHA_LANZAMIENTO_MADRID = new Date(FECHA_STR).getTime();

    const STORAGE_TOKEN_KEY = "lotlab_auth_token";

    let temporizadorCountdown = null;
    let temporizadorBloqueo = null;
    let baseDatosIniciada = false;

    // Control de verificaciones
    let verificacionEnCurso = false;
    let verificacionCompletada = false;
    let verificacionLanzamientoProgramada = false;

    // Control de comprobación silenciosa en segundo plano
    // (activa cuando el usuario entró con token pero checkStatus falló por red)
    let intervaloSegundoPlano = null;
    let entradaConFalloConexion = false;

    // ── 1. Desbloqueo seguro de la aplicación ──

    function autorizarYDesbloquearApp(esPublico = false, usuario = "") {

        console.log(
            `[LOT-LAB Auth] Acceso autorizado (${esPublico ? "Público" : "Usuario: " + usuario})`
        );

        // Autorizar descarga de Google Sheets
        if (typeof window.marcarAppAutorizada === "function") {
            window.marcarAppAutorizada();
        }

        const pantallaPre = document.getElementById("pantallaPreLaunch");

        if (pantallaPre) {
            pantallaPre.classList.add("oculta");

            setTimeout(() => {
                pantallaPre.style.display = "none";
            }, 600);
        }

        if (temporizadorCountdown) {
            clearInterval(temporizadorCountdown);
            temporizadorCountdown = null;
        }

        if (temporizadorBloqueo) {
            clearInterval(temporizadorBloqueo);
            temporizadorBloqueo = null;
        }

        // Descargar e inicializar la base de datos únicamente
        // después de la autorización del backend.
        if (!baseDatosIniciada) {
            baseDatosIniciada = true;

            if (typeof window.iniciarBaseDatosSegura === "function") {
                window.iniciarBaseDatosSegura();
            }
        }
    }

    window.autorizarYDesbloquearApp = autorizarYDesbloquearApp;


    // ── 2. Mostrar pantalla de pre-lanzamiento ──

    function mostrarPantallaPreLaunch() {

        const pantallaPre = document.getElementById("pantallaPreLaunch");

        if (pantallaPre) {
            pantallaPre.style.display = "flex";

            void pantallaPre.offsetWidth;

            pantallaPre.classList.remove("oculta");
        }

        iniciarCuentaAtras();

        // Finalizar pantalla de carga inicial
        if (typeof window.forzarFinCargaPreLaunch === "function") {
            window.forzarFinCargaPreLaunch();
        }
    }


    // ── 3. Cuenta atrás visual ──

    function iniciarCuentaAtras() {

        const dEl = document.getElementById("prelaunchDias");
        const hEl = document.getElementById("prelaunchHoras");
        const mEl = document.getElementById("prelaunchMinutos");
        const sEl = document.getElementById("prelaunchSegundos");

        if (!dEl || !hEl || !mEl || !sEl) {
            return;
        }

        function actualizar() {

            const ahora = Date.now();
            const diferencia = FECHA_LANZAMIENTO_MADRID - ahora;

            if (diferencia <= 0) {

                dEl.textContent = "00";
                hEl.textContent = "00";
                mEl.textContent = "00";
                sEl.textContent = "00";

                if (temporizadorCountdown) {
                    clearInterval(temporizadorCountdown);
                    temporizadorCountdown = null;
                }

                /*
                 * Al llegar a 0 (17/09/2026 18:00 Madrid o posterior),
                 * desbloqueamos inmediatamente la aplicación para acceso público.
                 */
                console.log("[LOT-LAB Auth] Fecha de lanzamiento alcanzada — desbloqueando acceso público.");
                verificacionCompletada = true;
                autorizarYDesbloquearApp(true, "público");

                return;
            }

            const dias = Math.floor(
                diferencia / (1000 * 60 * 60 * 24)
            );

            const horas = Math.floor(
                (diferencia % (1000 * 60 * 60 * 24)) /
                (1000 * 60 * 60)
            );

            const minutos = Math.floor(
                (diferencia % (1000 * 60 * 60)) /
                (1000 * 60)
            );

            const segundos = Math.floor(
                (diferencia % (1000 * 60)) /
                1000
            );

            dEl.textContent = String(dias).padStart(2, "0");
            hEl.textContent = String(horas).padStart(2, "0");
            mEl.textContent = String(minutos).padStart(2, "0");
            sEl.textContent = String(segundos).padStart(2, "0");
        }

        actualizar();

        if (temporizadorCountdown) {
            clearInterval(temporizadorCountdown);
        }

        temporizadorCountdown = setInterval(actualizar, 1000);
    }


    // ── 4. Huella del cliente ──

    function obtenerFingerprint() {

        try {

            const raw =
                `${navigator.userAgent}_` +
                `${screen.width}x${screen.height}_` +
                `${navigator.language}_` +
                `${new Date().getTimezoneOffset()}`;

            let hash = 0;

            for (let i = 0; i < raw.length; i++) {
                hash =
                    ((hash << 5) - hash) +
                    raw.charCodeAt(i);

                hash |= 0;
            }

            return "fp_" + Math.abs(hash).toString(36);

        } catch (e) {

            return "fp_default";
        }
    }


    // ── 5. Comunicación con Apps Script ──

    async function enviarPeticionAppsScript(payload) {

        const datos = Object.assign({}, payload, {
            clientFingerprint: obtenerFingerprint()
        });

        // Timeout de 15 segundos para evitar esperas indefinidas
        // (especialmente en cold start de Google Apps Script).
        // AbortError cae al catch existente y devuelve ERROR_CONEXION.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {

            const res = await fetch(URL_WEB_APP, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(datos),
                signal: controller.signal
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const resultado = await res.json();

            return resultado;

        } catch (error) {

            console.error(
                "[LOT-LAB Auth] Error en petición a Apps Script:",
                error
            );

            /*
             * NO hacemos fallback GET.
             *
             * Especialmente importante en login:
             * nunca enviamos usuario/contraseña dentro de una URL.
             */
            return {
                success: false,
                error: "ERROR_CONEXION"
            };

        } finally {

            // Limpiar el timer siempre, tanto si la petición fue exitosa
            // como si terminó por error o por abort, para evitar fugas.
            clearTimeout(timeoutId);
        }
    }


    // ── 6. Verificación inicial del servidor ──

    async function verificarEstadoServidor(opciones = {}) {

        // ── BYPASS TEMPORAL PARA OBS VIEWER (PRELANZAMIENTO) ──────────────────
        // La Browser Source de OBS no comparte el localStorage del navegador
        // normal, por lo que nunca tendría el token de autenticación.
        // Si la URL indica modo OBS real (?obs=1) y contiene un room con el
        // prefijo que genera obs.js ("lotlab_"), autorizamos directamente.
        //
        // ⚠️  ELIMINAR este bloque completo el 17/09/2026 cuando desaparezca
        //     el sistema de prelanzamiento.
        {
            const p = new URLSearchParams(window.location.search);
            const h = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
            const esObs = p.get('obs') === '1' || h.get('obs') === '1';
            const room  = p.get('room') || h.get('room') || '';
            if (esObs && room.startsWith('lotlab_')) {
                console.log('[LOT-LAB Auth] Modo OBS Viewer detectado — bypass de prelanzamiento activo.');
                verificacionCompletada = true;
                autorizarYDesbloquearApp(false, 'obs-viewer');
                return;   // ← no continuar hacia la verificación con el servidor
            }
        }
        // ── FIN BYPASS OBS ─────────────────────────────────────────────────────

        // ── ACCESO PÚBLICO AUTOMÁTICO TRAS EL LANZAMIENTO OFICIAL ─────────────
        // Si la fecha actual ya es igual o posterior al lanzamiento oficial
        // (17 de septiembre de 2026 a las 18:00:00 Madrid), se autoriza
        // directamente el acceso público completo sin solicitar credenciales.
        if (Date.now() >= FECHA_LANZAMIENTO_MADRID) {
            console.log('[LOT-LAB Auth] Lanzamiento público activo — acceso autorizado.');
            verificacionCompletada = true;
            autorizarYDesbloquearApp(true, 'público');
            return;
        }
        // ───────────────────────────────────────────────────────────────────────



        const esVerificacionDeLanzamiento =
            opciones.esVerificacionDeLanzamiento === true;

        /*
         * Una verificación normal solamente puede ejecutarse una vez.
         *
         * La verificación especial de lanzamiento es independiente,
         * porque permite desbloquear automáticamente la página que
         * permaneció abierta hasta las 18:00.
         */
        if (
            verificacionEnCurso ||
            (
                verificacionCompletada &&
                !esVerificacionDeLanzamiento
            )
        ) {
            return;
        }

        verificacionEnCurso = true;

        const tokenGuardado =
            localStorage.getItem(STORAGE_TOKEN_KEY) || "";

        try {

            const data = await enviarPeticionAppsScript({
                action: "checkStatus",
                token: tokenGuardado
            });

            /*
             * Si el servidor confirma acceso, desbloqueamos.
             */
            if (
                data &&
                (
                    data.isPublic === true ||
                    data.authorized === true
                )
            ) {

                verificacionCompletada = true;

                autorizarYDesbloquearApp(
                    data.isPublic === true,
                    data.user || ""
                );

                return;
            }

            /*
             * Si no está autorizado, mostramos pre-launch.
             */
            if (
                data &&
                data.error !== "ERROR_CONEXION"
            ) {

                verificacionCompletada = true;

                mostrarPantallaPreLaunch();

                return;
            }

            /*
             * ERROR DE CONEXIÓN:
             * El servidor no respondió (cold start, red caída, CORS, timeout).
             *
             * Si el usuario tiene un token previamente obtenido de forma legítima,
             * NO lo tratamos como sesión revocada.
             * Lo autorizamos provisionalmente y comprobamos en segundo plano.
             *
             * Si NO hay token, sí mostramos el login: no podemos asumir
             * que un localStorage vacío represente una sesión válida.
             */
            if (tokenGuardado) {

                console.warn(
                    "[LOT-LAB Auth] Fallo de conexión con el servidor. " +
                    "El usuario tiene token — acceso provisional concedido. " +
                    "Se verificará en segundo plano."
                );

                verificacionCompletada = true;
                entradaConFalloConexion = true;

                autorizarYDesbloquearApp(false, "(sesión pendiente de verificar)");

                reintentarCheckStatusEnSegundoPlano();

            } else {

                console.warn(
                    "[LOT-LAB Auth] Fallo de conexión y sin token guardado — mostrando login."
                );

                mostrarPantallaPreLaunch();
            }

        } finally {

            verificacionEnCurso = false;
        }
    }


    // ── 7. Comprobación silenciosa en segundo plano ──
    //
    // Se activa únicamente cuando el usuario entró con token pero checkStatus
    // falló por un error de conexión (cold start, red caída, etc.).
    // Comprueba periódicamente si la sesión sigue siendo válida.
    // Solo expulsa al usuario si el servidor confirma EXPLÍCITAMENTE la revocación.
    // Los nuevos fallos de conexión NO expulsan: simplemente se sigue intentando.

    function reintentarCheckStatusEnSegundoPlano() {

        // Evitar múltiples intervalos duplicados
        if (intervaloSegundoPlano !== null) {
            return;
        }

        const INTERVALO_MS = 3 * 60 * 1000; // 3 minutos entre intentos

        intervaloSegundoPlano = setInterval(async () => {

            // Si el sistema ya no está en modo de fallo de conexión, detener
            if (!entradaConFalloConexion) {
                clearInterval(intervaloSegundoPlano);
                intervaloSegundoPlano = null;
                return;
            }

            // Fecha de lanzamiento alcanzada: acceso público, detener comprobación
            if (Date.now() >= FECHA_LANZAMIENTO_MADRID) {
                clearInterval(intervaloSegundoPlano);
                intervaloSegundoPlano = null;
                entradaConFalloConexion = false;
                return;
            }

            const tokenActual = localStorage.getItem(STORAGE_TOKEN_KEY) || "";

            console.log("[LOT-LAB Auth] Comprobación silenciosa en segundo plano...");

            let data;
            try {
                data = await enviarPeticionAppsScript({
                    action: "checkStatus",
                    token: tokenActual
                });
            } catch (_) {
                // enviarPeticionAppsScript nunca lanza; captura por seguridad
                data = { success: false, error: "ERROR_CONEXION" };
            }

            // Nuevo error de conexión → seguir esperando, no expulsar
            if (!data || data.error === "ERROR_CONEXION") {
                console.warn(
                    "[LOT-LAB Auth] Segundo plano: servidor aún inaccesible. Se reintentará."
                );
                return;
            }

            // El servidor respondió correctamente

            if (data.isPublic === true || data.authorized === true) {

                // Sesión confirmada: detener comprobación, todo en orden
                console.log(
                    "[LOT-LAB Auth] Segundo plano: sesión confirmada como válida."
                );
                clearInterval(intervaloSegundoPlano);
                intervaloSegundoPlano = null;
                entradaConFalloConexion = false;
                return;
            }

            // El servidor indica explícitamente que la sesión está revocada
            console.warn(
                "[LOT-LAB Auth] Segundo plano: sesión revocada por el servidor — expulsando."
            );

            clearInterval(intervaloSegundoPlano);
            intervaloSegundoPlano = null;
            entradaConFalloConexion = false;

            mostrarPantallaPreLaunch();

        }, INTERVALO_MS);
    }


    // ── 8. Verificación automática al llegar a la fecha oficial ──

    function programarVerificacionDeLanzamiento() {

        if (verificacionLanzamientoProgramada) {
            return;
        }

        verificacionLanzamientoProgramada = true;

        verificarEstadoServidor({
            esVerificacionDeLanzamiento: true
        });
    }


    // ── 9. Mensajes de interfaz ──

    function mostrarMensaje(texto, tipo = "error") {

        const msgEl =
            document.getElementById("prelaunchMensaje");

        if (!msgEl) {
            return;
        }

        /*
         * Usamos textContent para evitar interpretar como HTML
         * cualquier contenido procedente del servidor.
         *
         * Para los mensajes internos que necesitan formato,
         * utilizamos una pequeña excepción controlada abajo.
         */
        msgEl.className =
            `prelaunchMensaje ${tipo}`;

        msgEl.textContent = texto;

        msgEl.style.display = "block";
    }


    function mostrarMensajeHtmlSeguro(html, tipo = "error") {

        const msgEl =
            document.getElementById("prelaunchMensaje");

        if (!msgEl) {
            return;
        }

        msgEl.className =
            `prelaunchMensaje ${tipo}`;

        msgEl.innerHTML = html;

        msgEl.style.display = "block";
    }


    function ocultarMensaje() {

        const msgEl =
            document.getElementById("prelaunchMensaje");

        if (msgEl) {
            msgEl.style.display = "none";
        }
    }


    // ── 10. Temporizador de bloqueo ──

    function iniciarTemporizadorBloqueo(segundosRestantes) {

        const btnAcceso =
            document.getElementById("btnAccederPrelaunch");

        if (btnAcceso) {
            btnAcceso.disabled = true;
        }

        let restante =
            Math.max(0, Number(segundosRestantes) || 0);

        function tick() {

            if (restante <= 0) {

                if (temporizadorBloqueo) {
                    clearInterval(temporizadorBloqueo);
                    temporizadorBloqueo = null;
                }

                if (btnAcceso) {
                    btnAcceso.disabled = false;
                }

                ocultarMensaje();

                return;
            }

            const mins =
                Math.floor(restante / 60);

            const segs =
                restante % 60;

            const formato =
                `${mins}:${String(segs).padStart(2, "0")}`;

            mostrarMensajeHtmlSeguro(
                `⚠️ Has alcanzado el límite de intentos. ` +
                `El acceso está bloqueado temporalmente.` +
                `<br>Podrás reintentar en: ` +
                `<strong>${formato}</strong>`,
                "bloqueo"
            );

            restante--;
        }

        if (temporizadorBloqueo) {
            clearInterval(temporizadorBloqueo);
        }

        tick();

        temporizadorBloqueo =
            setInterval(tick, 1000);
    }


    // ── 11. Procesamiento del login ──

    async function procesarLogin(e) {

        if (e) {
            e.preventDefault();
        }

        const userInput =
            document.getElementById("inputPrelaunchUser");

        const passInput =
            document.getElementById("inputPrelaunchPass");

        const btnAcceso =
            document.getElementById("btnAccederPrelaunch");

        const btnTexto =
            document.getElementById("btnAccederTexto");

        const btnSpinner =
            document.getElementById("btnAccederSpinner");

        const usuario =
            (userInput?.value || "").trim();

        const password =
            (passInput?.value || "").trim();

        if (!usuario || !password) {

            mostrarMensaje(
                "⚠️ Por favor, introduce tu usuario y tu contraseña.",
                "error"
            );

            return;
        }

        ocultarMensaje();

        if (btnAcceso) {
            btnAcceso.disabled = true;
        }

        if (btnTexto) {
            btnTexto.style.display = "none";
        }

        if (btnSpinner) {
            btnSpinner.style.display = "inline-block";
        }

        try {

            const respuesta =
                await enviarPeticionAppsScript({
                    action: "login",
                    user: usuario,
                    password: password
                });

            /*
             * Éxito
             */
            if (
                respuesta &&
                (
                    respuesta.success === true ||
                    respuesta.authorized === true
                )
            ) {

                /*
                 * Solamente almacenamos el token.
                 * NUNCA almacenamos la contraseña.
                 */
                if (respuesta.token) {

                    localStorage.setItem(
                        STORAGE_TOKEN_KEY,
                        respuesta.token
                    );
                }

                mostrarMensaje(
                    "¡Acceso autorizado! Cargando...",
                    "info"
                );

                setTimeout(() => {

                    autorizarYDesbloquearApp(
                        respuesta.isPublic === true,
                        respuesta.user || usuario
                    );

                }, 500);

                return;
            }

            /*
             * Error de conexión
             */
            if (
                respuesta &&
                respuesta.error === "ERROR_CONEXION"
            ) {

                mostrarMensaje(
                    "⚠️ No se ha podido contactar con el servidor. " +
                    "Comprueba tu conexión e inténtalo de nuevo.",
                    "error"
                );

                return;
            }

            /*
             * Bloqueo temporal
             */
            if (
                respuesta &&
                (
                    respuesta.bloqueado === true ||
                    respuesta.error === "BLOQUEO_TEMPORAL"
                )
            ) {

                const segundos =
                    Number(respuesta.reintentarEnSegundos) ||
                    (15 * 60);

                iniciarTemporizadorBloqueo(segundos);

                return;
            }

            /*
             * Contraseña incorrecta
             */
            if (
                respuesta &&
                typeof respuesta.intentosRestantes === "number"
            ) {

                if (respuesta.intentosRestantes > 0) {

                    mostrarMensajeHtmlSeguro(
                        `❌ Contraseña incorrecta. ` +
                        `Te quedan ` +
                        `<strong>${respuesta.intentosRestantes}</strong>` +
                        ` intento(s).`,
                        "error"
                    );

                } else {

                    iniciarTemporizadorBloqueo(
                        15 * 60
                    );
                }

                return;
            }

            /*
             * Error devuelto por el servidor o genérico.
             *
             * Usamos textContent a través de mostrarMensaje
             * para garantizar total seguridad.
             */
            mostrarMensaje(
                (respuesta && respuesta.mensaje)
                    ? respuesta.mensaje
                    : "❌ Error al verificar las credenciales. Comprueba los datos e inténtalo de nuevo.",
                "error"
            );

        } finally {

            /*
             * Si el login ha tenido éxito, autorizarYDesbloquearApp()
             * ya está gestionando la interfaz.
             *
             * En cualquier otro caso, restauramos el botón.
             */
            if (btnAcceso) {
                btnAcceso.disabled = false;
            }

            if (btnTexto) {
                btnTexto.style.display = "inline";
            }

            if (btnSpinner) {
                btnSpinner.style.display = "none";
            }
        }
    }


    // ── 12. Inicialización de eventos ──

    document.addEventListener("DOMContentLoaded", () => {

        // Mostrar / ocultar contraseña
        const btnTogglePass =
            document.getElementById(
                "btnTogglePasswordPrelaunch"
            );

        const inputPass =
            document.getElementById(
                "inputPrelaunchPass"
            );

        if (btnTogglePass && inputPass) {

            btnTogglePass.addEventListener(
                "click",
                () => {

                    const esPass =
                        inputPass.type === "password";

                    inputPass.type =
                        esPass ? "text" : "password";

                    btnTogglePass.textContent =
                        esPass ? "🙈" : "👁️";
                }
            );
        }


        // Formulario
        const form =
            document.getElementById(
                "formAccesoPrelaunch"
            );

        if (form) {
            form.addEventListener(
                "submit",
                procesarLogin
            );
        }


        // Selector de tema
        const btnTema =
            document.getElementById(
                "btnToggleTemaPrelaunch"
            );

        if (btnTema) {

            btnTema.addEventListener(
                "click",
                () => {

                    const botonModoGlobal =
                        document.getElementById(
                            "botonModo"
                        );

                    if (botonModoGlobal) {
                        botonModoGlobal.click();
                    }
                }
            );
        }


        // Verificación inicial con el backend
        verificarEstadoServidor();
    });

})();