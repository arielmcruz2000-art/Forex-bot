# Forex Bot v0.3 — panel privado y simulación en Netlify

Panel: https://harmonious-mandazi-c4c910.netlify.app/ (acceso privado Netlify).
Repositorio: https://github.com/arielmcruz2000-art/Forex-bot.
OANDA desconectado. Todos los precios son generados; los resultados no miden rentabilidad real.

## Funcionamiento

- El panel conecta automáticamente al motor con la sesión del proyecto privado. No requiere introducir tokens.
- Netlify Functions recibe controles y una función programada avanza un tick sintético cada minuto. Solo se ejecuta en producción publicada. La frecuencia depende del servicio y sus cuotas; no es ejecución continua de mercado.
- Netlify Blobs conserva configuración, posiciones, historial y eventos entre visitas y despliegues. Escrituras condicionales con ETag evitan perder cambios concurrentes. Los comandos se deduplican por ID (últimos 200); un tick programado como máximo por minuto. No se reproduce un backlog tras interrupciones.
- El motor comienza pausado. Activarlo persiste hasta pausar/cerrar; cerrar el navegador no lo pausa. Pausar entradas mantiene salidas por stop/objetivo; cerrar posiciones pausa entradas y registra los cierres ficticios.
- Cruce SMA 5/20 sobre ticks sintéticos, stop 0.002, objetivo 0.004, spread fijo ilustrativo de 1 pip. Sin liquidez real, financiación ni comisiones. No son velas M15.
- Cuenta ficticia USD y EUR/USD. Riesgo de nuevos trades 0.1–2%, exposición nominal abierta hasta 2%, máximo dos posiciones, bloqueo de entradas por pérdida diaria del equity del 4%, día America/New_York. Los gaps pueden superar el riesgo nominal; estos límites son hipótesis educativas.
- Historial de últimos 1000 cierres exportable CSV. Eventos limitados a 40. No borrar desde el panel.

## Seguridad y despliegue

Mantener el proyecto privado. La API exige context.user verificado por Netlify y producción publicada; no acepta identidad enviada por el cliente. Si el proyecto pasa a público o la plataforma no proporciona identidad, falla cerrado. POST exige origen del proyecto y JSON, sin CORS. Lecturas sin caché. No hay credenciales de OANDA en código ni navegador.

Netlify importa main, publica dist y empaqueta netlify/functions con Node 22. npm ci instala @netlify/blobs con versión fija y lockfile; npm run check y npm test validan antes de publicar. No requiere variables nuevas ni plan de pago adicional; sujeto a créditos y límites de la cuenta existente.

## Verificación

    npm ci
    npm test
    npm run check
    python3 -m unittest discover -s tests -v

Las pruebas cubren límites, spread/salidas con pausa, pérdida diaria, ticks y comandos duplicados, persistencia concurrente, autenticación y origen. El motor Python/SQLite anterior se conserva como alternativa local y usa PANEL_ACCESS_TOKEN >=32 caracteres; este panel v0.3 usa la API Netlify, no el Python. bot/oanda_practice.py es un adaptador de consulta sin usar.

## Próximas etapas

Validar una estrategia definida con históricos reales, costos, períodos fuera de muestra y robustez. Después conectar OANDA practice y desarrollar ejecución, conciliación y recuperación. El motor actual no puede enviar órdenes a un bróker ni habilita dinero real. La arquitectura para ejecución real continua se decidirá durante esa etapa.
