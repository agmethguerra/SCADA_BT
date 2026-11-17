// Servidor web del SCADA: entrega la carpeta "frontend" y la librería three.js.
// No lee el PLC ni envía órdenes.
const express = require("express");
const path = require("path");

const app = express();
const PUERTO = 3000;

app.use("/vendor/three", express.static(path.join(__dirname, "..", "node_modules", "three")));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.listen(PUERTO, () => {
  console.log("Interfaz SCADA disponible en http://localhost:" + PUERTO);
});