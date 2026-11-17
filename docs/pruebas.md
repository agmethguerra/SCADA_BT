# Registro de pruebas

Regla: cada prueba indica si fue con DATOS SIMULADOS o con el PLC REAL.

| N.º | Fecha | Prueba | Datos | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|---|---|
| 1 | 05/11/2026 | Node.js, npm y Node-RED instalados y en ejecución | N/A | Versiones visibles; editor en localhost:1880 | OK | Captura |
| 2 | 05/11/2026 | Estructura del frontend (HTML + CSS + JS enlazados) | N/A | Estilos y script cargados | OK | Captura |
| 3 | 05/11/2026 | Flujo inject → function → debug | Simulados | Objeto con origen "SIMULACION" y contador creciente | OK | Captura del panel de depuración |
| 4 | 05/11/2026 | Interfaz con simulador interno | Simulados | Indicadores, banda, alarma SIM-01 y historial se actualizan | OK | Captura |
| 5 | 05/11/2026 | Pérdida de comunicación (botón de prueba) | Simulados | Estados: OK → desactualizado → sin comunicación; alarma COM-01 | OK | Captura |
| 6 | 06/11/2026 | Node-RED → WebSocket → interfaz | Simulados | La página recibe datos de Node-RED | OK | Captura |
| 7 | 06/11/2026 | Detener y reiniciar Node-RED | Simulados | Detecta la pérdida y se reconecta sola | OK | Captura |
| 8 | 06/11/2026 | Proyecto ejecutado con npm run nodered y npm start | Simulados | Funciona en localhost:3000 | OK | Captura |
| 9 | | Historial persistente tras recargar | Simulados | Los eventos se conservan | | |
| 10 | | Exportación a CSV | Simulados | Archivo con columna origen | | |
| 11 | | Proyecto ejecutado en Windows (README) | Simulados | Funciona siguiendo el manual | | |
| 12 | | Lectura de variables del PLC real | PLC real | Valores coinciden con el proceso | | |
| 13 | | Conteo de productos contra conteo manual | PLC real | Coincide con el conteo físico | | |
| 14 | | Pérdida de comunicación con el PLC | PLC real | Detecta y recupera | | |
| 18 | 06/11/2026 | Lectura OPC UA de una variable (motor) | Simulados (servidor OPC UA simulado) | payload booleano con topic ns=1;s=motor | OK | Captura del debug |
| 19 | 06/11/2026 | Lectura de 4 variables y visualización en la interfaz | Simulados | Interfaz muestra valores del servidor OPC UA | OK | Captura |
| 20 | 06/11/2026 | Pérdida de comunicación OPC UA (servidor detenido) | Simulados | Detecta, alarma COM-01 | OK | Captura |
| 21 | 06/11/2026 | Recuperación tras reiniciar el servidor OPC UA | Simulados | Se recupera sola | OK: recuperación automática | Captura |
| 23 | 06/11/2026 | Variables configuradas desde un solo nodo; quitar una variable la muestra como "No disponible" | Simulados | La interfaz funciona y marca No disponible la variable retirada | OK | Captura |
| 24 | | Exploración (browse) del servidor OPC UA | Simulados | Lista las variables y sus NodeId | NO REALIZADA | A probar en el laboratorio si el servidor OPC UA está activo |