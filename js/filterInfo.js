/*
=========================================================
FILTER INFO
Información estática de cada filtro.
No contiene lógica.
No modifica HTML.
=========================================================
*/

const FILTER_INFO = {

    tipoPack: {

        nombre: "Tipo de pack",

        icono: "📦",

        descripcion: "Filtra los solares según el tipo de contenido al que pertenece el pack."

    },



    nombrePack: {

        nombre: "Nombre del pack",

        icono: "🎮",

        descripcion: "Permite seleccionar uno o varios packs concretos."

    },



    mundo: {

        nombre: "Mundo",

        icono: "🌎",

        descripcion: "Muestra únicamente los solares pertenecientes a los mundos seleccionados."

    },



    barrio: {

        nombre: "Barrio",

        icono: "🏘️",

        descripcion: "Filtra los barrios disponibles dentro de los mundos seleccionados."

    },



    tipoLote: {

        nombre: "Tipo de lote",

        icono: "🏡",

        descripcion: "Permite limitar la búsqueda por el tipo de lote."

    },



    tipoSolar: {

        nombre: "Tipo de solar",

        icono: "🏠",

        descripcion: "Filtra según el tipo de solar existente. segun los disponibles en los mundos de serie."

    },



    tamaño: {

        nombre: "Tamaño",

        icono: "📐",

        descripcion: "Selecciona uno o varios tamaños de solar."

    },



    orientacion: {

        nombre: "Orientación",

        icono: "🧭",

        descripcion: "Filtra según la orientación del solar cuando se comparte en la galeria, para saber cual es el lado desde el cual la galeria toma la imagen."

    },



    acera: {

        nombre: "Acera",

        icono: "🚶",

        descripcion: "Cantidad de lados de acera que tiene un solar."

    }

};





function obtenerInfoFiltro(nombre) {

    return FILTER_INFO[nombre] || null;

}





function obtenerNombreFiltro(nombre) {

    const info = obtenerInfoFiltro(nombre);

    return info ? info.nombre : nombre;

}





function obtenerIconoFiltro(nombre) {

    const info = obtenerInfoFiltro(nombre);

    return info ? info.icono : "";

}





function obtenerDescripcionFiltro(nombre) {

    const info = obtenerInfoFiltro(nombre);

    return info ? info.descripcion : "";

}





console.log("✔ filterInfo cargado");