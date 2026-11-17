// SERVIDOR OPC UA SIMULADO (solo para pruebas). NO es el PLC.
// Expone 4 variables falsas que cambian con el tiempo.
const { OPCUAServer, Variant, DataType } = require("node-opcua");

(async () => {
  const server = new OPCUAServer({
    port: 4840,
    resourcePath: "/UA/BandaSim",
    buildInfo: { productName: "Servidor OPC UA SIMULADO - Banda" },
  });

  await server.initialize();
  const addressSpace = server.engine.addressSpace;
  const namespace = addressSpace.getOwnNamespace();

  const objeto = namespace.addObject({
    organizedBy: addressSpace.rootFolder.objects,
    browseName: "BandaSimulada",
  });

  // Estado simulado (cambia en el temporizador de abajo)
  const estado = {
    motor: false,
    sensorEntrada: false,
    sensorSalida: false,
    productos: 0,
  };

  function agregarVariable(nombre, tipoOPC, tipoDato) {
    const variable = namespace.addVariable({
      componentOf: objeto,
      browseName: nombre,
      nodeId: "s=" + nombre,
      dataType: tipoOPC,
      value: {
        get: () => new Variant({ dataType: tipoDato, value: estado[nombre] }),
      },
    });
    console.log("Variable simulada:", nombre, "->", variable.nodeId.toString());
  }

  agregarVariable("motor", "Boolean", DataType.Boolean);
  agregarVariable("sensorEntrada", "Boolean", DataType.Boolean);
  agregarVariable("sensorSalida", "Boolean", DataType.Boolean);
  agregarVariable("productos", "UInt32", DataType.UInt32);

  // Simulación: ciclo de 40 s (30 s en marcha, 10 s detenido)
  let tick = 0;
  setInterval(() => {
    tick++;
    estado.motor = tick % 40 < 30;
    estado.sensorEntrada = estado.motor && (tick % 10 === 5 || tick % 10 === 6);
    estado.sensorSalida = estado.motor && (tick % 10 === 3 || tick % 10 === 4);
    if (estado.motor && tick % 10 === 4) estado.productos++;
  }, 1000);

  await server.start();
  console.log("Servidor OPC UA SIMULADO en marcha:", server.getEndpointUrl());
  console.log("Ctrl + C para detenerlo.");
})();
