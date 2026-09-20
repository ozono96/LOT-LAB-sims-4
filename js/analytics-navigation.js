/**
 * LOT-LAB — Integración GA4 para navegación SPA
 *
 * Objetivo:
 * Registrar en Google Analytics 4 las navegaciones internas
 * de LOT-LAB sin modificar navigation.js ni su lógica.
 *
 * IMPORTANTE:
 * - No abre ni cambia rutas.
 * - No modifica pushState/replaceState en su comportamiento original.
 * - No envía page_view durante la carga inicial.
 * - Solo registra un nuevo page_view cuando cambia realmente el hash.
 * - Mantiene el #hash dentro de page_location para distinguir
 *   las diferentes herramientas de LOT-LAB.
 */

(function () {
    "use strict";

    // ------------------------------------------------------------
    // 1. Comprobaciones iniciales
    // ------------------------------------------------------------

    if (typeof window === "undefined") return;

    if (typeof window.gtag !== "function") {
        console.warn(
            "[LOT-LAB GA4] gtag no está disponible. " +
            "No se registrarán navegaciones internas."
        );
        return;
    }

    // ------------------------------------------------------------
    // 2. Estado interno
    // ------------------------------------------------------------

    let ultimaRutaRegistrada = obtenerRutaActual();

    /**
     * Evita registrar dos veces exactamente la misma navegación
     * si varios eventos del navegador se disparan para el mismo cambio.
     */
    let ultimaURLRegistrada = null;

    // ------------------------------------------------------------
    // 3. Obtener la ruta actual
    // ------------------------------------------------------------

    function obtenerRutaActual() {
        return window.location.hash || "";
    }

    // ------------------------------------------------------------
    // 4. Registrar una navegación en GA4
    // ------------------------------------------------------------

    function registrarPageView() {
        const rutaActual = obtenerRutaActual();

        // Si la ruta no ha cambiado realmente, no hacemos nada.
        if (rutaActual === ultimaRutaRegistrada) {
            return;
        }

        ultimaRutaRegistrada = rutaActual;

        const urlActual = window.location.href;

        // Protección adicional contra duplicados.
        if (urlActual === ultimaURLRegistrada) {
            return;
        }

        ultimaURLRegistrada = urlActual;

        window.gtag("event", "page_view", {
            page_location: urlActual,
            page_title: document.title
        });

        console.log(
            "[LOT-LAB GA4] page_view registrado:",
            rutaActual || "(inicio)"
        );
    }

    // ------------------------------------------------------------
    // 5. Interceptar pushState
    // ------------------------------------------------------------
    //
    // IMPORTANTE:
    // Guardamos primero la función original y la ejecutamos
    // exactamente como estaba.
    //
    // Después comprobamos si realmente cambió el hash.
    //
    // No sustituimos el funcionamiento de navigation.js.
    // ------------------------------------------------------------

    const pushStateOriginal = window.history.pushState;

    window.history.pushState = function () {
        const rutaAntes = obtenerRutaActual();

        const resultado = pushStateOriginal.apply(
            window.history,
            arguments
        );

        const rutaDespues = obtenerRutaActual();

        if (rutaDespues !== rutaAntes) {
            registrarPageView();
        }

        return resultado;
    };

    // ------------------------------------------------------------
    // 6. Interceptar replaceState
    // ------------------------------------------------------------

    const replaceStateOriginal = window.history.replaceState;

    window.history.replaceState = function () {
        const rutaAntes = obtenerRutaActual();

        const resultado = replaceStateOriginal.apply(
            window.history,
            arguments
        );

        const rutaDespues = obtenerRutaActual();

        if (rutaDespues !== rutaAntes) {
            registrarPageView();
        }

        return resultado;
    };

    // ------------------------------------------------------------
    // 7. Navegación mediante atrás / adelante
    // ------------------------------------------------------------

    window.addEventListener("popstate", function () {
        registrarPageView();
    });

    // ------------------------------------------------------------
    // 8. Cambios directos del hash
    // ------------------------------------------------------------

    window.addEventListener("hashchange", function () {
        registrarPageView();
    });

    // ------------------------------------------------------------
    // 9. Mensaje de confirmación
    // ------------------------------------------------------------

    console.log(
        "[LOT-LAB GA4] Integración de navegación SPA cargada."
    );

})();