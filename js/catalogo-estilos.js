/*!
 * LOT-LAB — catalogo-estilos.js v3
 * Inyección CSS en tiempo real de estilos del catálogo de botones
 * y modo de selección visual interactiva en la web pública / previsualización.
 */
(function () {
  'use strict';

  var CATALOGO_URL = 'data/settings-botones.json';
  var API_SAVE = '/api/settings/botones';
  var STYLE_ID = 'lotlab-btn-catalog';
  var CACHE_KEY = 'LotLabCatalogo';

  var FAMILIAS = {
    botonFiltro: '.botonFiltro:not(.seleccionada):not(.activo),.botonReto:not(.seleccionada):not(.activo)',
    opcionFiltro: '.opcionFiltroReto:not(.seleccionada):not(.activo),.opcionFiltro:not(.seleccionada):not(.btnPackIcono)',
    botonSecundario: '.botonSecundario',
    btnReroll: '.btnReroll',
    btnGirarRuleta: '.btnGirarRuleta',
    btnGirarDestacado: '.btnGirarDestacado,.habBtnTirar',
    botonDesastreToggle: '.botonDesastreToggle:not(.activo)',
    btnSaltarAnimacion: '.btnSaltarAnimacion',
    btnCategoriaDesplegable: '.btnCategoriaDesplegable',
    btnLimpiarBuscador: '.btnLimpiarBuscador',
    botonLotlab: '.boton-lotlab',
    botonModo: '#botonModo',
    botonSelectorTemas: '#botonSelectorTemas',
    botonSonido: '#botonSonido',
    botonSelectorModoNav: '#botonSelectorModoNav',
    botonOBS: '#botonOBS',
    botonAgradecimientos: '#botonAgradecimientos',
    botonIdioma: '#botonIdioma',
    btnCerrarModal: '.cerrar,.cerrarPequeno,.estatTiempoPanelCerrar,.estatDatePickerClose',
    btnPeligroBorrado: '.btnDesmarcarPopover,#borrarFiltros,.estatBtnBorrar',
    btnAcelerar: '.habBtnAcelerar',
    btnTimerPausar: '#botonPausar',
    btnTimerDetener: '#botonDetener'
  };

  var NOMBRES_FAMILIAS = {
    botonFiltro: 'Filtros de búsqueda',
    opcionFiltro: 'Opciones de filtro',
    botonSecundario: 'Botón secundario',
    btnReroll: 'Botón Re-roll',
    btnGirarRuleta: 'Girar ruleta',
    btnGirarDestacado: 'Girar destacado / Tirar dados',
    botonDesastreToggle: 'Interruptores de opciones',
    btnSaltarAnimacion: 'Saltar animación',
    btnCategoriaDesplegable: 'Categoría desplegable',
    btnLimpiarBuscador: 'Limpiar buscador',
    botonLotlab: 'Botón de contenido LOT-LAB',
    botonModo: 'Selector día/noche',
    botonSelectorTemas: 'Selector de temas',
    botonSonido: 'Control de sonido',
    botonSelectorModoNav: 'Modo navegación',
    botonOBS: 'OBS Overlay',
    botonAgradecimientos: 'Agradecimientos',
    botonIdioma: 'Selector de idioma',
    btnCerrarModal: 'Botón cerrar circular',
    btnPeligroBorrado: 'Peligro / Desmarcar / Borrado',
    btnAcelerar: 'Acelerador de tiradas',
    btnTimerPausar: 'Temporizador Pausar',
    btnTimerDetener: 'Temporizador Detener'
  };

  function obtenerModo() {
    return (document.body && document.body.classList.contains('modo-dia')) ? 'dia' : 'noche';
  }

  function resolverEstilo(id, cat) {
    if (!id || !cat || !Array.isArray(cat.estilos)) return null;
    for (var i = 0; i < cat.estilos.length; i++) {
      if (cat.estilos[i].id === id) return cat.estilos[i];
    }
    return null;
  }

  function obtenerTemaActivoObj() {
    if (window.TemasEstacionales) {
      if (typeof window.TemasEstacionales.obtenerTemaActivo === 'function') {
        var t = window.TemasEstacionales.obtenerTemaActivo();
        if (t) return t;
      }
      if (typeof window.TemasEstacionales.determinarModoActivo === 'function') {
        var m = window.TemasEstacionales.determinarModoActivo();
        if (m) return m;
      }
    }
    return null;
  }

  function obtenerTemaActivo() {
    var t = obtenerTemaActivoObj();
    return t ? t.id : null;
  }

  function estiloDisponible(est, tema) {
    var alc = est.alcance || 'global';
    if (alc === 'global') return true;
    if (Array.isArray(alc)) return !tema || alc.indexOf(tema) !== -1;
    return true;
  }

  function safeColor(v) {
    if (!v || typeof v !== 'string') return null;
    var t = v.trim();
    if (t === 'transparent' || t === 'currentColor' || t === 'inherit') return t;
    if (/^#([0-9a-fA-F]{3,8})$/.test(t)) return t;
    if (/^rgba?\([\d.,\s%]+\)$/.test(t)) return t;
    if (/^var\(--[-a-zA-Z0-9_,()\s%#.]+\)$/.test(t)) return t;
    if (/^linear-gradient\([\s\S]+\)$/.test(t)) return t;
    if (/^radial-gradient\([\s\S]+\)$/.test(t)) return t;
    if (/^color-mix\([\s\S]+\)$/.test(t)) return t;
    return null;
  }

  function prefijarSelector(prefijo, sel) {
    if (!sel) return '';
    return sel.split(',').map(function (s) {
      s = s.trim();
      if (!s) return '';
      return prefijo ? (prefijo + ' ' + s) : s;
    }).filter(Boolean).join(',');
  }

  function generarGlowShadowCSS(glowCfg, fallbackColor) {
    if (!glowCfg) return null;
    var tieneGlow = (glowCfg.glow !== undefined) ? !!glowCfg.glow : (!!glowCfg.glowTipoColor && glowCfg.glowTipoColor !== 'ninguno');
    if (!tieneGlow) return null;

    var tipoColor = glowCfg.glowTipoColor || 'personalizado';
    var cGlow = (tipoColor === 'tema') ? 'var(--color-resaltado, #2ecc71)'
              : (tipoColor === 'tema_dia') ? 'var(--color-resaltado-dia, #2ecc71)'
              : (tipoColor === 'tema_noche') ? 'var(--color-resaltado-noche, #2ecc71)'
              : (safeColor(glowCfg.glowColor) || fallbackColor || '#2ecc71');

    if (!cGlow) return null;

    if (glowCfg.glowEfecto === 'halo_multicapa') {
      var alpha1 = '.60', alpha2 = '.45', alpha3 = '.25';
      if (cGlow.includes('var(--color-resaltado-dia')) {
        return '0 0 8px rgba(var(--color-resaltado-dia-rgb, 46, 204, 113), ' + alpha1 + '), 0 0 18px rgba(var(--color-resaltado-dia-rgb, 46, 204, 113), ' + alpha2 + '), 0 0 30px rgba(var(--color-resaltado-dia-rgb, 46, 204, 113), ' + alpha3 + ')';
      } else if (cGlow.includes('var(--color-resaltado-noche')) {
        return '0 0 8px rgba(var(--color-resaltado-noche-rgb, 46, 204, 113), ' + alpha1 + '), 0 0 18px rgba(var(--color-resaltado-noche-rgb, 46, 204, 113), ' + alpha2 + '), 0 0 30px rgba(var(--color-resaltado-noche-rgb, 46, 204, 113), ' + alpha3 + ')';
      } else if (cGlow === 'var(--color-resaltado, #2ecc71)' || cGlow.includes('var(--color-resaltado')) {
        return '0 0 8px rgba(var(--color-resaltado-rgb, 46, 204, 113), ' + alpha1 + '), 0 0 18px rgba(var(--color-resaltado-rgb, 46, 204, 113), ' + alpha2 + '), 0 0 30px rgba(var(--color-resaltado-rgb, 46, 204, 113), ' + alpha3 + ')';
      } else if (cGlow.startsWith('#')) {
        var hexVal = cGlow.replace('#', '');
        if (hexVal.length === 3) hexVal = hexVal.split('').map(function (ch) { return ch + ch; }).join('');
        var num = parseInt(hexVal, 16);
        var rVal = (num >> 16) & 255, gVal = (num >> 8) & 255, bVal = num & 255;
        return '0 0 8px rgba(' + rVal + ',' + gVal + ',' + bVal + ',.60), 0 0 18px rgba(' + rVal + ',' + gVal + ',' + bVal + ',.45), 0 0 30px rgba(' + rVal + ',' + gVal + ',' + bVal + ',.25)';
      } else if (cGlow.startsWith('rgba')) {
        var mRgba = cGlow.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (mRgba) {
          return '0 0 8px rgba(' + mRgba[1] + ',' + mRgba[2] + ',' + mRgba[3] + ',.65), 0 0 18px rgba(' + mRgba[1] + ',' + mRgba[2] + ',' + mRgba[3] + ',.45), 0 0 30px rgba(' + mRgba[1] + ',' + mRgba[2] + ',' + mRgba[3] + ',.25)';
        }
      }
      return '0 0 15px ' + cGlow;
    } else {
      var gs = glowCfg.glowIntensidad === 'suave' ? '0 0 8px 2px' : glowCfg.glowIntensidad === 'fuerte' ? '0 0 20px 6px' : '0 0 12px 3px';
      return gs + ' ' + cGlow;
    }
  }

  function construirReglas(sel, datos, modo, excepciones) {
    var ap = (datos && datos.apariencia) ? datos.apariencia : {};
    var hv = (datos && datos.hover) ? datos.hover : {};
    var act = (datos && datos.activo) ? datos.activo : null;
    var exc = excepciones || (datos && datos.excepcionesDiaNoche) || {};
    if (modo && exc[modo]) {
      ap = Object.assign({}, ap, exc[modo]);
      if (exc[modo].hover) hv = Object.assign({}, hv, exc[modo].hover);
      if (exc[modo].activo) act = Object.assign({}, act, exc[modo].activo);
    }

    var r = [], c;
    if ((c = safeColor(ap.fondoColor))) {
      var opFondo = (typeof ap.opacidadFondo === 'number' && ap.opacidadFondo < 100) ? ap.opacidadFondo : null;
      if (opFondo !== null && opFondo >= 0 && opFondo <= 100 && c !== 'transparent') {
        r.push('background: color-mix(in srgb, ' + c + ' ' + opFondo + '%, transparent) !important');
      } else {
        r.push('background:' + c + ' !important');
      }
    }
    if ((c = safeColor(ap.textoColor))) r.push('color:' + c + ' !important');

    if (ap.bordeGrosor && ap.bordeGrosor !== '0' && ap.bordeGrosor !== '0px') {
      var bw = ap.bordeGrosor.trim();
      if (/^\d{1,4}(\.\d{1,2})?px$/.test(bw)) {
        var bc = safeColor(ap.bordeColor) || 'rgba(255,255,255,0.2)';
        r.push('border:' + bw + ' ' + (ap.bordeEstilo || 'solid') + ' ' + bc + ' !important');
      }
    } else if (ap.bordeGrosor === '0' || ap.bordeGrosor === '0px') {
      r.push('border:none !important');
    }

    if (ap.radio) {
      var rad = ap.radio.trim();
      if (/^[\d.\s]+(px|%)([\s\d.]+(px|%))*$/.test(rad) || /^var\(--/.test(rad)) {
        r.push('border-radius:' + rad + ' !important');
      }
    }

    if (typeof ap.opacidad === 'number' && ap.opacidad >= 0 && ap.opacidad < 1) {
      r.push('opacity:' + ap.opacidad + ' !important');
    }

    var dropSh = (ap.sombra && ap.sombraIntensidad !== 'ninguna')
      ? (ap.sombraIntensidad === 'suave' ? '0 4px 14px rgba(0,0,0,0.45)' : ap.sombraIntensidad === 'fuerte' ? '0 14px 34px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.6)')
      : '';
    var normalGlow = generarGlowShadowCSS(ap, modo === 'noche' ? '#ffd54a' : '#2ecc71');

    if (normalGlow && dropSh) {
      r.push('box-shadow:' + dropSh + ', ' + normalGlow + ' !important');
    } else if (normalGlow) {
      r.push('box-shadow:' + normalGlow + ' !important');
    } else if (dropSh) {
      r.push('box-shadow:' + dropSh + ' !important');
    } else {
      r.push('box-shadow:none !important');
    }

    if (typeof ap.blurPx === 'number' && ap.blurPx > 0) {
      r.push('backdrop-filter: blur(' + ap.blurPx + 'px) !important');
      r.push('-webkit-backdrop-filter: blur(' + ap.blurPx + 'px) !important');
    } else if (ap.blur || ap.superficieEstilo === 'glass_blur') {
      var bVal = ap.blurIntensidad === 'suave' ? '4px' : ap.blurIntensidad === 'fuerte' ? '16px' : ap.blurIntensidad === 'ultra' ? '24px' : '8px';
      r.push('backdrop-filter: blur(' + bVal + ') !important');
      r.push('-webkit-backdrop-filter: blur(' + bVal + ') !important');
    }

    var css = '';
    if (r.length) css += sel + '{' + r.join(';') + '}\n';

    var hr = [];
    if ((c = safeColor(hv.fondoColor))) hr.push('background:' + c + ' !important');
    if ((c = safeColor(hv.textoColor))) hr.push('color:' + c + ' !important');
    if ((c = safeColor(hv.bordeColor))) hr.push('border-color:' + c + ' !important');
    if (hv.escala) {
      var sc = (ap.radio === '50%' || ap.radio === 'circular') ? 'transform:scale(1.10) !important' : 'transform:translateY(-2px) scale(1.02) !important';
      hr.push(sc);
    }
    if (hv.glow) {
      var hGlow = generarGlowShadowCSS(hv, modo === 'noche' ? '#ffd54a' : '#2ecc71');
      if (hGlow && dropSh) {
        hr.push('box-shadow:' + dropSh + ', ' + hGlow + ' !important');
      } else if (hGlow) {
        hr.push('box-shadow:' + hGlow + ' !important');
      }
    }
    if (hr.length) {
      var hoverSel = sel.split(',').map(function (s) {
        s = s.trim();
        return s ? (s + ':hover') : '';
      }).filter(Boolean).join(',');
      css += hoverSel + '{' + hr.join(';') + '}\n';
    }

    if (act) {
      var ar = [];
      if ((c = safeColor(act.fondoColor))) ar.push('background:' + c + ' !important');
      if ((c = safeColor(act.textoColor))) ar.push('color:' + c + ' !important');
      if ((c = safeColor(act.bordeColor))) ar.push('border-color:' + c + ' !important');

      var aGlow = generarGlowShadowCSS(act, modo === 'noche' ? '#ffd54a' : '#2ecc71');
      if (aGlow && dropSh) {
        ar.push('box-shadow:' + dropSh + ', ' + aGlow + ' !important');
      } else if (aGlow) {
        ar.push('box-shadow:' + aGlow + ' !important');
      }

      if (ar.length) {
        var actSel = sel.split(',').map(function (s) {
          s = s.trim().replace(/:not\(\.(seleccionada|activo)\)/g, '');
          return s ? (s + '.activo,' + s + '.seleccionada,' + s + ':active') : '';
        }).filter(Boolean).join(',');
        css += actSel + '{' + ar.join(';') + '}\n';
      }
    }

    return css;
  }

  function inyectar(cat) {
    if (!cat) return;
    var asig = cat.asignacionesFuncionales || {};
    var modo = obtenerModo();
    var tema = obtenerTemaActivo();
    var cssFamilias = '';
    var cssBotones = '';

    Object.keys(asig).forEach(function (clave) {
      var a = asig[clave];
      if (!a || !a.estiloId) return;
      var est = resolverEstilo(a.estiloId, cat);
      if (!est || !estiloDisponible(est, tema)) return;
      var sel = (a && a.selector) ? a.selector : FAMILIAS[clave];
      if (!sel && (clave.startsWith('#') || clave.startsWith('.') || clave.startsWith('['))) {
        sel = clave;
      }
      if (!sel) return;
      var datos = est.datos || {};
      var exc = est.excepcionesDiaNoche || datos.excepcionesDiaNoche || null;

      // 1. Reglas específicas para modo noche (prefijando cada selector de la lista)
      var nocheSel = prefijarSelector('body.modo-noche', sel);
      var nocheCSS = construirReglas(nocheSel, datos, 'noche', exc);

      // 2. Reglas específicas para modo día (prefijando cada selector de la lista)
      var diaSel = prefijarSelector('body.modo-dia', sel);
      var diaCSS = construirReglas(diaSel, datos, 'dia', exc);

      // 3. Reglas base/fallback
      var baseCSS = construirReglas(sel, datos, modo, exc);

      // 4. Reglas específicas por Tema Estacional (excepcionesPorTema)
      var temaCSS = '';
      var excTema = est.excepcionesPorTema || (datos && datos.excepcionesPorTema) || null;
      if (excTema && typeof excTema === 'object') {
        Object.keys(excTema).forEach(function (tId) {
          var tCfg = excTema[tId];
          if (!tCfg || typeof tCfg !== 'object') return;
          var tPrefijo = 'body.tema-' + tId;

          // Excepción Noche para este tema
          if (tCfg.noche) {
            var tNocheSel = prefijarSelector(tPrefijo + '.modo-noche', sel);
            temaCSS += construirReglas(tNocheSel, datos, 'noche', { noche: tCfg.noche });
          }
          // Excepción Día para este tema
          if (tCfg.dia) {
            var tDiaSel = prefijarSelector(tPrefijo + '.modo-dia', sel);
            temaCSS += construirReglas(tDiaSel, datos, 'dia', { dia: tCfg.dia });
          }
        });
      }

      var bloque = nocheCSS + diaCSS + baseCSS + temaCSS;
      if (FAMILIAS[clave] && !(a && a.selector)) {
        cssFamilias += bloque;
      } else {
        cssBotones += bloque;
      }
    });

    var cssBase = '\n.botonAgradecimientosBtn .icono-corazon, #botonAgradecimientos .icono-corazon, #botonAgradecimientos svg { fill: currentColor !important; }\n';

    var cssTemporizadorFinal = '\n/* Reglas maestras: Botones del Temporizador idénticos en Modo Día y Modo Noche */\n' +
      '#pausarTemporizador:not(.enPausa), body.modo-dia #pausarTemporizador:not(.enPausa), body.modo-noche #pausarTemporizador:not(.enPausa), ' +
      '.btnTimerPause:not(.enPausa), body.modo-dia .btnTimerPause:not(.enPausa), body.modo-noche .btnTimerPause:not(.enPausa) {\n' +
      '  background: #cf7017 !important;\n' +
      '  border: 3px solid #cf7017 !important;\n' +
      '  border-color: #cf7017 !important;\n' +
      '  color: #ffffff !important;\n' +
      '}\n' +
      '#pausarTemporizador:not(.enPausa):hover, body.modo-dia #pausarTemporizador:not(.enPausa):hover, body.modo-noche #pausarTemporizador:not(.enPausa):hover, ' +
      '.btnTimerPause:not(.enPausa):hover, body.modo-dia .btnTimerPause:not(.enPausa):hover, body.modo-noche .btnTimerPause:not(.enPausa):hover {\n' +
      '  background: #e67e22 !important;\n' +
      '  border: 3px solid #e67e22 !important;\n' +
      '  border-color: #e67e22 !important;\n' +
      '  color: #ffffff !important;\n' +
      '  transform: translateY(-2px) !important;\n' +
      '  box-shadow: 0 0 16px rgba(207, 112, 23, 0.65) !important;\n' +
      '}\n' +
      '#pausarTemporizador.enPausa, body.modo-dia #pausarTemporizador.enPausa, body.modo-noche #pausarTemporizador.enPausa, ' +
      '.btnTimerPause.enPausa, body.modo-dia .btnTimerPause.enPausa, body.modo-noche .btnTimerPause.enPausa {\n' +
      '  background: #00c853 !important;\n' +
      '  border: 3px solid #00e676 !important;\n' +
      '  border-color: #00e676 !important;\n' +
      '  color: #ffffff !important;\n' +
      '}\n' +
      '#pausarTemporizador.enPausa:hover, body.modo-dia #pausarTemporizador.enPausa:hover, body.modo-noche #pausarTemporizador.enPausa:hover, ' +
      '.btnTimerPause.enPausa:hover, body.modo-dia .btnTimerPause.enPausa:hover, body.modo-noche .btnTimerPause.enPausa:hover {\n' +
      '  background: #00e676 !important;\n' +
      '  border: 3px solid #00c853 !important;\n' +
      '  border-color: #00c853 !important;\n' +
      '  color: #ffffff !important;\n' +
      '  transform: translateY(-2px) !important;\n' +
      '  box-shadow: 0 0 16px rgba(0, 230, 118, 0.65) !important;\n' +
      '}\n' +
      '#detenerTemporizador, body.modo-dia #detenerTemporizador, body.modo-noche #detenerTemporizador, ' +
      '.btnTimerStop, body.modo-dia .btnTimerStop, body.modo-noche .btnTimerStop {\n' +
      '  background: #e60000 !important;\n' +
      '  border: 3px solid #cc2e2e !important;\n' +
      '  border-color: #cc2e2e !important;\n' +
      '  color: #ffffff !important;\n' +
      '}\n' +
      '#detenerTemporizador:hover, body.modo-dia #detenerTemporizador:hover, body.modo-noche #detenerTemporizador:hover, ' +
      '.btnTimerStop:hover, body.modo-dia .btnTimerStop:hover, body.modo-noche .btnTimerStop:hover {\n' +
      '  background: #ff1a1a !important;\n' +
      '  border: 3px solid #e60000 !important;\n' +
      '  border-color: #e60000 !important;\n' +
      '  color: #ffffff !important;\n' +
      '  transform: translateY(-2px) !important;\n' +
      '  box-shadow: 0 0 16px rgba(230, 0, 0, 0.65) !important;\n' +
      '}\n' +
      '/* Botón Girar Ruleta de Colores: 100% circular con marquito blanco interno y color de resaltado */\n' +
      '.btnGirarRuleta, #botonGirarRuleta, body.modo-dia .btnGirarRuleta, body.modo-dia #botonGirarRuleta, body.modo-noche .btnGirarRuleta, body.modo-noche #botonGirarRuleta {\n' +
      '  position: absolute !important;\n' +
      '  top: calc(50% - 32px) !important;\n' +
      '  left: calc(50% - 32px) !important;\n' +
      '  transform: none !important;\n' +
      '  width: 64px !important;\n' +
      '  height: 64px !important;\n' +
      '  min-width: 64px !important;\n' +
      '  min-height: 64px !important;\n' +
      '  max-width: 64px !important;\n' +
      '  max-height: 64px !important;\n' +
      '  aspect-ratio: 1 / 1 !important;\n' +
      '  border-radius: 50% !important;\n' +
      '  border: 3.5px solid #ffffff !important;\n' +
      '  border-color: #ffffff !important;\n' +
      '  background: var(--color-resaltado) !important;\n' +
      '  color: #ffffff !important;\n' +
      '  font-weight: bold !important;\n' +
      '  font-size: 0.95rem !important;\n' +
      '  cursor: pointer !important;\n' +
      '  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 0 0 1.5px rgba(255, 255, 255, 0.35) !important;\n' +
      '  z-index: 6 !important;\n' +
      '  display: flex !important;\n' +
      '  align-items: center !important;\n' +
      '  justify-content: center !important;\n' +
      '  padding: 0 !important;\n' +
      '  box-sizing: border-box !important;\n' +
      '}\n' +
      '.btnGirarRuleta:hover:not(:disabled), #botonGirarRuleta:hover:not(:disabled), body.modo-dia .btnGirarRuleta:hover:not(:disabled), body.modo-dia #botonGirarRuleta:hover:not(:disabled), body.modo-noche .btnGirarRuleta:hover:not(:disabled), body.modo-noche #botonGirarRuleta:hover:not(:disabled) {\n' +
      '  background: color-mix(in srgb, var(--color-resaltado) 88%, white) !important;\n' +
      '  color: #ffffff !important;\n' +
      '  border: 3.5px solid #ffffff !important;\n' +
      '  border-color: #ffffff !important;\n' +
      '  box-shadow: 0 0 12px rgba(var(--color-resaltado-rgb), 0.65), 0 0 24px rgba(var(--color-resaltado-rgb), 0.45), 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 0 0 1.5px rgba(255, 255, 255, 0.5) !important;\n' +
      '  transform: scale(1.04) !important;\n' +
      '}\n' +
      '.btnGirarRuleta:active:not(:disabled), #botonGirarRuleta:active:not(:disabled) {\n' +
      '  transform: scale(0.96) !important;\n' +
      '}\n' +
      '.btnGirarRuleta:disabled, #botonGirarRuleta:disabled {\n' +
      '  opacity: 0.6 !important;\n' +
      '  cursor: not-allowed !important;\n' +
      '}\n' +
      '@media (max-width: 700px) {\n' +
      '  .btnGirarRuleta, #botonGirarRuleta, body.modo-dia .btnGirarRuleta, body.modo-dia #botonGirarRuleta, body.modo-noche .btnGirarRuleta, body.modo-noche #botonGirarRuleta {\n' +
      '    width: 54px !important;\n' +
      '    height: 54px !important;\n' +
      '    min-width: 54px !important;\n' +
      '    min-height: 54px !important;\n' +
      '    max-width: 54px !important;\n' +
      '    max-height: 54px !important;\n' +
      '    aspect-ratio: 1 / 1 !important;\n' +
      '    border-radius: 50% !important;\n' +
      '    font-size: 0.85rem !important;\n' +
      '    top: calc(50% - 27px) !important;\n' +
      '    left: calc(50% - 27px) !important;\n' +
      '    padding: 0 !important;\n' +
      '  }\n' +
      '}\n' +
      '/* Botón Acelerar: Verde en reposo (Acelerar) y Naranja con brillo intenso cuando activo (Acelerado) */\n' +
      '.habBtnAcelerar, button.habBtnAcelerar, button:not(.cerrar).habBtnAcelerar, ' +
      'body.modo-dia .habBtnAcelerar, body.modo-dia button.habBtnAcelerar, body.modo-dia button:not(.cerrar).habBtnAcelerar, ' +
      'body.modo-noche .habBtnAcelerar, body.modo-noche button.habBtnAcelerar, body.modo-noche button:not(.cerrar).habBtnAcelerar {\n' +
      '  border: 3px solid #00e676 !important;\n' +
      '  border-color: #00e676 !important;\n' +
      '  background: #00c853 !important;\n' +
      '  color: #ffffff !important;\n' +
      '  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 230, 118, 0.5) !important;\n' +
      '  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);\n' +
      '}\n' +
      '.habBtnAcelerar:hover, button.habBtnAcelerar:hover, button:not(.cerrar).habBtnAcelerar:hover, ' +
      'body.modo-dia .habBtnAcelerar:hover, body.modo-dia button.habBtnAcelerar:hover, body.modo-dia button:not(.cerrar).habBtnAcelerar:hover, ' +
      'body.modo-noche .habBtnAcelerar:hover, body.modo-noche button.habBtnAcelerar:hover, body.modo-noche button:not(.cerrar).habBtnAcelerar:hover {\n' +
      '  background: #00e676 !important;\n' +
      '  border: 3px solid #00c853 !important;\n' +
      '  border-color: #00c853 !important;\n' +
      '  color: #ffffff !important;\n' +
      '  transform: translateY(-2px) scale(1.03) !important;\n' +
      '  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), 0 0 24px rgba(0, 230, 118, 0.75) !important;\n' +
      '}\n' +
      '.habBtnAcelerar.habBtnAcelerar--activo, .habBtnAcelerar.activo, ' +
      'button.habBtnAcelerar.habBtnAcelerar--activo, button.habBtnAcelerar.activo, ' +
      'button:not(.cerrar).habBtnAcelerar.habBtnAcelerar--activo, button:not(.cerrar).habBtnAcelerar.activo, ' +
      'body.modo-dia .habBtnAcelerar.habBtnAcelerar--activo, body.modo-dia .habBtnAcelerar.activo, ' +
      'body.modo-dia button.habBtnAcelerar.habBtnAcelerar--activo, body.modo-dia button.habBtnAcelerar.activo, ' +
      'body.modo-dia button:not(.cerrar).habBtnAcelerar.habBtnAcelerar--activo, body.modo-dia button:not(.cerrar).habBtnAcelerar.activo, ' +
      'body.modo-noche .habBtnAcelerar.habBtnAcelerar--activo, body.modo-noche .habBtnAcelerar.activo, ' +
      'body.modo-noche button.habBtnAcelerar.habBtnAcelerar--activo, body.modo-noche button.habBtnAcelerar.activo, ' +
      'body.modo-noche button:not(.cerrar).habBtnAcelerar.habBtnAcelerar--activo, body.modo-noche button:not(.cerrar).habBtnAcelerar.activo {\n' +
      '  border: 3px solid #e67e22 !important;\n' +
      '  border-color: #e67e22 !important;\n' +
      '  background: #cf7017 !important;\n' +
      '  color: #ffffff !important;\n' +
      '  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 24px rgba(230, 126, 34, 0.85), 0 0 45px rgba(207, 112, 23, 0.5) !important;\n' +
      '  animation: brilloAceleradoNaranja 0.8s ease-in-out infinite alternate !important;\n' +
      '}\n' +
      '.habBtnAcelerar.habBtnAcelerar--activo:hover, .habBtnAcelerar.activo:hover, ' +
      'button.habBtnAcelerar.habBtnAcelerar--activo:hover, button.habBtnAcelerar.activo:hover, ' +
      'button:not(.cerrar).habBtnAcelerar.habBtnAcelerar--activo:hover, button:not(.cerrar).habBtnAcelerar.activo:hover, ' +
      'body.modo-dia .habBtnAcelerar.habBtnAcelerar--activo:hover, body.modo-dia .habBtnAcelerar.activo:hover, ' +
      'body.modo-dia button.habBtnAcelerar.habBtnAcelerar--activo:hover, body.modo-dia button.habBtnAcelerar.activo:hover, ' +
      'body.modo-dia button:not(.cerrar).habBtnAcelerar.habBtnAcelerar--activo:hover, body.modo-dia button:not(.cerrar).habBtnAcelerar.activo:hover, ' +
      'body.modo-noche .habBtnAcelerar.habBtnAcelerar--activo:hover, body.modo-noche .habBtnAcelerar.activo:hover, ' +
      'body.modo-noche button.habBtnAcelerar.habBtnAcelerar--activo:hover, body.modo-noche button.habBtnAcelerar.activo:hover, ' +
      'body.modo-noche button:not(.cerrar).habBtnAcelerar.habBtnAcelerar--activo:hover, body.modo-noche button:not(.cerrar).habBtnAcelerar.activo:hover {\n' +
      '  background: #e67e22 !important;\n' +
      '  border: 3px solid #cf7017 !important;\n' +
      '  border-color: #cf7017 !important;\n' +
      '  color: #ffffff !important;\n' +
      '  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45), 0 0 32px rgba(230, 126, 34, 0.95), 0 0 60px rgba(207, 112, 23, 0.65) !important;\n' +
      '}\n';

    var css = cssBase + cssFamilias + (cssBotones ? ('\n/* Asignaciones individuales por botón */\n' + cssBotones) : '') + cssTemporizadorFinal;

    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = css;
  }

  function sincronizarEstilosTemporizador(cat) {
    if (!cat) return;
    if (cat.asignacionesFuncionales && cat.asignacionesFuncionales.btnGirarRuleta) {
      cat.asignacionesFuncionales.btnGirarRuleta.estiloId = 'est_ruleta_girar_circular';
    }
    if (!Array.isArray(cat.estilos)) return;
    cat.estilos.forEach(function (e) {
      if (e.id === 'est_pausartemporizador') {
        if (!e.datos) e.datos = {};
        if (!e.datos.apariencia) e.datos.apariencia = {};
        e.datos.apariencia.fondoColor = '#cf7017';
        e.datos.apariencia.bordeColor = '#cf7017';
        e.datos.apariencia.opacidadFondo = 100;
        if (!e.datos.hover) e.datos.hover = {};
        e.datos.hover.fondoColor = '#e67e22';
        e.datos.hover.bordeColor = '#e67e22';
        if (e.excepcionesDiaNoche) {
          if (e.excepcionesDiaNoche.dia) {
            e.excepcionesDiaNoche.dia.fondoColor = '#cf7017';
            e.excepcionesDiaNoche.dia.bordeColor = '#cf7017';
            e.excepcionesDiaNoche.dia.opacidadFondo = 100;
          }
          if (e.excepcionesDiaNoche.noche) {
            e.excepcionesDiaNoche.noche.fondoColor = '#cf7017';
            e.excepcionesDiaNoche.noche.bordeColor = '#cf7017';
            e.excepcionesDiaNoche.noche.opacidadFondo = 100;
          }
        }
      }
      if (e.id === 'est_detenertemporizador') {
        if (!e.datos) e.datos = {};
        if (!e.datos.apariencia) e.datos.apariencia = {};
        e.datos.apariencia.fondoColor = '#e60000';
        e.datos.apariencia.bordeColor = '#cc2e2e';
        e.datos.apariencia.opacidadFondo = 100;
        if (!e.datos.hover) e.datos.hover = {};
        e.datos.hover.fondoColor = '#ff1a1a';
        e.datos.hover.bordeColor = '#e60000';
        if (e.excepcionesDiaNoche) {
          if (e.excepcionesDiaNoche.dia) {
            e.excepcionesDiaNoche.dia.fondoColor = '#e60000';
            e.excepcionesDiaNoche.dia.bordeColor = '#cc2e2e';
            e.excepcionesDiaNoche.dia.opacidadFondo = 100;
          }
          if (e.excepcionesDiaNoche.noche) {
            e.excepcionesDiaNoche.noche.fondoColor = '#e60000';
            e.excepcionesDiaNoche.noche.bordeColor = '#cc2e2e';
            e.excepcionesDiaNoche.noche.opacidadFondo = 100;
          }
        }
      }
      if (e.id === 'est_ruleta_girar_circular') {
        if (!e.datos) e.datos = {};
        if (!e.datos.apariencia) e.datos.apariencia = {};
        e.datos.apariencia.fondoColor = 'var(--color-resaltado)';
        e.datos.apariencia.bordeColor = '#ffffff';
        e.datos.apariencia.bordeGrosor = '3px';
        e.datos.apariencia.radio = '50%';
        e.datos.apariencia.opacidadFondo = 100;
        if (e.datos.tamano) {
          e.datos.tamano.paddingH = 0;
          e.datos.tamano.paddingV = 0;
        }
      }
      if (e.id === 'est_acelerador_oro') {
        if (!e.datos) e.datos = {};
        if (!e.datos.apariencia) e.datos.apariencia = {};
        e.datos.apariencia.fondoColor = '#00c853';
        e.datos.apariencia.bordeColor = '#00e676';
        e.datos.apariencia.bordeGrosor = '3px';
        e.datos.apariencia.textoColor = '#ffffff';
        if (!e.datos.hover) e.datos.hover = {};
        e.datos.hover.fondoColor = '#00e676';
        e.datos.hover.bordeColor = '#00c853';
        e.datos.hover.textoColor = '#ffffff';
        if (!e.datos.activo) e.datos.activo = {};
        e.datos.activo.fondoColor = '#cf7017';
        e.datos.activo.bordeColor = '#e67e22';
        e.datos.activo.textoColor = '#ffffff';
      }
    });
  }

  function cargar() {
    try {
      var cached = localStorage.getItem('lotlab_catalogo_botones_cache');
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.estilos)) {
          sincronizarEstilosTemporizador(parsed);
          window[CACHE_KEY] = parsed;
          inyectar(parsed);
        }
      }
    } catch (e) {}

    return fetch(CATALOGO_URL + '?_t=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && Array.isArray(d.estilos)) {
          sincronizarEstilosTemporizador(d);
          window[CACHE_KEY] = d;
          inyectar(d);
          try {
            localStorage.setItem('lotlab_catalogo_botones_cache', JSON.stringify(d));
          } catch (e) {}
        }
      })
      .catch(function () {});
  }

  // ─── Canal de Comunicación en Tiempo Real ───────────────────────────
  var _canal = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      _canal = new BroadcastChannel('lotlab_canal_botones');
      _canal.onmessage = function (ev) {
        if (!ev || !ev.data) return;
        if (ev.data.tipo === 'CATALOGO_ACTUALIZADO' && ev.data.catalogo) {
          window[CACHE_KEY] = ev.data.catalogo;
          inyectar(ev.data.catalogo);
        } else if (ev.data.tipo === 'ACTIVAR_MODO_SELECCION_BOTONES') {
          activarModoSeleccion();
        }
      };
    }
  } catch (e) {}

  window.addEventListener('message', function (ev) {
    if (!ev || !ev.data) return;
    if (ev.data.tipo === 'CATALOGO_ACTUALIZADO' && ev.data.catalogo) {
      window[CACHE_KEY] = ev.data.catalogo;
      inyectar(ev.data.catalogo);
    } else if (ev.data.tipo === 'ACTIVAR_MODO_SELECCION_BOTONES') {
      activarModoSeleccion();
    }
  });

  window.addEventListener('storage', function (e) {
    if (e.key === 'lotlab_catalogo_botones_cache' && e.newValue) {
      try {
        var c = JSON.parse(e.newValue);
        if (c && Array.isArray(c.estilos)) {
          window[CACHE_KEY] = c;
          inyectar(c);
        }
      } catch (err) {}
    }
  });

  // ─── MODO INTERACTIVO: SELECCIÓN DE BOTONES EN LA WEB ───────────────
  var _modoSeleccionActivo = false;
  var _elementoResaltado = null;
  var _elementoSeleccionado = null;
  var _dockSeleccion = null;
  var _popoverEditor = null;
  var _tooltipInfo = null;

  // Marca que identifica cualquier elemento perteneciente a la UI del CMS/editor
  var CMS_UI_ATTR = 'data-lotlab-cms-ui';

  /** Devuelve true si el elemento (o cualquier ancestro) pertenece a la UI interna del CMS */
  function esElementoUICms(el) {
    if (!el || typeof el.closest !== 'function') return false;
    return !!el.closest('[' + CMS_UI_ATTR + ']');
  }

  function obtenerElementoBoton(target) {
    if (!target || typeof target.closest !== 'function') return null;
    if (esElementoUICms(target)) return null;
    if (target.matches('.btnPackIcono') || target.closest('.btnPackIcono')) return null;

    // 1. Elementos button estándar, inputs de tipo botón y elementos con role="button"
    var el = target.closest('button, input[type="button"], input[type="submit"], [role="button"]');
    if (el && !esElementoUICms(el)) return el;

    // 2. Enlaces interactivos que funcionan visualmente como botones
    var link = target.closest('a.btn, a.boton, a[class*="boton"], a[class*="btn-"], a.nav-link');
    if (link && !esElementoUICms(link)) return link;

    // 3. Clases interactivas conocidas de botones de LOT-LAB
    var known = target.closest(
      '.botonFiltro, .opcionFiltro, .opcionFiltroReto, .cerrar, .cerrarPequeno, ' +
      '.estatTiempoPanelCerrar, .estatDatePickerClose, .boton-lotlab, .habBtnAcelerar, ' +
      '.habBtnTirar, .btnReroll, .btnGirarRuleta, .btnGirarDestacado, .botonSecundario, ' +
      '.botonDesastreToggle, .btnLimpiarBuscador, .btnDesmarcarPopover, #borrarFiltros, ' +
      '.estatBtnBorrar, .btnAceptarPopover, .btn-categoria-nav, .btn-dropdown-tool, ' +
      '.exp-categoria-card, .exp-herramienta-card'
    );
    if (known && !esElementoUICms(known)) return known;

    return null;
  }

  function identificarObjetivoBoton(btnEl) {
    if (!btnEl) return null;

    function limpiarTextoBoton(el) {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
      if (el.getAttribute('title')) return el.getAttribute('title').trim();
      try {
        var clon = el.cloneNode(true);
        var svgs = clon.querySelectorAll('svg, img');
        for (var i = 0; i < svgs.length; i++) {
          if (svgs[i].parentNode) svgs[i].parentNode.removeChild(svgs[i]);
        }
        var txt = clon.textContent.trim().replace(/\s+/g, ' ');
        if (txt && txt.length <= 40) return txt;
      } catch (e) {}
      if (el.id) return el.id;
      return 'Botón';
    }

    var nombreTexto = limpiarTextoBoton(btnEl);
    var selector = '';
    var targetKey = '';
    var nombre = '';
    var familiaBase = null;

    // Identificar familia base si aplica para herencia
    var keys = Object.keys(FAMILIAS);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      try {
        if (btnEl.matches(FAMILIAS[k]) || btnEl.closest(FAMILIAS[k])) {
          familiaBase = k;
          break;
        }
      } catch (e) {}
    }
    if (!familiaBase) {
      if (btnEl.matches('.opcionFiltro,.opcionFiltroReto') || btnEl.closest('.opcionFiltro,.opcionFiltroReto')) familiaBase = 'opcionFiltro';
      else if (btnEl.matches('.botonFiltro,.botonReto') || btnEl.closest('.botonFiltro,.botonReto')) familiaBase = 'botonFiltro';
      else if (btnEl.matches('.boton-lotlab') || btnEl.closest('.boton-lotlab')) familiaBase = 'botonLotlab';
    }

    // Regla 1: ID directo en el botón (máxima especificidad y estabilidad)
    if (btnEl.id) {
      selector = '#' + btnEl.id;
      targetKey = '#' + btnEl.id;
      nombre = nombreTexto || ('Botón #' + btnEl.id);
    }
    // Regla 2: Botón de categoría de navegación principal
    else if (btnEl.dataset && btnEl.dataset.catId && btnEl.classList.contains('btn-categoria-nav')) {
      var catId = btnEl.dataset.catId;
      selector = '.btn-categoria-nav[data-cat-id="' + catId + '"]';
      targetKey = selector;
      nombre = 'Navegación: ' + (nombreTexto || catId);
    }
    // Regla 3: Herramienta de navegación secundaria (dropdown)
    else if (btnEl.dataset && btnEl.dataset.toolId && btnEl.classList.contains('btn-dropdown-tool')) {
      var toolId = btnEl.dataset.toolId;
      selector = '.btn-dropdown-tool[data-tool-id="' + toolId + '"]';
      targetKey = selector;
      nombre = 'Herramienta: ' + (nombreTexto || toolId);
    }
    // Regla 4: Tarjetas del explorador
    else if (btnEl.dataset && (btnEl.dataset.toolId || btnEl.dataset.catId) && (btnEl.classList.contains('exp-herramienta-card') || btnEl.classList.contains('exp-categoria-card'))) {
      var expId = btnEl.dataset.toolId || btnEl.dataset.catId;
      var expCls = btnEl.classList.contains('exp-herramienta-card') ? 'exp-herramienta-card' : 'exp-categoria-card';
      var attr = btnEl.dataset.toolId ? 'data-tool-id' : 'data-cat-id';
      selector = '.' + expCls + '[' + attr + '="' + expId + '"]';
      targetKey = selector;
      nombre = 'Explorador: ' + (nombreTexto || expId);
    }
    // Regla 5: Filtro de búsqueda con data-filtro
    else if (btnEl.dataset && btnEl.dataset.filtro) {
      var fVal = btnEl.dataset.filtro;
      selector = '.botonFiltro[data-filtro="' + fVal + '"]';
      targetKey = selector;
      nombre = 'Filtro: ' + (nombreTexto || fVal);
    }
    // Regla 6: Botón cerrar dentro de una ventana o modal con ID
    else if (btnEl.classList.contains('cerrar') || btnEl.classList.contains('cerrarPequeno')) {
      var parentV = btnEl.closest('.ventana, .modal, [class*="ventana"], [class*="modal"]') || (btnEl.parentElement && btnEl.parentElement.closest('[id]'));
      if (parentV && parentV.id) {
        var clsCerrar = btnEl.classList.contains('cerrarPequeno') ? '.cerrarPequeno' : '.cerrar';
        selector = '#' + parentV.id + ' ' + clsCerrar;
        targetKey = selector;
        var tit = ((parentV.querySelector && parentV.querySelector('h2, h3, h4')?.textContent) || parentV.id).trim();
        nombre = 'Cerrar (' + tit.substring(0, 25) + ')';
      } else {
        selector = '.cerrar';
        targetKey = 'btnCerrarModal';
        nombre = 'Botón cerrar modal';
      }
    }
    // Regla 7: Botón con tooltip o aria-label específico
    else if (btnEl.getAttribute('data-tooltip') || btnEl.getAttribute('aria-label')) {
      var tip = btnEl.getAttribute('data-tooltip') || btnEl.getAttribute('aria-label');
      var pId = btnEl.closest('[id]')?.id;
      if (pId) {
        selector = '#' + pId + ' button[' + (btnEl.getAttribute('data-tooltip') ? 'data-tooltip' : 'aria-label') + '="' + tip + '"]';
      } else {
        selector = 'button[' + (btnEl.getAttribute('data-tooltip') ? 'data-tooltip' : 'aria-label') + '="' + tip + '"]';
      }
      targetKey = selector;
      nombre = tip;
    }
    // Regla 8: Botón dentro de un contenedor con ID
    else {
      var parentConId = btnEl.parentElement?.closest('[id]');
      if (parentConId && parentConId.id) {
        var tag = btnEl.tagName.toLowerCase();
        var mainClass = btnEl.classList.length ? ('.' + btnEl.classList[0]) : '';
        selector = '#' + parentConId.id + ' ' + tag + mainClass;
        targetKey = selector;
        nombre = (nombreTexto || tag) + ' (en #' + parentConId.id + ')';
      } else {
        if (familiaBase && FAMILIAS[familiaBase]) {
          selector = FAMILIAS[familiaBase];
          targetKey = familiaBase;
          nombre = NOMBRES_FAMILIAS[familiaBase] || familiaBase;
        } else {
          selector = btnEl.tagName.toLowerCase() + (btnEl.classList.length ? ('.' + btnEl.classList[0]) : '');
          targetKey = selector;
          nombre = nombreTexto || 'Botón web';
        }
      }
    }

    return {
      targetKey: targetKey,
      selector: selector,
      nombre: nombre,
      familiaBase: familiaBase
    };
  }

  function identificarFamiliaDeElemento(el) {
    var obj = identificarObjetivoBoton(obtenerElementoBoton(el));
    return obj ? (obj.familiaBase || obj.targetKey) : null;
  }

  function activarModoSeleccion() {
    if (_modoSeleccionActivo) return;
    _modoSeleccionActivo = true;

    // 1. Barra flotante superior
    _dockSeleccion = document.createElement('div');
    _dockSeleccion.id = 'lotlabDockSeleccionBotones';
    _dockSeleccion.setAttribute(CMS_UI_ATTR, '1');
    _dockSeleccion.setAttribute('style', [
      'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
      'background:#121624', 'color:#ffffff', 'border:1px solid #ffd54a',
      'border-radius:30px', 'padding:10px 22px', 'z-index:999999',
      'display:flex', 'align-items:center', 'gap:14px',
      'box-shadow:0 12px 40px rgba(0,0,0,0.7), 0 0 20px rgba(255,213,74,0.3)',
      'font-family:system-ui,-apple-system,sans-serif', 'font-size:0.85rem', 'font-weight:600'
    ].join(';'));

    _dockSeleccion.innerHTML = [
      '<span>🎯 <strong>Modo Selección de Botones</strong>: <strong>Mayús + Clic</strong> para editar estilo propio • Clic normal para navegar</span>',
      '<button type="button" id="lotlabBtnSalirSeleccion" style="background:rgba(255,255,255,0.12);border:none;color:#fff;border-radius:16px;padding:4px 12px;font-size:0.78rem;font-weight:700;cursor:pointer;transition:background 0.15s;">✕ Salir</button>'
    ].join('');

    document.body.appendChild(_dockSeleccion);

    document.getElementById('lotlabBtnSalirSeleccion')?.addEventListener('click', function (e) {
      e.stopPropagation();
      desactivarModoSeleccion();
    });

    // 2. Tooltip flotante de información
    _tooltipInfo = document.createElement('div');
    _tooltipInfo.id = 'lotlabTooltipSeleccion';
    _tooltipInfo.setAttribute(CMS_UI_ATTR, '1');
    _tooltipInfo.setAttribute('style', [
      'position:fixed', 'pointer-events:none', 'z-index:999998', 'display:none',
      'background:rgba(18,22,36,0.92)', 'color:#ffd54a', 'border:1px solid rgba(255,213,74,0.4)',
      'border-radius:6px', 'padding:5px 12px', 'font-size:0.75rem', 'font-weight:700',
      'box-shadow:0 4px 12px rgba(0,0,0,0.5)', 'backdrop-filter:blur(6px)', 'line-height:1.4'
    ].join(';'));
    document.body.appendChild(_tooltipInfo);

    // 3. Capturar eventos
    document.addEventListener('mouseover', onElementMouseOver, true);
    document.addEventListener('mouseout', onElementMouseOut, true);
    document.addEventListener('click', onElementClick, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function desactivarModoSeleccion() {
    if (!_modoSeleccionActivo) return;
    _modoSeleccionActivo = false;

    if (_dockSeleccion && _dockSeleccion.parentNode) _dockSeleccion.parentNode.removeChild(_dockSeleccion);
    if (_tooltipInfo && _tooltipInfo.parentNode) _tooltipInfo.parentNode.removeChild(_tooltipInfo);
    if (_popoverEditor && _popoverEditor.parentNode) _popoverEditor.parentNode.removeChild(_popoverEditor);

    if (_elementoResaltado) {
      _elementoResaltado.style.outline = '';
      _elementoResaltado.style.outlineOffset = '';
      _elementoResaltado.style.cursor = '';
    }
    if (_elementoSeleccionado) {
      _elementoSeleccionado.style.outline = '';
      _elementoSeleccionado.style.outlineOffset = '';
      _elementoSeleccionado.style.boxShadow = '';
      _elementoSeleccionado.style.cursor = '';
    }

    _elementoResaltado = null;
    _elementoSeleccionado = null;

    document.removeEventListener('mouseover', onElementMouseOver, true);
    document.removeEventListener('mouseout', onElementMouseOut, true);
    document.removeEventListener('click', onElementClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      desactivarModoSeleccion();
    }
  }

  function onElementMouseOver(e) {
    if (!_modoSeleccionActivo) return;
    var target = e.target;
    if (esElementoUICms(target)) return;

    var btnEl = obtenerElementoBoton(target);
    if (!btnEl || esElementoUICms(btnEl)) return;
    if (btnEl === _elementoSeleccionado) return;

    if (_elementoResaltado && _elementoResaltado !== btnEl && _elementoResaltado !== _elementoSeleccionado) {
      _elementoResaltado.style.outline = '';
      _elementoResaltado.style.outlineOffset = '';
      _elementoResaltado.style.cursor = '';
    }
    _elementoResaltado = btnEl;
    btnEl.style.outline = '2px dashed #00e5ff';
    btnEl.style.outlineOffset = '2px';
    btnEl.style.cursor = 'crosshair';

    // Tooltip flotante HUD de información
    if (_tooltipInfo) {
      var obj = identificarObjetivoBoton(btnEl);
      var cat = window[CACHE_KEY] || {};
      var asigs = cat.asignacionesFuncionales || {};
      var asig = asigs[obj.targetKey] || (obj.familiaBase ? asigs[obj.familiaBase] : null) || {};
      var est = resolverEstilo(asig.estiloId, cat);
      var nombreEst = est ? est.nombre : '(Aspecto nativo original)';
      var catsList = cat.categorias || [];
      var catEst = est ? catsList.find(function(c) { return c.id === est.categoriaId; }) : null;
      var nombreCat = catEst ? catEst.nombre : 'General';
      var estadoAsig = asigs[obj.targetKey] ? '🟢 Estilo exclusivo' : (obj.familiaBase ? '⚪ Heredado (' + (NOMBRES_FAMILIAS[obj.familiaBase] || obj.familiaBase) + ')' : '⚪ Aspecto nativo');

      _tooltipInfo.innerHTML = [
        '<div style="font-weight:700;color:#ffd54a;font-size:0.84rem;margin-bottom:3px;display:flex;align-items:center;gap:6px;">',
          '<span>🎯 ' + obj.nombre + '</span>',
        '</div>',
        '<div style="font-size:0.72rem;color:#d1d7e8;margin-bottom:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">',
          '<span style="background:rgba(255,255,255,0.08);padding:1px 6px;border-radius:4px;color:#a0aec0;font-family:monospace;">' + obj.selector + '</span>',
          '<span style="color:#2ecc71;font-weight:600;">' + estadoAsig + '</span>',
        '</div>',
        '<div style="font-size:0.74rem;color:#ffffff;display:flex;align-items:center;gap:6px;margin-bottom:4px;">',
          '<span>🎨 <strong>' + nombreEst + '</strong></span>',
          '<span style="background:rgba(79,142,247,0.15);border:1px solid rgba(79,142,247,0.3);color:#7cb2ff;padding:0 6px;border-radius:10px;font-size:0.68rem;">📁 ' + nombreCat + '</span>',
        '</div>',
        '<div style="font-size:0.7rem;color:#ffd54a;border-top:1px solid rgba(255,213,74,0.25);padding-top:4px;margin-top:3px;font-weight:600;">',
          '⌨️ <strong>Mayús + Clic</strong> para ajustar Categoría y Estilo',
        '</div>'
      ].join('');
      _tooltipInfo.style.display = 'block';
      _tooltipInfo.style.left = (e.clientX + 14) + 'px';
      _tooltipInfo.style.top = (e.clientY + 14) + 'px';
    }
  }

  function onElementMouseOut(e) {
    if (!_modoSeleccionActivo) return;
    var target = e.target;
    if (esElementoUICms(target)) return;
    var btnEl = obtenerElementoBoton(target);
    if (btnEl && btnEl !== _elementoSeleccionado) {
      btnEl.style.outline = '';
      btnEl.style.outlineOffset = '';
      btnEl.style.cursor = '';
    }
    if (_tooltipInfo) _tooltipInfo.style.display = 'none';
  }

  function onElementClick(e) {
    if (!_modoSeleccionActivo) return;
    var target = e.target;

    // Si el clic viene de la UI interna del CMS, no interceptar
    if (esElementoUICms(target)) return;

    // Solo interceptar si se presionó la tecla Shift (Mayús)
    if (!e.shiftKey) return;

    var btnEl = obtenerElementoBoton(target);
    if (!btnEl || esElementoUICms(btnEl)) return;

    // Interceptar para evitar la acción original del botón
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Quitar selección previa
    if (_elementoSeleccionado && _elementoSeleccionado !== btnEl) {
      _elementoSeleccionado.style.outline = '';
      _elementoSeleccionado.style.outlineOffset = '';
      _elementoSeleccionado.style.boxShadow = '';
    }

    _elementoSeleccionado = btnEl;
    btnEl.style.outline = '3px solid #ffd54a';
    btnEl.style.outlineOffset = '2px';
    btnEl.style.boxShadow = '0 0 16px rgba(255,213,74,0.8)';

    mostrarPopoverEdicion(btnEl);
  }

  function mostrarPopoverEdicion(btnEl) {
    if (_popoverEditor && _popoverEditor.parentNode) {
      _popoverEditor.parentNode.removeChild(_popoverEditor);
    }

    var obj = identificarObjetivoBoton(btnEl);
    if (!obj) return;

    var cat = window[CACHE_KEY] || { estilos: [], asignacionesFuncionales: {}, categorias: [] };
    cat.asignacionesFuncionales = cat.asignacionesFuncionales || {};
    cat.categorias = (cat.categorias && cat.categorias.length) ? cat.categorias : [
      { id: 'cat_filtros', nombre: 'Filtros y selección' },
      { id: 'cat_acciones', nombre: 'Acciones y herramientas' },
      { id: 'cat_contenido', nombre: 'Botones de contenido y base' },
      { id: 'cat_footer', nombre: 'Controles del footer' }
    ];

    var esIndividual = !!cat.asignacionesFuncionales[obj.targetKey];
    var asigActual = cat.asignacionesFuncionales[obj.targetKey] || (obj.familiaBase ? cat.asignacionesFuncionales[obj.familiaBase] : null) || {};
    var estiloActualId = asigActual.estiloId || '';
    var estiloActual = resolverEstilo(estiloActualId, cat);
    var categoriaActualId = (estiloActual && estiloActual.categoriaId) ? estiloActual.categoriaId : 'cat_contenido';

    var rect = btnEl.getBoundingClientRect();
    var top = rect.bottom + 8;
    var left = Math.max(16, Math.min(window.innerWidth - 380, rect.left));

    if (top + 380 > window.innerHeight) {
      top = Math.max(10, rect.top - 390);
    }

    _popoverEditor = document.createElement('div');
    _popoverEditor.id = 'lotlabPopoverBotonEditor';
    _popoverEditor.setAttribute(CMS_UI_ATTR, '1');
    _popoverEditor.setAttribute('style', [
      'position:fixed', 'top:' + top + 'px', 'left:' + left + 'px', 'width:370px',
      'background:rgba(18, 22, 34, 0.96)', 'color:#ffffff', 'border:1px solid rgba(255, 213, 74, 0.45)',
      'border-radius:16px', 'padding:18px', 'z-index:999999',
      'box-shadow:0 24px 50px rgba(0,0,0,0.75), 0 0 30px rgba(255,213,74,0.2)',
      'backdrop-filter:blur(16px)', '-webkit-backdrop-filter:blur(16px)',
      'font-family:system-ui,-apple-system,sans-serif', 'font-size:0.83rem', 'box-sizing:border-box'
    ].join(';'));

    function resolverVarEnVivo(v, modo) {
      if (!v || typeof v !== 'string') return v;
      if (v.indexOf('var(') !== 0) return v;
      var match = v.match(/var\((--[-a-zA-Z0-9_]+)(?:,\s*([^)]+))?\)/);
      if (!match) return v;
      var varName = match[1];
      var fallback = match[2] || '';
      try {
        var rootEl = document.documentElement;
        var computed = window.getComputedStyle(rootEl).getPropertyValue(varName).trim();
        if (computed) return computed;
      } catch (e) {}
      if (varName === '--color-principal') return (modo === 'dia') ? '#D9D9D9' : '#3A3A3A';
      if (varName === '--color-texto') return (modo === 'dia') ? '#2B2B2B' : '#EDEDED';
      if (varName === '--color-secundario') return (modo === 'dia') ? '#B5B5B5' : '#4A4A4A';
      if (varName === '--color-advertencia') return '#FFD54A';
      if (varName === '--color-resaltado-dia') {
        var t = obtenerTemaActivoObj();
        return (t && (t.colorResaltadoDia || t.colorResaltado)) ? (t.colorResaltadoDia || t.colorResaltado) : '#2ECC71';
      }
      if (varName === '--color-resaltado-noche') {
        var t = obtenerTemaActivoObj();
        return (t && (t.colorResaltadoNoche || t.colorResaltado)) ? (t.colorResaltadoNoche || t.colorResaltado) : '#2ECC71';
      }
      if (varName === '--color-resaltado') {
        var t = obtenerTemaActivoObj();
        var col = (modo === 'dia') ? (t && (t.colorResaltadoDia || t.colorResaltado)) : (t && (t.colorResaltadoNoche || t.colorResaltado));
        return col || '#2ECC71';
      }
      return fallback || v;
    }

    function swatchForEst(est) {
      if (!est) return { bg: '#1a1a2e', tc: '#666', bc: 'transparent' };
      var ap = (est.datos && est.datos.apariencia) ? est.datos.apariencia : {};
      var exc = (est.datos && est.datos.excepcionesDiaNoche) ? est.datos.excepcionesDiaNoche : (est.excepcionesDiaNoche || {});
      var modo = obtenerModo();
      var apModo = Object.assign({}, ap, exc[modo] || {});
      var bg = apModo.fondoColor || '#444';
      var tc = apModo.textoColor || '#fff';
      var bc = apModo.bordeColor || 'rgba(255,255,255,0.2)';
      bg = resolverVarEnVivo(bg, modo);
      tc = resolverVarEnVivo(tc, modo);
      bc = resolverVarEnVivo(bc, modo);
      return { bg: bg, tc: tc, bc: bc };
    }

    // Generar opciones de Categoría
    var categoriasHtml = '';
    cat.categorias.forEach(function (c) {
      var icon = c.id.indexOf('filtro') >= 0 ? '🔍' : c.id.indexOf('accion') >= 0 ? '⚡' : c.id.indexOf('footer') >= 0 ? '⚙️' : '📦';
      var sel = c.id === categoriaActualId ? ' selected' : '';
      categoriasHtml += '<option value="' + c.id + '"' + sel + '>' + icon + ' ' + c.nombre + '</option>';
    });

    // Generar opciones de Estilo agrupadas por categoría
    function buildEstilosHtml(catFiltro, estiloSeleccionadoId) {
      var html = '<option value="" data-swatch-bg="#1a1a2e" data-swatch-tc="#666" data-swatch-bc="transparent">(Aspecto nativo original)</option>';
      cat.categorias.forEach(function (c) {
        var estilosCat = (cat.estilos || []).filter(function (st) { return st.categoriaId === c.id; });
        if (estilosCat.length > 0) {
          html += '<optgroup label="' + c.nombre + '">';
          estilosCat.forEach(function (est) {
            var sw = swatchForEst(est);
            var sel = est.id === estiloSeleccionadoId ? ' selected' : '';
            html += '<option value="' + est.id + '"' + sel +
              ' data-cat="' + est.categoriaId + '"' +
              ' data-swatch-bg="' + sw.bg + '" data-swatch-tc="' + sw.tc + '" data-swatch-bc="' + sw.bc + '">' +
              est.nombre + '</option>';
          });
          html += '</optgroup>';
        }
      });
      // Estilos sin categoría o con otra categoría
      var otros = (cat.estilos || []).filter(function (st) {
        return !cat.categorias.some(function (c) { return c.id === st.categoriaId; });
      });
      if (otros.length > 0) {
        html += '<optgroup label="Otros estilos">';
        otros.forEach(function (est) {
          var sw = swatchForEst(est);
          var sel = est.id === estiloSeleccionadoId ? ' selected' : '';
          html += '<option value="' + est.id + '"' + sel +
            ' data-cat="' + (est.categoriaId || '') + '"' +
            ' data-swatch-bg="' + sw.bg + '" data-swatch-tc="' + sw.tc + '" data-swatch-bc="' + sw.bc + '">' +
            est.nombre + '</option>';
        });
        html += '</optgroup>';
      }
      return html;
    }

    var badgeTipo = esIndividual
      ? '<span style="background:rgba(46,204,113,0.18);border:1px solid rgba(46,204,113,0.35);color:#2ecc71;padding:2px 8px;border-radius:12px;font-size:0.68rem;font-weight:700;">🟢 Estilo individual exclusivo</span>'
      : (obj.familiaBase
        ? '<span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#ccc;padding:2px 8px;border-radius:12px;font-size:0.68rem;">⚪ Heredado: ' + (NOMBRES_FAMILIAS[obj.familiaBase] || obj.familiaBase) + '</span>'
        : '<span style="background:rgba(255,255,255,0.08);color:#ccc;padding:2px 8px;border-radius:12px;font-size:0.68rem;">⚪ Aspecto nativo</span>');

    _popoverEditor.innerHTML = [
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">',
        '<div>',
          '<div style="font-size:0.68rem;color:#ffd54a;text-transform:uppercase;font-weight:800;letter-spacing:0.06em;margin-bottom:2px;">🎯 Ajuste de Botón & Categoría</div>',
          '<strong style="color:#ffffff;font-size:0.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;display:block;">' + obj.nombre + '</strong>',
        '</div>',
        '<button type="button" id="lotlabPopClose" style="background:rgba(255,255,255,0.08);border:none;color:#8890a8;font-size:1.1rem;cursor:pointer;padding:2px 8px;line-height:1;border-radius:6px;transition:all 0.15s ease;">✕</button>',
      '</div>',
      '<div style="font-size:0.7rem;color:#8890a8;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:6px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">',
        '<code style="background:rgba(255,255,255,0.07);padding:2px 6px;border-radius:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;color:#a4adc5;">' + obj.selector + '</code>',
        badgeTipo,
      '</div>',

      // Previsualización Swatch en vivo
      '<div style="margin-bottom:12px;">',
        '<div id="lotlabPopSwatchPreview" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);">',
          '<div style="display:flex;align-items:center;gap:10px;overflow:hidden;">',
            '<div id="lotlabPopSwatchBox" style="width:38px;height:24px;border-radius:6px;border:1px solid rgba(255,255,255,0.25);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;">Aa</div>',
            '<div style="overflow:hidden;">',
              '<div id="lotlabPopSwatchLabel" style="font-size:0.8rem;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>',
              '<div id="lotlabPopSwatchCategoryBadge" style="font-size:0.68rem;color:#ffd54a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>',
            '</div>',
          '</div>',
          '<span style="font-size:0.7rem;background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:12px;color:#cbd5e1;flex-shrink:0;">' + (obtenerModo() === 'dia' ? '☀️ Día' : '🌙 Noche') + '</span>',
        '</div>',
      '</div>',

      // 1. Selector de Categoría
      '<div style="margin-bottom:12px;">',
        '<label style="display:block;font-size:0.72rem;color:#ffd54a;margin-bottom:5px;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;">📁 Categoría de este botón / estilo:</label>',
        '<select id="lotlabPopSelectCategoria" style="width:100%;padding:8px 10px;border-radius:8px;background:#0d111a;color:#fff;border:1px solid rgba(255,213,74,0.3);outline:none;cursor:pointer;font-size:0.82rem;font-weight:600;">',
          categoriasHtml,
        '</select>',
        '<div style="font-size:0.68rem;color:#8890a8;margin-top:4px;">Define a qué categoría o grupo funcional del catálogo pertenece este estilo.</div>',
      '</div>',

      // 2. Selector de Estilo
      '<div style="margin-bottom:14px;">',
        '<label style="display:block;font-size:0.72rem;color:#ffd54a;margin-bottom:5px;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;">🎨 Estilo visual asignado:</label>',
        '<select id="lotlabPopSelectEstilo" style="width:100%;padding:8px 10px;border-radius:8px;background:#0d111a;color:#fff;border:1px solid rgba(255,255,255,0.2);outline:none;cursor:pointer;font-size:0.82rem;">',
          buildEstilosHtml(categoriaActualId, estiloActualId),
        '</select>',
      '</div>',

      // Botones de acción rápida
      '<div style="display:flex;flex-direction:column;gap:7px;margin-bottom:12px;">',
        '<button type="button" id="lotlabPopBtnClonar" style="width:100%;background:linear-gradient(135deg, #ffd54a, #f39c12);color:#121624;border:none;border-radius:8px;padding:8px 12px;font-size:0.78rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:transform 0.15s ease, box-shadow 0.15s ease;">✨ Crear estilo independiente en esta categoría</button>',
        esIndividual
          ? '<button type="button" id="lotlabPopBtnRevertir" style="width:100%;background:rgba(255,255,255,0.06);color:#ff8a80;border:1px solid rgba(255,138,128,0.3);border-radius:8px;padding:6px 10px;font-size:0.74rem;font-weight:600;cursor:pointer;transition:all 0.15s ease;">↩️ Revertir a estilo heredado de familia</button>'
          : '',
      '</div>',

      // Botones finales: CMS y Guardar
      '<div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">',
        '<button type="button" id="lotlabPopBtnAbrirCMS" style="flex:1;background:rgba(79,142,247,0.18);border:1px solid rgba(79,142,247,0.4);color:#7cb2ff;border-radius:8px;padding:8px;font-size:0.78rem;font-weight:700;cursor:pointer;transition:all 0.15s ease;">🎨 Abrir en CMS</button>',
        '<button type="button" id="lotlabPopBtnGuardar" style="flex:1;background:linear-gradient(135deg, #2ecc71, #27ae60);border:none;color:#ffffff;border-radius:8px;padding:8px;font-size:0.78rem;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(46,204,113,0.3);transition:all 0.15s ease;">💾 Guardar Asignación</button>',
      '</div>'
    ].join('');

    document.body.appendChild(_popoverEditor);

    var selectCat = _popoverEditor.querySelector('#lotlabPopSelectCategoria');
    var selectEstilo = _popoverEditor.querySelector('#lotlabPopSelectEstilo');
    var swatchBox = _popoverEditor.querySelector('#lotlabPopSwatchBox');
    var swatchLabel = _popoverEditor.querySelector('#lotlabPopSwatchLabel');
    var swatchCatBadge = _popoverEditor.querySelector('#lotlabPopSwatchCategoryBadge');

    function actualizarSwatch() {
      var opt = selectEstilo.options[selectEstilo.selectedIndex];
      var bg = (opt && opt.getAttribute('data-swatch-bg')) || '#1a1a2e';
      var tc = (opt && opt.getAttribute('data-swatch-tc')) || '#666';
      var bc = (opt && opt.getAttribute('data-swatch-bc')) || 'rgba(255,255,255,0.2)';
      var nombre = (opt && opt.textContent.trim()) || '(Aspecto nativo original)';
      swatchBox.style.background = bg;
      swatchBox.style.color = tc;
      swatchBox.style.borderColor = bc;
      swatchLabel.textContent = nombre;

      var currentCatId = selectCat ? selectCat.value : categoriaActualId;
      var catObj = (cat.categorias || []).find(function (c) { return c.id === currentCatId; });
      if (swatchCatBadge) {
        swatchCatBadge.textContent = '📁 Categoría: ' + (catObj ? catObj.nombre : currentCatId);
      }
    }
    actualizarSwatch();

    _popoverEditor.querySelector('#lotlabPopClose').addEventListener('click', function (e) {
      e.stopPropagation();
      if (_popoverEditor && _popoverEditor.parentNode) _popoverEditor.parentNode.removeChild(_popoverEditor);
      _popoverEditor = null;
      if (_elementoSeleccionado) {
        _elementoSeleccionado.style.outline = '';
        _elementoSeleccionado.style.outlineOffset = '';
        _elementoSeleccionado.style.boxShadow = '';
        _elementoSeleccionado = null;
      }
    });

    // Evento: Cambiar Categoría
    selectCat.addEventListener('change', function (e) {
      e.stopPropagation();
      var nuevaCatId = selectCat.value;
      var idEstilo = selectEstilo.value || estiloActualId;
      var est = resolverEstilo(idEstilo, cat);
      if (est) {
        est.categoriaId = nuevaCatId;
        // Reconstruir select de estilo manteniendo la selección
        selectEstilo.innerHTML = buildEstilosHtml(nuevaCatId, est.id);
      }
      actualizarSwatch();
      inyectar(cat);

      // Notificar al CMS
      var msg = {
        tipo: 'CATEGORIA_MODIFICADA_DESDE_PREVIEW',
        targetKey: obj.targetKey,
        estiloId: idEstilo,
        categoriaId: nuevaCatId
      };
      if (_canal) _canal.postMessage(msg);
      if (window.opener && !window.opener.closed) window.opener.postMessage(msg, '*');
      if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
    });

    // Evento: Cambiar Estilo
    selectEstilo.addEventListener('change', function (e) {
      e.stopPropagation();
      var nuevoId = selectEstilo.value;
      if (nuevoId) {
        cat.asignacionesFuncionales[obj.targetKey] = {
          estiloId: nuevoId,
          selector: obj.selector,
          nombre: obj.nombre
        };
        var est = resolverEstilo(nuevoId, cat);
        if (est && est.categoriaId && selectCat) {
          selectCat.value = est.categoriaId;
        }
      } else {
        delete cat.asignacionesFuncionales[obj.targetKey];
      }
      actualizarSwatch();
      inyectar(cat);
    });

    // Evento: Crear estilo independiente
    _popoverEditor.querySelector('#lotlabPopBtnClonar').addEventListener('click', function (e) {
      e.stopPropagation();
      var estiloBase = resolverEstilo(selectEstilo.value || estiloActualId, cat) || cat.estilos[0];
      if (!estiloBase) return;

      var cleanKey = (btnEl.id ? btnEl.id.replace(/^#/, '') : obj.nombre.replace(/[^a-zA-Z0-9]/g, '_')).toLowerCase().substring(0, 24);
      var nuevoId = 'est_' + cleanKey;
      var contador = 1;
      var idTentativo = nuevoId;
      while (cat.estilos.some(function (st) { return st.id === idTentativo; })) {
        idTentativo = nuevoId + '_' + contador++;
      }
      nuevoId = idTentativo;

      var catDestino = selectCat ? selectCat.value : (estiloBase.categoriaId || 'cat_contenido');

      var nuevoEstilo = {
        id: nuevoId,
        nombre: 'Estilo: ' + obj.nombre.substring(0, 32),
        descripcion: 'Estilo exclusivo creado para ' + obj.nombre + ' (' + obj.selector + ')',
        categoriaId: catDestino,
        alcance: 'global',
        datos: JSON.parse(JSON.stringify(estiloBase.datos || {})),
        excepcionesDiaNoche: {} // Limpio para que no arrastre anulaciones rojas u obsoletas
      };

      cat.estilos.push(nuevoEstilo);
      cat.asignacionesFuncionales[obj.targetKey] = {
        estiloId: nuevoId,
        selector: obj.selector,
        nombre: obj.nombre
      };

      inyectar(cat);

      // Notificar al CMS
      var msg = {
        tipo: 'BOTON_SELECCIONADO_DESDE_PREVIEW',
        crearEstiloPropio: true,
        nuevoEstilo: nuevoEstilo,
        targetKey: obj.targetKey,
        selector: obj.selector,
        estiloId: nuevoId,
        nombre: obj.nombre
      };
      if (_canal) _canal.postMessage(msg);
      if (window.opener && !window.opener.closed) window.opener.postMessage(msg, '*');
      if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');

      mostrarPopoverEdicion(btnEl);
    });

    var btnRevertir = _popoverEditor.querySelector('#lotlabPopBtnRevertir');
    if (btnRevertir) {
      btnRevertir.addEventListener('click', function (e) {
        e.stopPropagation();
        delete cat.asignacionesFuncionales[obj.targetKey];
        inyectar(cat);
        mostrarPopoverEdicion(btnEl);
      });
    }

    _popoverEditor.querySelector('#lotlabPopBtnAbrirCMS').addEventListener('click', function (e) {
      e.stopPropagation();
      var idSeleccionado = selectEstilo.value || estiloActualId;
      var msg = {
        tipo: 'BOTON_SELECCIONADO_DESDE_PREVIEW',
        targetKey: obj.targetKey,
        selector: obj.selector,
        estiloId: idSeleccionado,
        nombre: obj.nombre
      };
      if (_canal) _canal.postMessage(msg);
      if (window.opener && !window.opener.closed) window.opener.postMessage(msg, '*');
      if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
    });

    _popoverEditor.querySelector('#lotlabPopBtnGuardar').addEventListener('click', function (e) {
      e.stopPropagation();
      if (!btnEl || !document.body.contains(btnEl)) {
        alert('⚠ El botón original ya no está disponible. No se puede guardar.');
        return;
      }
      var btnG = _popoverEditor.querySelector('#lotlabPopBtnGuardar');
      if (btnG) btnG.textContent = '⏳ Guardando...';

      fetch(API_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            try {
              localStorage.setItem('lotlab_catalogo_botones_cache', JSON.stringify(cat));
            } catch (errCache) {}
            var msg = { tipo: 'ASIGNACION_GUARDADA_DESDE_PREVIEW' };
            if (_canal) _canal.postMessage(msg);
            if (window.opener && !window.opener.closed) window.opener.postMessage(msg, '*');
            if (btnG) {
              btnG.textContent = '✓ ¡Guardado!';
              setTimeout(function () {
                if (btnG) btnG.textContent = '💾 Guardar Asignación';
              }, 1800);
            }
          } else {
            alert('Error: ' + (d.error || 'No se pudo guardar'));
            if (btnG) btnG.textContent = '💾 Guardar Asignación';
          }
        })
        .catch(function (err) {
          alert('Error de conexión: ' + err.message);
          if (btnG) btnG.textContent = '💾 Guardar Asignación';
        });
    });
  }

  // ─── API y Exposición Global ───────────────────────────────────────
  window.LotLabCatalogoEsK = {
    resolverEstilo: resolverEstilo,
    reinyectar: function () { inyectar(window[CACHE_KEY]); },
    recargar: cargar,
    setCatalogo: function (c) { window[CACHE_KEY] = c; inyectar(c); },
    activarModoSeleccion: activarModoSeleccion,
    desactivarModoSeleccion: desactivarModoSeleccion
  };

  var _modo = '', _obs = null;
  function initObs() {
    if (_obs || typeof MutationObserver === 'undefined' || !document.body) return;
    _obs = new MutationObserver(function () {
      var m = obtenerModo();
      if (m !== _modo) {
        _modo = m;
        inyectar(window[CACHE_KEY]);
      }
    });
    _obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function inicializar() {
    initObs();
    cargar().then(function () {
      // Si la URL contiene el parámetro modo_seleccion=botones, activar directamente
      try {
        var params = new URLSearchParams(window.location.search);
        if (params.get('modo_seleccion') === 'botones') {
          setTimeout(function () { activarModoSeleccion(); }, 600);
        }
      } catch (e) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();