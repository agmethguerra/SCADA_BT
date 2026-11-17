# SCADA Banda transportadora — Manual de instalación

SCADA web para supervisar una banda transportadora, con **lectura de variables y control de arranque**. La interfaz se sirve con Express, recibe los datos por WebSocket desde Node-RED, los lee por OPC UA desde un servidor simulado (o desde el PLC real, una vez configurado) y envía la orden `arrancar` por el mismo WebSocket.

## 1. Requisitos

- **Node.js** con **npm** (se desarrolló y probó con Node.js v26.12.1 y npm 11.20.0).
- No se necesita Python ni bases de datos.

## 2. Instalación

Desde la carpeta del proyecto:

```bash
cd SCADA_BANDA
npm run setup
```

Ese script instala las dependencias de la raíz y las de Node-RED (`npm install && npm --prefix nodered install`).

> Si aparece un error `EACCES`, **no uses `sudo npm install`**: corrige los permisos de la carpeta del proyecto con `chown -R $USER .` (en Windows, ejecuta la terminal como usuario normal) y vuelve a intentarlo.

## 3. Arranque

Se necesitan **tres terminales**, en este orden:

| # | Terminal | Comando | Qué levanta |
|---|---|---|---|
| 1 | Servidor OPC UA simulado | `npm run opcua-sim` | `opc.tcp://localhost:4840/UA/BandaSim` |
| 2 | Node-RED | `npm run nodered` | Editor en `http://127.0.0.1:1880` |
| 3 | Interfaz web | `npm start` | SCADA en `http://localhost:3000` |

Node-RED usa `nodered/settings.js` como directorio de usuario (`--userDir nodered`) y carga `nodered/flows.json`. El flujo habilitado es **Flujo 2**; **Flujo 1** está deshabilitado.

El editor de Node-RED está enlazado a `127.0.0.1` y pide autenticación. El usuario es `admin`; la contraseña está guardada como hash en `nodered/settings.js` (índice `adminAuth`). Si no conoces la contraseña, genera un hash nuevo siguiendo la documentación de Node-RED y reemplázalo ahí. No publicues ese archivo con credenciales reales.

En Windows los mismos comandos funcionan en PowerShell o CMD.

## 4. Verificación

1. Abrir `http://localhost:3000`.
2. El badge superior debe decir **SIMULACIÓN** y el de comunicación debe estar activo. La banda arranca detenida: pulsa **Arrancar** en la cabecera de la vista 3D para enviar `arrancar=true`; el botón pasa a **Detener** cuando la lectura confirma la orden.
3. En Node-RED, los nodos `debug 2`, `salida arriba` y `salida abajo` muestran las lecturas OPC UA y `resultado escritura arrancar` confirma la escritura de la orden.
4. Datos y eventos viajan por el WebSocket `ws://<host>:1880/ws/banda` (el frontend toma el host de la URL, así que la interfaz y Node-RED deben estar en el mismo computador o en un host alcanzable).

Si la interfaz marca "sin comunicación", comprobar que el simulador y Node-RED siguen corriendo y que el puerto `1880` no esté ocupado. Los puertos usados son **3000**, **1880** y **4840**.

## 5. Variables y cambio a PLC real

Las variables en uso están documentadas en `docs/inventario_variables.md` y se configuran en un único lugar: el nodo función **"CONFIGURACIÓN DE VARIABLES (editar aquí)"** del Flujo 2 en `nodered/flows.json`.

Para pasar del simulador al PLC real:

1. Arrancar Node-RED sin el simulador (o dejarlo apagado).
2. Editar ese nodo: cambiar `origen: "SIMULACION"` por `origen: "PLC"` y reemplazar los `nodeId` por los reales del PLC, respetando el tipo de dato (`Boolean`, `UInt32`, etc.). **No inventar NodeIds**: solo se usan señales verificadas en el PLC. `arrancar` debe apuntar a una señal **escribible** real.
3. Ajustar el nodo `OpcUa-Endpoint` con la URL y la seguridad del servidor real (actualmente `None`/`None`, sin login). El nodo "Escribir arrancar" usa el mismo endpoint.
4. Desplegar los cambios en Node-RED y recargar la interfaz. El badge debe pasar a **DATOS REALES (PLC)**.

La única escritura es `arrancar` (botón Arrancar/Detener); el resto de variables son de lectura. No hay comandos de paro, reset ni velocidad. Las variables `modo` y `alarmas` no se envían a la interfaz mientras no existan señales reales que las respalden. Antes de escribir en un PLC real, verificar la señal de arranque con el responsable del proceso.

## 6. Estructura

```
backend/server.js                 Servidor estático Express (puerto 3000)
frontend/                         Interfaz HTML/CSS/JS y modelo 3D (three.js)
nodered/flows.json                Flujos activos de Node-RED
nodered/settings.js               Configuración y seguridad de Node-RED
nodered/simulador/                Servidor OPC UA simulado para pruebas
docs/inventario_variables.md      Variables actualmente en uso
docs/pruebas.md                   Registro de pruebas
docs/documentacion_desarrollo.md  Memoria del desarrollo
docs/flows_respaldo_*.json        Copias de seguridad de los flujos
```

## 7. Seguridad

- El editor de Node-RED escucha solo en `127.0.0.1` y requiere usuario/contraseña.
- El WebSocket `/ws/banda` y la interfaz web no tienen autenticación: usarlos solo en la red local del laboratorio, sin exponerlos a Internet.
- La comunicación OPC UA con el simulador no usa seguridad ni certificados; configura `SecurityPolicy`/`SecurityMode` y credenciales acordes al PLC real antes de conectarte a él.
