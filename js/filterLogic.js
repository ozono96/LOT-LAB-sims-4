/*
=========================================================
FILTER LOGIC
Lógica del filtrador.
No modifica HTML.
=========================================================
*/



function obtenerSolaresFiltrados(ignorarFiltro = null) {

    let lista = [...database.solares];

    Object.keys(estadoFiltros).forEach(filtro => {

        if (filtro === ignorarFiltro) return;

        const valores = estadoFiltros[filtro];

        if (!valores || valores.length === 0) return;

        lista = lista.filter(solar =>
            valores.includes(solar[filtro])
        );

    });

    return lista;

}





function obtenerResultadosBusqueda() {

    return obtenerSolaresFiltrados();

}





function obtenerOpcionesDisponibles(filtro) {

    const lista = obtenerSolaresFiltrados(filtro);

    const opciones = new Set();

    lista.forEach(solar => {

        if (

            solar[filtro] !== undefined &&
            solar[filtro] !== null &&
            solar[filtro] !== ""

        ) {

            opciones.add(solar[filtro]);

        }

    });

    let opcionesArray = [...opciones];

    // Orden personalizado para "mundo" según la hoja de Google
    if (filtro === "mundo" && database.mundos) {
        const ordenMundos = database.mundos.map(fila => (fila[0] || "").trim().toLowerCase()).filter(Boolean);
        return opcionesArray.sort((a, b) => {
            const idxA = ordenMundos.indexOf(a.toLowerCase());
            const idxB = ordenMundos.indexOf(b.toLowerCase());
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
        });
    }

    // Orden personalizado para "nombrePack" según la hoja de Google (por columnas y luego filas)
    if (filtro === "nombrePack" && database.packs) {
        const ordenPacks = [];
        const pares = [
            [0, 1],   // Expansión
            [2, 3],   // Contenido
            [4, 5],   // Accesorios
            [6, 7],   // Kits
            [8, 9],   // Gratis
            [10, 11]  // Juego Base
        ];
        // Leer columna a columna (tipo de pack) y luego de arriba a abajo
        pares.forEach(([colNombre, _]) => {
            database.packs.forEach(fila => {
                const nombre = (fila[colNombre] || "").trim().toLowerCase();
                if (nombre) ordenPacks.push(nombre);
            });
        });

        return opcionesArray.sort((a, b) => {
            const idxA = ordenPacks.indexOf(a.toLowerCase());
            const idxB = ordenPacks.indexOf(b.toLowerCase());
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
        });
    }

    // Orden alfabético por defecto para el resto de filtros
    return opcionesArray.sort((a, b) =>
        a.localeCompare(b, "es", { numeric: true, sensitivity: "base" })
    );
}





function obtenerTotalResultados() {

    return obtenerResultadosBusqueda().length;

}





function obtenerSolarAleatorio() {

    const lista = obtenerResultadosBusqueda();

    if (lista.length === 0) {

        return null;

    }

    return lista[

        Math.floor(

            Math.random() * lista.length

        )

    ];

}





function obtenerResultadosOrdenados(campo = null) {

    const lista = [...obtenerResultadosBusqueda()];
    
    if (campo) {
        lista.sort((a, b) => {
            const A = (a[campo] || "").toString();
            const B = (b[campo] || "").toString();
            return A.localeCompare(B, "es", { numeric: true, sensitivity: "base" });
        });
    }

    return lista;

}





function obtenerValoresCampo(campo) {

    return [

        ...new Set(

            database.solares

                .map(solar => solar[campo])

                .filter(Boolean)

        )

    ].sort((a, b) =>

        a.localeCompare(

            b,

            "es",

            {

                numeric: true,

                sensitivity: "base"

            }

        )

    );

}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function obtenerResumenFiltro(nombre) {

    const valores = obtenerFiltro(nombre);

    if (valores.length === 0) {

        return "Sin seleccionar";

    }

    return valores.join(", ");

}





function obtenerDatosTooltip(nombre) {

    return {

        titulo: obtenerNombreFiltro(nombre),

        descripcion: obtenerDescripcionFiltro(nombre),

        seleccionados: obtenerResumenFiltro(nombre)

    };

}





function obtenerOpcionesSeleccionadas(nombre) {

    return obtenerFiltro(nombre);

}





function filtroEstaDisponible(nombre) {

    return obtenerOpcionesDisponibles(nombre).length > 0;

}





function existeValorEnFiltro(nombre, valor) {

    return filtroTieneValor(nombre, valor);

}





function obtenerCantidadOpciones(nombre) {

    return contarValoresFiltro(nombre);

}





function buscarSolarPorId(id) {

    return database.solares.find(

        solar => solar.id == id

    ) || null;

}





function buscarSolaresPorCampo(campo, valor) {

    return database.solares.filter(

        solar => solar[campo] === valor

    );

}





function reiniciarBusqueda() {

    eliminarTodosLosFiltros();

}





console.log("✔ filterLogic cargado");