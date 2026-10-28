/* Eisen Garage · páginas para clientes (1.10). Funciones comunes del portal, presupuesto y solicitudes.
 * Sin dependencias externas. Todo lo que viene del servidor se escapa antes de mostrarse. */
(function (w) {
  var API = 'https://script.google.com/macros/s/AKfycbxZSDP-rB5jECMlGl3XE2CkAd1HjTaFQ_96jrI3FLhNUfJZ_UNa1u6WWPiVKfsQmlI/exec';
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var EG = {};
  EG.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  EG.fecha = function (iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? (+m[3]) + ' ' + MESES[+m[2] - 1] + ' ' + m[1] : ''; };
  EG.pesos = function (n) { return n == null || n === '' ? '' : '$' + Math.round(Number(n)).toLocaleString('es-CL'); };
  EG.num = function (n) { return String(n).replace('.', ','); };
  EG.codigo = function () { return (/[#&]k=([0-9a-f]{64})/.exec(location.hash) || [])[1] || ''; };
  EG.clave = function () { return (w.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); };
  EG.post = function (body) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: { code: 'RED', message: 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.' } }; });
  };
  EG.estado = function (el, t) { el.innerHTML = '<div class="card estado">' + t + '</div>'; };
  EG.patente = function (p) { return p ? '<span class="plate"><small>CHILE</small><b>' + EG.esc(String(p).toUpperCase()) + '</b></span>' : ''; };
  EG.vehiculo = function (v) { if (!v) return ''; return [v.marca, v.modelo, v.anio].filter(Boolean).join(' ') || v.nombre || ''; };

  /* ── Historial (A1) ── */
  EG.historialHtml = function (d) {
    var h = '';
    (d.trabajos || []).forEach(function (t) {
      h += '<div class="card trab"><div class="meta">' + EG.esc(EG.fecha(t.fecha)) + (t.tipo ? ' · ' + EG.esc(t.tipo) : '') + (t.km ? ' <span>· ' + EG.esc(Number(t.km).toLocaleString('es-CL')) + ' km</span>' : '') + (t.horas ? ' <span>· ' + EG.esc(t.horas) + ' h</span>' : '') + '</div><pre>' + EG.esc(t.resumen) + '</pre></div>';
    });
    return h || '<p class="muted">Todavía no hay trabajos publicados.</p>';
  };

  /* ── Medios de pago ── */
  EG.cobroHtml = function (l) {
    if (!l || !l.length) return '';
    return '<h3>Cómo pagar</h3>' + l.map(function (c) {
      var filas = [['Banco', c.banco], ['Tipo de cuenta', c.tipo_cuenta], ['N° de cuenta', c.numero], ['Titular', c.titular], ['RUT', c.rut], ['Correo', c.correo]].filter(function (x) { return x[1]; });
      return '<div class="cobro"><b>' + EG.esc(c.nombre) + '</b>' + (c.detalle ? '<div class="muted">' + EG.esc(c.detalle) + '</div>' : '') +
        (filas.length ? '<dl>' + filas.map(function (x) { return '<dt>' + EG.esc(x[0]) + '</dt><dd class="copia">' + EG.esc(x[1]) + '</dd>'; }).join('') + '</dl>' : '') + '</div>';
    }).join('');
  };

  /* ── Presupuesto (A3) ── */
  EG.presupuestoHtml = function (p, k, idx) {
    var t = p.taller || {}, v = p.vehiculo, iva = p.iva_pct || 19, pre = 'ps' + idx;
    var nec = (p.items || []).filter(function (x) { return !x.opcional; }), opc = (p.items || []).filter(function (x) { return x.opcional; });
    var fila = function (x, chk) {
      return '<tr><td>' + (chk ? '<label class="opc"><input type="checkbox" class="' + pre + '-opc" value="' + EG.esc(x.id) + '" data-t="' + Number(x.total) + '"> ' : '') + EG.esc(x.descripcion) + (chk ? '</label>' : '') + '</td><td class="n">' + EG.esc(EG.num(x.cantidad)) + (x.unidad ? ' ' + EG.esc(x.unidad) : '') + '</td><td class="n">' + EG.pesos(x.precio_unitario) + '</td><td class="n">' + EG.pesos(x.total) + '</td></tr>';
    };
    var tabla = function (l, chk) { return '<table class="items"><thead><tr><th>Detalle</th><th class="n">Cant.</th><th class="n">Unitario</th><th class="n">Total</th></tr></thead><tbody>' + l.map(function (x) { return fila(x, chk); }).join('') + '</tbody></table>'; };
    var tot = (p.totales || {}).necesario || { neto: 0, iva: 0, total: 0 };
    var banner = p.estado === 'Autorizado' ? '<div class="aviso ok">Presupuesto autorizado' + (p.cerrado ? ' el ' + EG.esc(EG.fecha(p.cerrado)) : '') + '.</div>'
      : p.estado === 'Rechazado' ? '<div class="aviso">Presupuesto no autorizado' + (p.cerrado ? ' (' + EG.esc(EG.fecha(p.cerrado)) + ')' : '') + '.</div>'
      : p.vencido ? '<div class="aviso">Este presupuesto venció el ' + EG.esc(EG.fecha(p.vence)) + '. Pide uno actualizado a Eisen Garage.</div>' : '';
    var h = '<article class="card presupuesto" id="' + pre + '">' + banner +
      '<div class="emisor"><b>' + EG.esc(t.razon_social || 'Eisen Garage SpA') + '</b><span>RUT ' + EG.esc(t.rut || '') + ' · ' + EG.esc(t.direccion || '') + ' · ' + EG.esc(t.correo || '') + '</span></div>' +
      '<h2>Presupuesto ' + EG.esc(p.codigo) + '</h2>' +
      '<p class="muted">Emitido el ' + EG.esc(EG.fecha(p.fecha)) + (p.vence ? ' · válido hasta el ' + EG.esc(EG.fecha(p.vence)) : '') + (p.revision > 1 ? ' · versión ' + EG.esc(p.revision) : '') + '</p>' +
      '<dl class="kv">' + (p.cliente && p.cliente.nombre ? '<dt>Cliente</dt><dd>' + EG.esc(p.cliente.nombre) + '</dd>' : '') + (v ? '<dt>Vehículo</dt><dd>' + EG.esc(EG.vehiculo(v)) + (v.patente ? ' · ' + EG.esc(String(v.patente).toUpperCase()) : '') + '</dd>' : '') + '<dt>Trabajo</dt><dd>' + EG.esc(p.titulo) + '</dd></dl>' +
      (p.diagnostico ? '<h3>Diagnóstico y propuesta</h3><pre>' + EG.esc(p.diagnostico) + '</pre>' : '') +
      (nec.length ? '<h3>Trabajo necesario</h3>' + tabla(nec, false) : '') +
      '<table class="tot"><tr><td>Neto</td><td class="n">' + EG.pesos(tot.neto) + '</td></tr><tr><td>IVA ' + EG.esc(iva) + ' %</td><td class="n">' + EG.pesos(tot.iva) + '</td></tr><tr class="g"><td>Total</td><td class="n">' + EG.pesos(tot.total) + '</td></tr></table>' +
      (opc.length ? '<h3>Recomendado (opcional)</h3>' + (p.puede_responder ? '<p class="muted">Marca lo que quieres que incluyamos.</p>' : '') + tabla(opc, p.puede_responder) +
        '<table class="tot"><tr class="g"><td>Total con lo opcional elegido</td><td class="n" id="' + pre + '-totopc">' + EG.pesos(tot.total) + '</td></tr></table>' : '') +
      (p.condiciones ? '<h3>Condiciones</h3><pre>' + EG.esc(p.condiciones) + '</pre>' : '') +
      EG.cobroHtml(p.cobro) +
      '<p class="noprint"><button type="button" class="btn ghost" data-imprimir>Imprimir o guardar PDF</button></p>';
    if (p.puede_responder) {
      h += '<form class="responder noprint" id="' + pre + '-form"><h3>Tu respuesta</h3>' +
        '<label class="op"><input type="radio" name="' + pre + '-r" value="Autorizo"> Autorizo el trabajo</label>' +
        '<label class="op"><input type="radio" name="' + pre + '-r" value="No autorizo"> No autorizo</label>' +
        '<label class="op"><input type="radio" name="' + pre + '-r" value="Consulta"> Tengo una consulta</label>' +
        '<label class="f"><span>Tu nombre *</span><input name="nombre" maxlength="80" autocomplete="name" required></label>' +
        '<label class="f"><span>Mensaje (opcional; obligatorio si es consulta)</span><textarea name="mensaje" maxlength="1000" rows="3"></textarea></label>' +
        '<button class="btn go" type="submit">Enviar respuesta</button>' +
        '<p class="muted peq">Queda registrada con fecha y hora. Tu nombre se anota tal como lo escribes. Eisen Garage confirma la autorización y te contacta. <a href="../privacidad/">Privacidad</a>.</p>' +
        '<div class="msg" role="status"></div></form>';
    }
    return h + '</article>';
  };
  EG.activarPresupuesto = function (raiz, p, k, idx, extra) {
    var pre = 'ps' + idx, tot = ((p.totales || {}).necesario || {}).total || 0, iva = p.iva_pct || 19;
    var imp = raiz.querySelector('#' + pre + ' [data-imprimir]'); if (imp) imp.addEventListener('click', function () { w.print(); });
    var chks = raiz.querySelectorAll('.' + pre + '-opc');
    var recalcular = function () {
      var extraNeto = 0; Array.prototype.forEach.call(chks, function (c) { if (c.checked) extraNeto += Number(c.getAttribute('data-t')) || 0; });
      var el = raiz.querySelector('#' + pre + '-totopc'); if (el) el.textContent = EG.pesos(tot + extraNeto + Math.round(extraNeto * iva / 100));
    };
    Array.prototype.forEach.call(chks, function (c) { c.addEventListener('change', recalcular); });
    var f = raiz.querySelector('#' + pre + '-form'); if (!f) return;
    var clave = EG.clave();
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var r = (f.querySelector('input[name="' + pre + '-r"]:checked') || {}).value, msg = f.querySelector('.msg'), btn = f.querySelector('button[type=submit]');
      if (!r) { msg.textContent = 'Elige una opción.'; return; }
      var ops = []; Array.prototype.forEach.call(chks, function (c) { if (c.checked) ops.push(c.value); });
      var body = { accion: 'responder', k: k, revision: p.revision, respuesta: r, opcionales: r === 'Autorizo' ? ops : [], nombre: f.nombre.value.trim(), mensaje: f.mensaje.value.trim(), clave: clave };
      if (extra) Object.assign(body, extra);
      btn.disabled = true; msg.textContent = 'Enviando…';
      EG.post(body).then(function (res) {
        if (res.ok) { f.innerHTML = '<div class="aviso ok">¡Gracias! Recibimos tu respuesta (' + EG.esc(r) + '). Eisen Garage la revisará y te contactará.</div>'; }
        else { btn.disabled = false; msg.textContent = (res.error && res.error.message) || 'No se pudo enviar.'; if (res.error && res.error.code === 'CAMBIO') clave = EG.clave(); }
      });
    });
  };

  /* ── Estado de cuenta (A2) ── */
  EG.cuentaHtml = function (c) {
    var t = c.totales || {}, saldo = Number(t.saldo) || 0;
    var h = '<div class="card"><p class="muted">Al ' + EG.esc(EG.fecha(c.al)) + (c.vence ? ' · disponible hasta el ' + EG.esc(EG.fecha(c.vence)) : '') + '. Montos con IVA incluido.</p>' +
      '<table class="tot"><tr><td>Total trabajos</td><td class="n">' + EG.pesos(t.cobrado) + '</td></tr><tr><td>Pagado</td><td class="n">' + EG.pesos(t.pagado) + '</td></tr>' +
      '<tr class="g"><td>' + (saldo > 0 ? 'Saldo por pagar' : saldo < 0 ? 'Saldo a tu favor' : 'Saldo') + '</td><td class="n">' + EG.pesos(Math.abs(saldo)) + '</td></tr></table></div>';
    if ((c.trabajos || []).length) {
      h += '<h3>Trabajos</h3>' + c.trabajos.map(function (x) {
        return '<div class="card trab"><div class="meta">' + EG.esc(EG.fecha(x.fecha)) + (x.vehiculo ? ' · ' + EG.esc(x.vehiculo) : '') + '</div><div>' + EG.esc(x.descripcion) + '</div>' +
          '<table class="items">' + x.cobros.map(function (k) { return '<tr><td>' + EG.esc(k.descripcion) + '</td><td class="n">' + EG.pesos(k.monto) + '</td></tr>'; }).join('') + '<tr class="g"><td>Total</td><td class="n">' + EG.pesos(x.total) + '</td></tr></table></div>';
      }).join('');
    }
    if ((c.pagos || []).length) h += '<h3>Pagos recibidos</h3><div class="card"><table class="items">' + c.pagos.map(function (x) { return '<tr><td>' + EG.esc(EG.fecha(x.fecha)) + (x.medio ? ' · ' + EG.esc(x.medio) : '') + '</td><td class="n">' + EG.pesos(x.monto) + '</td></tr>'; }).join('') + '</table></div>';
    if ((c.documentos || []).length) h += '<h3>Documentos emitidos</h3><div class="card"><table class="items">' + c.documentos.map(function (x) { return '<tr><td>' + EG.esc(x.tipo) + (x.folio ? ' N° ' + EG.esc(x.folio) : '') + (x.fecha ? ' · ' + EG.esc(EG.fecha(x.fecha)) : '') + '</td><td class="n">' + (x.total != null ? EG.pesos(x.total) : '') + '</td></tr>'; }).join('') + '</table></div>';
    if (saldo > 0) h += '<div class="card">' + EG.cobroHtml(c.cobro) + '</div>';
    return h;
  };

  w.EG = EG;
})(window);
