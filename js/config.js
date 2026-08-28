const CONFIG = {
    API_KEY: "AIzaSyBAxi5sp19H7j8GiOnXZgo8p4CtxYUrasE",

    SHEETS: {
        SOLARES: "Solares",
        PACKS: "Listado de packs",
        MUNDOS: "Listado de mundos",
        OBJETIVOS: "Listado de objetivos",
        ESTILOS_ARQ: "Listado de estilos exteriores",
        ESTILOS_DECORACION: "Listado de estilos interiores",
        COLORES: "Listado de colores",
        // Columnas esperadas: A = Etapa, B = ID de foto, C = Pack requerido.
        ETAPAS_VIDA: "Listado de etapas de vida",
        // Columnas esperadas: A = Limitante, B = ID de foto.
        LIMITANTES_CONSTRUIR: "Listado de limitantes modo construir",
        LIMITANTES_COMPRAR: "Listado de limitantes modo comprar",
        ESTADISTICAS_SIMS4: "Estadísticas sims 4",
        HABILIDADES: "Listado de habilidades",
        TIPOS_SOLARES: "Listado de todos los tipos de solares"
    },

    SHEET_ID: "1uGganU7wrnQQ0mHMMcKUg3HrRQUtEs73gTGd4NCIgvI",

    // URL centralizada del Web App de Google Apps Script para autenticación y pre-lanzamiento
    AUTH_WEB_APP: "https://script.google.com/macros/s/AKfycbxOx2AAaD8zuTJWOX8y-vOkhrYGz_y0-E0AEhqJPDi1Dvq8oxgJnT8drZY8E_RQOJIbRw/exec",
    FECHA_LANZAMIENTO_MADRID: "2026-09-17T18:00:00+02:00",

    // Token de GitHub para aumentar el límite de peticiones de 60 a 5000/hora.
    // Crea uno en: https://github.com/settings/tokens (sin marcar ningún scope)
    GITHUB_TOKEN: ""
};