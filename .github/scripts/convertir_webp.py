"""
Script de conversión automática de imágenes a formato WebP para LOT-LAB Sims 4.
Recorre recursivamente el directorio img/ buscando imágenes en formatos tradicionales
(.png, .jpg, .jpeg, .bmp, .tif, .tiff, .gif), las convierte a WebP con calidad 85
respetando dimensiones y canal alfa, verifica la integridad del WebP resultante y
elimina el archivo original únicamente tras validar la conversión con éxito.
"""

import os
import sys
from PIL import Image, ImageOps

# Extensiones de imagen soportadas para conversión a WebP
EXTENSIONES_CONVERTIBLES = {
    '.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff', '.gif'
}


def convertir_imagen(ruta_origen):
    """
    Convierte una imagen individual a WebP y elimina el archivo original
    únicamente si el WebP generado es válido y no está vacío.
    """
    nombre_base, ext = os.path.splitext(ruta_origen)
    ruta_destino = nombre_base + '.webp'

    # Evitar sobreescribir si origen y destino son idénticos
    if ruta_origen.lower() == ruta_destino.lower():
        return False

    try:
        tam_origen = os.path.getsize(ruta_origen)
        if tam_origen == 0:
            print(f"[AVISO] Archivo vacío (0 bytes), omitiendo: {ruta_origen}")
            return False

        with Image.open(ruta_origen) as img:
            # 1. Respetar orientación EXIF
            try:
                img = ImageOps.exif_transpose(img) or img
            except Exception:
                pass

            # 2. Manejo de modos de color y canal alfa/transparencia
            modo = img.mode
            if modo in ('RGBA', 'LA'):
                pass  # Conservar canal alfa intacto
            elif modo == 'P':
                # Si tiene paleta con transparencia, convertir a RGBA; si no, a RGB
                if 'transparency' in img.info:
                    img = img.convert('RGBA')
                else:
                    img = img.convert('RGB')
            elif modo == 'CMYK':
                img = img.convert('RGB')
            elif modo not in ('RGB', 'L'):
                img = img.convert('RGBA' if 'A' in modo else 'RGB')

            # 3. Guardar en formato WebP con calidad 85 y compresión optimizada (method=6)
            img.save(ruta_destino, 'WEBP', quality=85, method=6)

        # ── VERIFICACIONES DE SEGURIDAD ──
        # 1. El archivo destino debe existir físicamente
        if not os.path.exists(ruta_destino):
            raise RuntimeError(f"El archivo WebP no fue creado en: {ruta_destino}")

        # 2. El tamaño debe ser mayor a 0 bytes
        tam_destino = os.path.getsize(ruta_destino)
        if tam_destino == 0:
            os.remove(ruta_destino)
            raise RuntimeError("El archivo WebP generado tiene 0 bytes")

        # 3. Validar que Pillow puede abrir e interpretar el WebP resultante
        with Image.open(ruta_destino) as img_val:
            img_val.verify()

        # ── ELIMINACIÓN SEGURA DEL ORIGINAL ──
        # Solo se ejecuta si todas las verificaciones anteriores fueron exitosas
        os.remove(ruta_origen)
        print(f"[CONVERTIDO] {ruta_origen} -> {ruta_destino} ({tam_origen:,} bytes -> {tam_destino:,} bytes)")
        return True

    except Exception as e:
        print(f"[ERROR] No se pudo convertir {ruta_origen}: {e}")
        # Si quedó un archivo destino corrupto o incompleto, limpiarlo
        if os.path.exists(ruta_destino) and os.path.exists(ruta_origen):
            try:
                os.remove(ruta_destino)
            except Exception:
                pass
        return False


def procesar_rutas(rutas):
    """
    Procesa una lista de archivos y/o directorios.
    Si se pasa un archivo, lo convierte directamente.
    Si se pasa un directorio, busca imágenes convertibles en su interior.
    """
    archivos_a_procesar = []

    for ruta in rutas:
        if not os.path.exists(ruta):
            print(f"[AVISO] Ruta no encontrada, omitiendo: {ruta}")
            continue
        if os.path.isdir(ruta):
            for root, _, files in os.walk(ruta):
                for file in files:
                    archivos_a_procesar.append(os.path.join(root, file))
        elif os.path.isfile(ruta):
            archivos_a_procesar.append(ruta)

    convertidos = 0
    fallidos = 0
    total_encontrados = 0

    print(f"=== Procesando {len(archivos_a_procesar)} archivo(s) candidato(s) ===")

    for ruta in archivos_a_procesar:
        _, ext = os.path.splitext(ruta)
        ext_lower = ext.lower()

        # Solo procesar formatos no-WebP
        if ext_lower in EXTENSIONES_CONVERTIBLES:
            total_encontrados += 1
            exito = convertir_imagen(ruta)
            if exito:
                convertidos += 1
            else:
                fallidos += 1

    print("\n=== Resumen de conversión ===")
    print(f"Imágenes detectadas: {total_encontrados}")
    print(f"Convertidas con éxito: {convertidos}")
    print(f"Errores / Omitidas: {fallidos}")

    if fallidos > 0:
        print(f"[AVISO] {fallidos} archivo(s) no pudieron convertirse y conservan su formato original.")


if __name__ == "__main__":
    rutas_a_procesar = sys.argv[1:] if len(sys.argv) > 1 else ["img"]
    procesar_rutas(rutas_a_procesar)
