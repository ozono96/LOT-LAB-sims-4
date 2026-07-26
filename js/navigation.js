document.addEventListener("DOMContentLoaded", function(){





document.getElementById("botonBuscador")
.addEventListener("click",function(){



abrirVentana(
"ventanaBuscador"
);



});








document.getElementById("botonRetos")
.addEventListener("click",function(){



abrirVentana(
"ventanaRetos"
);



});








document.querySelectorAll(".cerrar")
.forEach(boton=>{

    boton.addEventListener("click",function(){

        const ventana = this.closest(".ventana");

        if(ventana){
            if (ventana.id === "ventanaRetosOpciones") {
                abrirVentana(window.ventanaAnterior || "ventanaRetos");
                return;
            }
            if (ventana.id === "ventanaRetoResultado") {
                abrirVentana("ventanaRetosOpciones");
                return;
            }

            ventana.style.display="none";
            comprobarVentanaVisible();
        }

    });

});







});









window.ventanaAnterior = "ventanaBuscador";
window.ventanaActual = "ventanaBuscador";

function abrirVentana(id){

if (window.ventanaActual !== id) {
    window.ventanaAnterior = window.ventanaActual;
    window.ventanaActual = id;
}

document.querySelectorAll(".ventana")
.forEach(ventana=>{

ventana.style.display="none";

});


const ventana =
document.getElementById(id);

if(ventana){

ventana.style.display="block";

}

}









function cerrarVentana(id){

    const ventana = document.getElementById(id);

    if(ventana){
        ventana.style.display="none";
        comprobarVentanaVisible();
    }

}

// Si ninguna ventana está visible, muestra la de "Acerca de..."
function comprobarVentanaVisible() {
    const hayAlgunaVisible = Array.from(document.querySelectorAll(".ventana"))
        .some(v => v.style.display === "block");

    if (!hayAlgunaVisible) {
        const acerca = document.getElementById("ventanaAcercaDe");
        if (acerca) acerca.style.display = "block";
    }
}