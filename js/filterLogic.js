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

    return [...opciones].sort((a, b) =>

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





function obtenerResultadosOrdenados(campo = "nombre") {

    const lista = [...obtenerResultadosBusqueda()];

    lista.sort((a, b) => {

        const A = (a[campo] || "").toString();

        const B = (b[campo] || "").toString();

        return A.localeCompare(

            B,

            "es",

            {

                numeric: true,

                sensitivity: "base"

            }

        );

    });

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