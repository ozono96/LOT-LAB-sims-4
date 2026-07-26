/*
=========================================================
THEME
Gestiona el alternado entre modo día y modo noche.
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const body = document.body;

    const botonModo = document.getElementById("botonModo");

    const modoGuardado = localStorage.getItem("modoTema");

    if (modoGuardado === "dia") {

        body.classList.remove("modo-noche");
        body.classList.add("modo-dia");

    } else {

        // Por defecto (o si no hay nada guardado aún): modo noche
        body.classList.remove("modo-dia");
        body.classList.add("modo-noche");

    }

    botonModo.addEventListener("click", () => {

        const esNoche = body.classList.contains("modo-noche");

        if (esNoche) {

            body.classList.remove("modo-noche");
            body.classList.add("modo-dia");
            localStorage.setItem("modoTema", "dia");

        } else {

            body.classList.remove("modo-dia");
            body.classList.add("modo-noche");
            localStorage.setItem("modoTema", "noche");

        }

    });

});

console.log("✔ theme cargado");