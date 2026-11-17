# Documentación del desarrollo: SCADA web para banda transportadora

## 1. Introducción y objetivo
## 2. Alcance y limitaciones
- Sistema de supervisión en modo solo lectura
- Variables verificadas vs. propuestas (ver inventario_variables.md)
- Qué se probó con datos simulados y qué con el PLC real

## 3. Arquitectura
- Diagrama de tres niveles (diagrama_arquitectura.png)
- Descripción de cada componente

## 4. Herramientas y tecnologías
Node.js, Node-RED, Express, HTML, CSS, JavaScript, OPC UA

## 5. Desarrollo por etapas
1. Preparación del entorno
2. Estructura del proyecto
3. Prueba Inject/Debug en Node-RED
4. Interfaz con datos simulados
5. Comunicación Node-RED → WebSocket → interfaz
6. Historial persistente y exportación CSV
7. Seguridad
8. Comunicación OPC UA (servidor simulado)
9. Configuración centralizada de variables

## 6. Comunicación con el PLC
- Método elegido y justificación
- Configuración usada
- Alternativa evaluada (S7) y por qué se descartó o se usó

## 7. Pérdida de comunicación y alarmas
- Estados: OK, desactualizado, sin comunicación
- Alarmas basadas solo en señales reales o verificables

## 8. Pruebas
Resumen de docs/pruebas.md con referencias a las evidencias

## 9. Problemas encontrados y soluciones
- Error EACCES de npm por instalar con sudo
- Mezcla de mensajes del simulador con la prueba OPC UA
- (agregar los que surjan)

## 10. Conclusiones y trabajo futuro

## Anexos
- Manual de instalación (README.md)
- Inventario de variables
- Flujos de Node-RED (flows.json)