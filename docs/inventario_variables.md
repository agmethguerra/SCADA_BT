# Variables en uso

Estas son las variables configuradas actualmente para la conexión con la banda transportadora.

Fuente: `nodered/flows.json`, nodo función **"CONFIGURACIÓN DE VARIABLES (editar aquí)"** (id `471de4192618f315`), en el flujo habilitado. Ese nodo es el único lugar a editar; el nodo "Armar datos" toma la configuración de ahí con `flow.get("config")`.

| Variable (nombre en la interfaz) | NodeId OPC UA | Tipo de dato | Descripción |
|---|---|---|---|
| `motor` | `ns=1;s=motor` | `Boolean` | Estado del motor de la banda (marcha / detenido) |
| `sensorEntrada` | `ns=1;s=sensorEntrada` | `Boolean` | Estado del sensor de entrada de material |
| `sensorSalida` | `ns=1;s=sensorSalida` | `Boolean` | Estado del sensor de salida de material |
| `productos` | `ns=1;s=productos` | `UInt32` | Conteo acumulado de piezas transportadas |

## Notas

- Cada variable se lee con una orden `<nodeId>;datatype=<tipo>`, por ejemplo `ns=1;s=motor;datatype=Boolean`.
- Endpoint configurado: `opc.tcp://localhost:4840/UA/BandaSim`, sin seguridad ni autenticación (`secpol`/`secmode` en `None`).
- `origen` está en `"SIMULACION"`: los datos provienen del servidor OPC UA simulado, no del PLC real. Para usar el PLC hay que cambiar `origen` a `"PLC"` y sustituir los NodeId por los reales en el nodo de configuración, sin inventar NodeIds.
- El sistema es **solo lectura**: no hay variables de comando (marcha, paro, reset) ni de escritura.
- `modo` y `alarmas` no se envían a la interfaz porque no hay señales reales que las respalden.
- Los nombres `BANDA_*` listados anteriormente eran propuestas de inventario; no están cableadas en el flujo activo. Una variable que no exista en el PLC debe eliminarse de la tabla de configuración: la interfaz mostrará "No disponible".
