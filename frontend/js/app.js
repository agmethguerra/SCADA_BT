/* ==================================================================
   SCADA BANDA TRANSPORTADORA · app.js
   Etapa 5: interfaz alimentada con DATOS SIMULADOS
   ================================================================== */

/* ---------- 1. CONFIGURACIÓN ---------- */
const CONFIG = {
  intervaloSimulacionMs: 500, // cada cuánto el simulador genera datos
  tiempoDesactualizadoMs: 3000, // sin datos por más de 3 s: "desactualizado"
  tiempoSinComunicacionMs: 8000, // sin datos por más de 8 s: "sin comunicación"
  maxEventosHistorial: 500, // filas máximas del historial
};

/* ---------- 2. UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);

function horaLocal(fecha) {
  return fecha.toLocaleTimeString("es-CO", { hour12: false });
}

function nombreOrigen(origen) {
  if (origen === "SIMULACION") return "Simulación";
  if (origen === "PLC") return "PLC";
  return origen || "Desconocido";
}

/* ---------- 3. ESTADO DE LA APLICACIÓN ---------- */
const estado = {
  ultimoDato: null, // último objeto de datos recibido
  ultimaRecepcion: null, // momento (ms) en que llegó, medido por este navegador
  nivelCom: "inicial", // "inicial" | "ok" | "desactualizado" | "perdida"
};

/* ---------- 4. HISTORIAL DE EVENTOS ---------- */
const CLAVE_HISTORIAL = "scada_banda_historial";
let historial = []; // cada elemento: { iso, evento, valor, origen } (el más reciente primero)

function fechaHoraLocal(fecha) {
  return fecha.toLocaleString("es-CO", { hour12: false });
}

function guardarHistorial() {
  try {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
  } catch (error) {
    console.warn("No se pudo guardar el historial:", error);
  }
}

function crearFila(e) {
  const fila = document.createElement("tr");
  [fechaHoraLocal(new Date(e.iso)), e.evento, e.valor, e.origen].forEach(
    (texto) => {
      const celda = document.createElement("td");
      celda.textContent = texto; // textContent evita insertar HTML no deseado
      fila.appendChild(celda);
    },
  );
  return fila;
}

function registrarEvento(evento, valor, origen) {
  const e = {
    iso: new Date().toISOString(),
    evento: String(evento),
    valor: String(valor),
    origen: String(origen),
  };
  historial.unshift(e); // el más reciente al inicio
  if (historial.length > CONFIG.maxEventosHistorial) historial.pop();

  const cuerpo = $("tabla-historial");
  cuerpo.prepend(crearFila(e));
  while (cuerpo.rows.length > CONFIG.maxEventosHistorial) {
    cuerpo.lastElementChild.remove();
  }
  guardarHistorial();
}

function cargarHistorial() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]");
    if (Array.isArray(guardado)) historial = guardado;
  } catch (error) {
    console.warn("Historial guardado no válido; se ignora:", error);
    historial = [];
  }
  const cuerpo = $("tabla-historial");
  cuerpo.innerHTML = "";
  historial.forEach((e) => cuerpo.appendChild(crearFila(e)));
}

