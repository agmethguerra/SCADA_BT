// SERVIDOR OPC UA SIMULADO (solo para pruebas). NO es el PLC.
// Expone 5 variables: 4 de lectura y "arrancar", que se puede escribir.
const { OPCUAServer, Variant, DataType, StatusCodes } = require("node-opcua");

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

  // Estado simulado. "arrancar" es la orden que escribe la interfaz.
  const estado = {
    arrancar: false,
    motor: false,
    sensorEntrada: false,
    sensorSalida: false,
    productos: 0,
  };

  function agregarVariable(nombre, tipoOPC, tipoDato, editable = false) {
    const acceso = {
      get: () => new Variant({ dataType: tipoDato, value: estado[nombre] }),
    };
    if (editable) {
      acceso.set = (variant) => {
        estado[nombre] = Boolean(variant.value);
        return StatusCodes.Good;
      };
    }
    const variable = namespace.addVariable({
      componentOf: objeto,
      browseName: nombre,
      nodeId: "s=" + nombre,
      dataType: tipoOPC,
      value: acceso,
    });
    console.log("Variable simulada:", nombre, "->", variable.nodeId.toString());
  }

  agregarVariable("arrancar", "Boolean", DataType.Boolean, true);
  agregarVariable("motor", "Boolean", DataType.Boolean);
  agregarVariable("sensorEntrada", "Boolean", DataType.Boolean);
  agregarVariable("sensorSalida", "Boolean", DataType.Boolean);
  agregarVariable("productos", "UInt32", DataType.UInt32);

  // El motor sigue la orden "arrancar"; los sensores/productos simulan el ciclo.
  let tick = 0;
  setInterval(() => {
    tick++;
    estado.motor = estado.arrancar === true;
    estado.sensorEntrada = estado.motor && (tick % 10 === 5 || tick % 10 === 6);
    estado.sensorSalida = estado.motor && (tick % 10 === 3 || tick % 10 === 4);
    if (estado.motor && tick % 10 === 4) estado.productos++;
  }, 1000);

  await server.start();
  console.log("Servidor OPC UA SIMULADO en marcha:", server.getEndpointUrl());
  console.log("Ctrl + C para detenerlo.");
})();
