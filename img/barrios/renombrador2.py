import os

# Ruta de la carpeta principal
carpeta_raiz = r"C:\Users\ozono\OneDrive\Escritorio\Buscador-Solares-Sims4\img\barrios"

# Extensiones de imagen permitidas
extensiones = (".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff", ".webp")

for carpeta_actual, _, archivos in os.walk(carpeta_raiz):
    contador = 1

    for archivo in archivos:
        if not archivo.lower().endswith(extensiones):
            continue

        ruta_original = os.path.join(carpeta_actual, archivo)
        extension = os.path.splitext(archivo)[1].lower()

        if contador == 1:
            nuevo_nombre = f"foto{extension}"
        else:
            nuevo_nombre = f"foto_{contador}{extension}"

        ruta_nueva = os.path.join(carpeta_actual, nuevo_nombre)

        if ruta_original != ruta_nueva:
            os.rename(ruta_original, ruta_nueva)
            print(f"{ruta_original} -> {ruta_nueva}")

        contador += 1

print("Proceso terminado.")