function exportarCSV() {
  if (historial.length === 0) {
    alert("No hay eventos para exportar.");
    return;
  }
  const esc = (t) => '"' + String(t).replace(/"/g, '""') + '"';
  const filas = ["fecha_hora_local,iso_utc,evento,valor,origen"];
  [...historial].reverse().forEach((e) => {
    // del más antiguo al más reciente
    filas.push(
      [
        esc(fechaHoraLocal(new Date(e.iso))),
        esc(e.iso),
        esc(e.evento),
        esc(e.valor),
        esc(e.origen),
      ].join(","),
    );
  });
  const blob = new Blob(["\uFEFF" + filas.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download =
    "historial_scada_" +
    new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") +
    ".csv";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

$("btn-exportar").addEventListener("click", exportarCSV);
$("btn-limpiar").addEventListener("click", () => {
  if (confirm("¿Borrar todo el historial guardado en este navegador?")) {
    historial = [];
    guardarHistorial();
    $("tabla-historial").innerHTML = "";
  }
});

cargarHistorial(); // al abrir la página, recupera lo guardado

function detectarEventos(previo, actual) {
  const origen = nombreOrigen(actual.origen);
  if (previo === null) {
    registrarEvento("Primer dato recibido", "-", origen);
    return;
  }
  if (previo.motor !== actual.motor && actual.motor !== undefined) {
    registrarEvento("Motor", actual.motor ? "En marcha" : "Detenido", origen);
  }
  if (previo.productos !== actual.productos && actual.productos !== undefined) {
    registrarEvento("Producto contado", actual.productos, origen);
  }
  if (previo.modo !== actual.modo && actual.modo !== undefined) {
    registrarEvento("Modo de operación", actual.modo, origen);
  }
  const antes = (previo.alarmas || []).map((a) => a.codigo);
  const ahora = (actual.alarmas || []).map((a) => a.codigo);
  (actual.alarmas || []).forEach((a) => {
    if (!antes.includes(a.codigo)) {
      registrarEvento("Alarma activada: " + a.codigo, a.mensaje, origen);
    }
  });
  (previo.alarmas || []).forEach((a) => {
    if (!ahora.includes(a.codigo)) {
      registrarEvento("Alarma normalizada: " + a.codigo, "-", origen);
    }
  });
}

/* ---------- 5. DIBUJO DE LA INTERFAZ ---------- */
function pintarTarjeta(idTarjeta, idValor, texto, clase) {
  $(idValor).textContent = texto;
  const tarjeta = $(idTarjeta);
  tarjeta.classList.remove("ok", "alerta", "peligro");
  if (clase) tarjeta.classList.add(clase);
}

function textoBooleano(valor, siTrue, siFalse) {
  if (valor === undefined || valor === null) return "No disponible";
  return valor ? siTrue : siFalse;
}

// Dibuja un producto bajo cada sensor que esté activo.
// Solo usa las señales de los sensores: no inventa posiciones.
function dibujarProductos(d) {
  const capa = $("capa-productos");
  capa.innerHTML = "";
  const posiciones = [];
  if (d.sensorEntrada === true) posiciones.push(216);
  if (d.sensorSalida === true) posiciones.push(586);
  posiciones.forEach((x) => {
    const caja = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    caja.setAttribute("class", "producto");
    caja.setAttribute("x", x - 20);
    caja.setAttribute("y", 80);
    caja.setAttribute("width", 40);
    caja.setAttribute("height", 30);
    caja.setAttribute("rx", 3);
    capa.appendChild(caja);
  });
}

function renderizarDatos(d) {
  // Origen: simulación o datos reales
  const esSim = d.origen === "SIMULACION";
  const badge = $("badge-origen");
  badge.textContent = esSim ? "SIMULACIÓN" : "DATOS REALES (PLC)";
  badge.className = "badge " + (esSim ? "badge-sim" : "badge-ok");
  $("aviso-simulacion").classList.toggle("oculto", !esSim);

  // Estado general
  pintarTarjeta("tarjeta-modo", "valor-modo", d.modo || "No disponible", null);
  pintarTarjeta(
    "tarjeta-estado",
    "valor-estado",
    textoBooleano(d.motor, "En marcha", "Detenida"),
    d.motor === undefined ? null : d.motor ? "ok" : "alerta",
  );

  // Variables de proceso
  pintarTarjeta(
    "tarjeta-motor",
    "valor-motor",
    textoBooleano(d.motor, "ENCENDIDO", "APAGADO"),
    d.motor === undefined ? null : d.motor ? "ok" : null,
  );
  pintarTarjeta(
    "tarjeta-sensor-entrada",
    "valor-sensor-entrada",
    textoBooleano(d.sensorEntrada, "DETECTA", "LIBRE"),
    d.sensorEntrada === true ? "alerta" : null,
  );
  pintarTarjeta(
    "tarjeta-sensor-salida",
    "valor-sensor-salida",
    textoBooleano(d.sensorSalida, "DETECTA", "LIBRE"),
    d.sensorSalida === true ? "alerta" : null,
  );
  pintarTarjeta(
    "tarjeta-conteo",
    "valor-conteo",
    d.productos === undefined ? "No disponible" : String(d.productos),
    null,
  );

  // Gráfico de la banda
  // Modelo 3D de la banda
  if (window.Banda3D) window.Banda3D.actualizar(d);
}

function renderizarAlarmas() {
  const lista = $("lista-alarmas");
  lista.innerHTML = "";
  const activas = [];

  if (estado.nivelCom === "perdida") {
    // Condición verificable: no llegan datos. Del proceso no se puede afirmar nada.
    activas.push({
      codigo: "COM-01",
      mensaje:
        "Sin comunicación con la fuente de datos. Los valores mostrados están desactualizados.",
    });
  } else if (estado.ultimoDato && Array.isArray(estado.ultimoDato.alarmas)) {
    activas.push(...estado.ultimoDato.alarmas);
  }

  if (activas.length === 0) {
    const li = document.createElement("li");
    li.className = "alarma-vacia";
    const sinSenal =
      estado.ultimoDato && !Array.isArray(estado.ultimoDato.alarmas);
    li.textContent = !estado.ultimoDato
      ? "Sin información de alarmas"
      : sinSenal
        ? "Alarmas no disponibles: la fuente de datos no envía señales de alarma"
        : "Sin alarmas activas";
    lista.appendChild(li);
  } else {
    activas.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a.codigo + " · " + a.mensaje;
      lista.appendChild(li);
    });
  }

  if (estado.ultimoDato) {
    const sinSenalAlarmas =
      !Array.isArray(estado.ultimoDato.alarmas) &&
      estado.nivelCom !== "perdida";
    if (sinSenalAlarmas) {
      pintarTarjeta(
        "tarjeta-alarmas",
        "valor-num-alarmas",
        "No disponible",
        null,
      );
    } else {
      pintarTarjeta(
        "tarjeta-alarmas",
        "valor-num-alarmas",
        String(activas.length),
        activas.length > 0 ? "peligro" : "ok",
      );
    }
  }
}

/* ---------- 6. SUPERVISIÓN DE LA COMUNICACIÓN ---------- */
function evaluarComunicacion() {
  let nivel = "inicial";
  let edadMs = 0;
  if (estado.ultimaRecepcion !== null) {
    edadMs = Date.now() - estado.ultimaRecepcion;
    if (edadMs > CONFIG.tiempoSinComunicacionMs) nivel = "perdida";
    else if (edadMs > CONFIG.tiempoDesactualizadoMs) nivel = "desactualizado";
    else nivel = "ok";
  }

  // Registrar cambios importantes en el historial
  if (nivel !== estado.nivelCom) {
    if (nivel === "perdida") {
      registrarEvento("Comunicación perdida", "-", "Interfaz");
    }
    if (estado.nivelCom === "perdida" && nivel === "ok") {
      registrarEvento("Comunicación recuperada", "-", "Interfaz");
    }
    estado.nivelCom = nivel;
  }

  // Indicador de comunicación en el encabezado
  const esSim = estado.ultimoDato && estado.ultimoDato.origen === "SIMULACION";
  const insignia = $("badge-comunicacion");
  const texto = $("texto-comunicacion");
  if (nivel === "ok") {
    insignia.className = "badge badge-ok";
    texto.textContent = "Comunicación: " + (esSim ? "simulada " : "") + "OK";
  } else if (nivel === "desactualizado") {
    insignia.className = "badge badge-alerta";
    texto.textContent = "Datos desactualizados";
  } else if (nivel === "perdida") {
    insignia.className = "badge badge-error";
    texto.textContent = "Sin comunicación";
  } else {
    insignia.className = "badge badge-neutro";
    texto.textContent = "Esperando datos";
  }

  // Última actualización
  if (estado.ultimoDato) {
    const instante = new Date(estado.ultimoDato.timestamp);
    let t = horaLocal(
      isNaN(instante) ? new Date(estado.ultimaRecepcion) : instante,
    );
    if (nivel !== "ok") t += " (hace " + Math.round(edadMs / 1000) + " s)";
    $("ultima-actualizacion").textContent = t;
  }

  // Atenuar datos viejos y detener la animación de la banda
  const obsoleto = nivel === "desactualizado" || nivel === "perdida";
  document.querySelector(".tablero").classList.toggle("obsoleto", obsoleto);
  const motorMarcha = estado.ultimoDato && estado.ultimoDato.motor === true;
  if (window.Banda3D) window.Banda3D.setMarcha(motorMarcha && !obsoleto);

  renderizarAlarmas();
}

/* ---------- 7. PUNTO DE ENTRADA DE LOS DATOS ---------- */
// Esta es la ÚNICA función que recibe datos. Hoy la llama el simulador;
// más adelante la llamará la conexión con Node-RED.
function recibirDatos(datos) {
  if (typeof datos !== "object" || datos === null) return; // descarta basura
  const previo = estado.ultimoDato;
  estado.ultimoDato = datos;
  estado.ultimaRecepcion = Date.now();
  detectarEventos(previo, datos);
  renderizarDatos(datos);
  evaluarComunicacion();
}

/* ==================================================================
   CONEXIÓN CON NODE-RED (WebSocket)
   ================================================================== */
const WS_URL = "ws://" + (location.hostname || "localhost") + ":1880/ws/banda";
let socket = null;
let cortePrueba = false; // solo para probar la pérdida de comunicación

function conectar() {
  socket = new WebSocket(WS_URL);

  socket.onopen = () =>
    registrarEvento("Conexión WebSocket abierta", WS_URL, "Interfaz");

  socket.onmessage = (evento) => {
    if (cortePrueba) return; // ignora los datos durante la prueba de corte
    try {
      recibirDatos(JSON.parse(evento.data));
    } catch (error) {
      console.warn("Mensaje no válido:", error);
    }
  };

  socket.onerror = () => socket.close();
  socket.onclose = () => setTimeout(conectar, 2000); // reintenta cada 2 s
}

$("btn-corte").addEventListener("click", () => {
  cortePrueba = !cortePrueba;
  $("btn-corte").textContent = cortePrueba
    ? "Restablecer comunicación simulada"
    : "Simular pérdida de comunicación";
});

conectar();
/* ---------- 8. ARRANQUE ---------- */
setInterval(evaluarComunicacion, 1000); // vigila el tiempo sin datos
evaluarComunicacion();
