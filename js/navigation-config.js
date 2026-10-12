/* ==========================================================
   CONFIGURACIÓN Y REGISTRO CENTRALIZADO DE NAVEGACIÓN
   js/navigation-config.js
   LOT-LAB Sims 4 (Sincronizado desde CMS)
   ========================================================== */

const REGISTRO_NAVEGACION = [
    {
        "id": "inicio",
        "nombre": "Inicio",
        "icono": "🏠",
        "herramientas": [
            {
                "id": "acerca-de",
                "nombre": "Acerca de",
                "icono": "👋",
                "disponible": true,
                "descripcion": "Herramienta Acerca de",
                "ruta": "inicio/acerca-de",
                "archivo": "acerca-de.json"
            }
        ]
    },
    {
        "id": "solares",
        "nombre": "Solares",
        "icono": "🔍",
        "herramientas": [
            {
                "id": "buscador",
                "nombre": "Filtrador de solares",
                "icono": "🔍",
                "disponible": true,
                "descripcion": "Herramienta Filtrador de solares",
                "ruta": "solares/buscador",
                "archivo": "buscador-solares.json"
            },
            {
                "id": "listado",
                "nombre": "Listado de solares",
                "icono": "📋",
                "disponible": true,
                "descripcion": "Herramienta Listado de solares",
                "ruta": "solares/listado",
                "archivo": "listado-solares.json"
            }
        ]
    },
    {
        "id": "generadores",
        "nombre": "Generadores",
        "icono": "🎲",
        "herramientas": [
            {
                "id": "dados",
                "nombre": "Tirador de dados",
                "icono": "🎲",
                "disponible": true,
                "descripcion": "Herramienta Tirador de dados",
                "ruta": "generadores/dados",
                "archivo": "dados.json"
            },
            {
                "id": "ruleta-colores",
                "nombre": "Ruleta de colores",
                "icono": "🎨",
                "disponible": true,
                "descripcion": "Herramienta Ruleta de colores",
                "ruta": "generadores/ruleta-colores",
                "archivo": "ruleta-colores.json"
            },
            {
                "id": "habilidades-azar",
                "nombre": "Habilidades al azar",
                "icono": "🧠",
                "disponible": true,
                "descripcion": "Herramienta Habilidades al azar",
                "ruta": "generadores/habilidades-azar",
                "archivo": "habilidades-azar.json"
            },
            {
                "id": "packs-azar",
                "nombre": "Packs al azar",
                "icono": "🎁",
                "disponible": true,
                "descripcion": "Herramienta Packs al azar",
                "ruta": "generadores/packs-azar",
                "archivo": "packs-azar.json"
            },
            {
                "id": "mundos-azar",
                "nombre": "Mundos al azar",
                "icono": "🌍",
                "disponible": true,
                "descripcion": "Herramienta Mundos al azar",
                "ruta": "generadores/mundos-azar",
                "archivo": "mundos-azar.json"
            }
        ]
    },
    {
        "id": "herramientas",
        "nombre": "Herramientas",
        "icono": "🛠️",
        "herramientas": [
            {
                "id": "trucos",
                "nombre": "Trucos",
                "icono": "🕹️",
                "disponible": true,
                "descripcion": "Sección Trucos",
                "ruta": "herramientas/trucos"
            },
            {
                "id": "temporizador",
                "nombre": "Temporizador",
                "icono": "⏱️",
                "disponible": true,
                "descripcion": "Herramienta Temporizador",
                "ruta": "herramientas/temporizador",
                "archivo": "temporizador.json"
            },
            {
                "id": "tier-list",
                "nombre": "Tier List",
                "icono": "📊",
                "disponible": true,
                "descripcion": "Herramienta Tier List",
                "ruta": "herramientas/tier-list",
                "archivo": "tier-list.json"
            }
        ]
    },
    {
        "id": "retos",
        "nombre": "Retos",
        "icono": "🏆",
        "herramientas": [
            {
                "id": "modo-retos",
                "nombre": "Modo retos",
                "icono": "🏆",
                "disponible": true,
                "descripcion": "Herramienta Modo retos",
                "ruta": "retos/modo-retos",
                "archivo": "modo-retos.json"
            },
            {
                "id": "ruleta-desastres",
                "nombre": "Ruleta de desastres",
                "icono": "🎡",
                "disponible": true,
                "descripcion": "Herramienta Ruleta de desastres",
                "ruta": "retos/ruleta-desastres",
                "archivo": "ruleta-desastres.json"
            }
        ]
    },
    {
        "id": "datos",
        "nombre": "Datos",
        "icono": "📈",
        "herramientas": [
            {
                "id": "estadisticas",
                "nombre": "Estadísticas Sims 4",
                "icono": "📈",
                "disponible": true,
                "descripcion": "Herramienta Estadísticas Sims 4",
                "ruta": "datos/estadisticas",
                "archivo": "estadisticas.json"
            }
        ]
    },
    {
        "id": "descargas",
        "nombre": "Descargas",
        "icono": "📥",
        "herramientas": [
            {
                "id": "cc",
                "nombre": "CC",
                "icono": "🎨",
                "disponible": false,
                "descripcion": "Herramienta CC",
                "ruta": "descargas/cc",
                "archivo": "cc.json",
                "tooltip": "🏗️ Próximamente"
            },
            {
                "id": "simfile",
                "nombre": "SimFile",
                "icono": "🏡",
                "disponible": false,
                "descripcion": "Herramienta SimFile",
                "ruta": "descargas/simfile",
                "archivo": "simfile.json",
                "tooltip": "🏗️ Próximamente"
            }
        ]
    },
    {
        "id": "juegos",
        "nombre": "Juegos",
        "icono": "🎮",
        "herramientas": [
            {
                "id": "proximamente-juegos",
                "nombre": "Próximamente",
                "icono": "🎮",
                "disponible": false,
                "descripcion": "Herramienta Próximamente",
                "ruta": "juegos/proximamente",
                "archivo": "juegos-proximamente.json",
                "tooltip": "🏗️ Próximamente"
            }
        ]
    }
];

if (typeof window !== "undefined") {
    window.REGISTRO_NAVEGACION = REGISTRO_NAVEGACION;
}
