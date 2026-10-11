# Forex Bot v0.2 — motor simulado y panel

No publicado. OANDA desconectado. Todos los precios del motor son generados matemáticamente y sus resultados NO miden rentabilidad de mercado. La conexión a OANDA se deja para la última etapa.

## Incluido

- Panel responsive con pausa, configuración, posiciones, cierre manual e historial CSV.
- Motor Python con cruces SMA 5/20 sobre ticks sintéticos, stop de 0.002 y objetivo de 0.004. Señal educativa sin validar; no usa velas M15.
- Ejecución simulada con spread fijo ilustrativo de 1 pip. No modela liquidez, comisiones, financiación ni todos los costos reales.
- Riesgo abierto máximo 2%, máximo dos posiciones y bloqueo de entradas con caída diaria del equity de 4%. Son hipótesis iniciales.
- SQLite conserva configuración, posiciones, historial y eventos. Reiniciar el servidor pausa nuevas entradas.
- API de control autenticada. El panel necesita una clave propia, distinta del token del bróker. La clave permanece en memoria hasta recargar o desconectar.
- Dockerfile, workflow de pruebas para GitHub y configuración Netlify.
- Adaptador OANDA practice de solo consulta, pendiente de probar y sin utilizar por el motor.

## Ejecutar localmente

Python 3.10 o posterior, sin paquetes externos.

    python3 -m unittest discover -s tests -v

Generar una clave aleatoria de al menos 32 caracteres y configurar PANEL_ACCESS_TOKEN como variable de entorno del servidor. No incorporarla al repositorio. Después:

    python3 -m bot.server

Abrir http://127.0.0.1:8765. En Configuración introducir esa dirección y la clave del panel. Conectar, volver a Panel y activar el motor simulado. Los precios avanzan cada cinco segundos. Pausar entradas no detiene las salidas protectoras. Cerrar posiciones también pausa nuevas entradas.

Sin servidor, la interfaz conserva el modo de ejemplos fijos solo en el navegador. Ese modo no aplica límites diarios. Al conectar, el estado del servidor gobierna los controles.

## GitHub / Netlify / servidor

1. Crear un repositorio independiente para el bot. Subir este directorio sin bases de datos ni claves. GitHub Actions ejecutará las pruebas.
2. En Netlify importar el repositorio. Publicación: dist, sin comando de compilación.
3. Ejecutar el motor en un servicio persistente. Con Docker montar un volumen permanente en /data. Configurar PANEL_ACCESS_TOKEN y PANEL_ORIGIN con el origen HTTPS exacto del panel Netlify, sin barra final. El servicio necesita HTTPS delante del puerto de la aplicación.
4. Configurar la URL HTTPS del servidor en el panel y conectar con su clave. No exponer directamente el servidor HTTP de desarrollo a Internet: usar proxy HTTPS y límites de tráfico.

Variables adicionales: PORT (8765), PANEL_HOST (127.0.0.1 por defecto; Docker usa 0.0.0.0), PAPER_DB_PATH (ruta SQLite persistente).

El motor necesita una sola instancia para una base de datos. No está preparado para alta disponibilidad o múltiples procesos que operen la misma cuenta. No usar con dinero real.

## Pendiente

Crear el repositorio, conectar Netlify y desplegar el servidor. Definir y validar estrategia con históricos reales, costos, períodos fuera de muestra y pruebas de robustez. Por último conectar OANDA demo y desarrollar ejecución de órdenes, conciliación, prevención de duplicados y recuperación ante errores. Este paquete no habilita operar dinero real.

Las pruebas comprueban dimensionamiento, exposición máxima, pausa/salidas, límite diario, generación de posiciones ficticias, autenticación y persistencia tras reinicio. La interfaz no fue verificada en navegador en esta sesión.
