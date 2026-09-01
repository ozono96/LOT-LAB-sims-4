/*
=========================================================
FILTER CORE
Estado global del filtrador.
No genera HTML.
No conoce botones.
No conoce ventanas.
=========================================================
*/



let estadoFiltros = {};



let filtroAbierto = null;





function abrirFiltro(nombre){

    filtroAbierto = nombre;

}





function cerrarFiltro(){

    filtroAbierto = null;

}





function obtenerFiltroAbierto(){

    return filtroAbierto;

}





function aplicarFiltro(nombre,valores){

    if(!Array.isArray(valores)){

        valores=[valores];

    }

    valores=valores.filter(v=>v!==null && v!==undefined && v!=="");

    if(valores.length===0){

        eliminarFiltro(nombre);

        return;

    }

    estadoFiltros[nombre]=[...new Set(valores)];

}





function eliminarFiltro(nombre){

    delete estadoFiltros[nombre];

}





function eliminarTodosLosFiltros(){

    estadoFiltros={};

    filtroAbierto=null;

}





function existeFiltro(nombre){

    return estadoFiltros.hasOwnProperty(nombre);

}





function obtenerFiltro(nombre){

    if(!existeFiltro(nombre)){

        return [];

    }

    return [...estadoFiltros[nombre]];

}





function obtenerEstadoFiltros(){

    return structuredClone(estadoFiltros);

}





function numeroFiltrosAplicados(){

    return Object.keys(estadoFiltros).length;

}





function hayFiltros(){

    return numeroFiltrosAplicados()>0;

}





function filtroTieneValor(nombre,valor){

    if(!existeFiltro(nombre)){

        return false;

    }

    return estadoFiltros[nombre].includes(valor);

}





function alternarValorFiltro(nombre,valor){

    let lista=obtenerFiltro(nombre);

    if(lista.includes(valor)){

        lista=lista.filter(v=>v!==valor);

    }else{

        lista.push(valor);

    }

    aplicarFiltro(nombre,lista);

}





function contarValoresFiltro(nombre){

    return obtenerFiltro(nombre).length;

}

// Exponer funciones y getters/setters en window para sincronización OBS
window.obtenerEstadoFiltros = obtenerEstadoFiltros;
window.establecerEstadoFiltros = function(nuevoEstado) {
    estadoFiltros = structuredClone(nuevoEstado || {});
};
window.obtenerFiltroAbierto = obtenerFiltroAbierto;
window.establecerFiltroAbierto = function(nombre) {
    filtroAbierto = nombre;
};
window.abrirFiltro = abrirFiltro;
window.cerrarFiltro = cerrarFiltro;
window.aplicarFiltro = aplicarFiltro;
window.eliminarFiltro = eliminarFiltro;
window.eliminarTodosLosFiltros = eliminarTodosLosFiltros;
window.existeFiltro = existeFiltro;
window.obtenerFiltro = obtenerFiltro;
window.numeroFiltrosAplicados = numeroFiltrosAplicados;
window.hayFiltros = hayFiltros;
window.filtroTieneValor = filtroTieneValor;
window.alternarValorFiltro = alternarValorFiltro;
window.contarValoresFiltro = contarValoresFiltro;

console.log("✔ filterCore cargado");