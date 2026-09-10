/* ==========================================================
   CONFIGURACIÓN Y REGISTRO CENTRALIZADO DE NAVEGACIÓN
   js/navigation-config.js
   LOT-LAB Sims 4
   ========================================================== */

const REGISTRO_NAVEGACION = [
    {
        id: "inicio",
        nombre: "Inicio",
        icono: "🏠",
        herramientas: [
            {
                id: "acerca-de",
                nombre: "Acerca de",
                icono: "👋",
                disponible: true,
                descripcion: "Información y novedades de LOT-LAB"
            }
        ]
    },
    {
        id: "solares",
        nombre: "Solares",
        icono: "🔍",
        herramientas: [
            {
                id: "buscador",
                nombre: "Filtrador de solares",
                icono: "🔍",
                disponible: true,
                descripcion: "Busca y filtra solares del juego"
            },
            {
                id: "listado",
                nombre: "Listado de solares",
                icono: "📋",
                disponible: true,
                descripcion: "Listado completo de solares disponibles"
            }
        ]
    },
    {
        id: "generadores",
        nombre: "Generadores",
        icono: "🎲",
        herramientas: [
            {
                id: "dados",
                nombre: "Tirador de dados",
                icono: "🎲",
                disponible: true,
                descripcion: "Lanza dados personalizables"
            },
            {
                id: "ruleta-colores",
                nombre: "Ruleta de colores",
                icono: "🎨",
                disponible: true,
                descripcion: "Paletas de colores aleatorias para construir"
            },
            {
                id: "habilidades-azar",
                nombre: "Habilidades al azar",
                icono: "🧠",
                disponible: true,
                descripcion: "Habilidades aleatorias filtradas por pack"
            },
            {
                id: "packs-azar",
                nombre: "Packs al azar",
                icono: "🎁",
                disponible: true,
                descripcion: "Selección aleatoria de packs"
            },
            {
                id: "mundos-azar",
                nombre: "Mundos al azar",
                icono: "🌍",
                disponible: true,
                descripcion: "Selección aleatoria de mundos"
            }
        ]
    },
    {
        id: "retos",
        nombre: "Retos",
        icono: "🏆",
        herramientas: [
            {
                id: "modo-retos",
                nombre: "Modo retos",
                icono: "🏆",
                disponible: true,
                descripcion: "Generador de retos de construcción"
            },
            {
                id: "ruleta-desastres",
                nombre: "Ruleta de desastres",
                icono: "🎡",
                disponible: true,
                descripcion: "Desastres inesperados durante la partida"
            }
        ]
    },
    {
        id: "herramientas",
        nombre: "Herramientas",
        icono: "🛠️",
        herramientas: [
            {
                id: "temporizador",
                nombre: "Temporizador",
                icono: "⏱️",
                disponible: true,
                descripcion: "Temporizador para retos con alarmas"
            },
            {
                id: "trucos",
                nombre: "Trucos",
                icono: "🕹️",
                disponible: true,
                descripcion: "Trucos útiles para Los Sims 4"
            }
        ]
    },
    {
        id: "datos",
        nombre: "Datos",
        icono: "📊",
        herramientas: [
            {
                id: "estadisticas",
                nombre: "Estadísticas Sims 4",
                icono: "📊",
                disponible: true,
                descripcion: "Base de datos y estadísticas del juego"
            }
        ]
    },
    {
        id: "descargas",
        nombre: "Descargas",
        icono: "📥",
        herramientas: [
            {
                id: "cc",
                nombre: "CC",
                icono: "🎨",
                disponible: false,
                tooltip: "🏗️ Próximamente",
                descripcion: "Contenido personalizado"
            },
            {
                id: "simfile",
                nombre: "SimFile",
                icono: "🏡",
                disponible: false,
                tooltip: "🏗️ Próximamente",
                descripcion: "Archivos de guardado y partidas"
            }
        ]
    },
    {
        id: "juegos",
        nombre: "Juegos",
        icono: "🎮",
        herramientas: [
            {
                id: "proximamente-juegos",
                nombre: "Próximamente",
                icono: "🎮",
                disponible: false,
                tooltip: "🏗️ Próximamente",
                descripcion: "Futuros minijuegos"
            }
        ]
    }
];

if (typeof window !== "undefined") {
    window.REGISTRO_NAVEGACION = REGISTRO_NAVEGACION;
}
