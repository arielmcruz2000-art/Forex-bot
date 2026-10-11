# Comparación y controles de riesgo — 11 octubre 2026

## Estado verificado en el repositorio

La solicitud describe la primera incorporación. El HEAD revisado fue `bdd2b6d`: ya contiene una compilación y ejecución registrada de la estrategia original en TradingView, más experimentos independientes. `validation.md` registra 58 cierres, P/L -84.94 USD y profit factor 0.766 en el período visible junio–octubre 2026. Son observaciones documentadas, no una nueva compilación efectuada en esta revisión. No se ha demostrado rentabilidad fuera de muestra. No se cambia Pine ni se atribuyen sus resultados anteriores al nuevo modelo Netlify.

## Reglas comparadas

| Regla | TradingView: baseline conservado | Netlify: modelo anterior → revisado |
| --- | --- | --- |
| Datos | EUR/USD estándar, M15, feed registrado, OHLC histórico | Serie senoidal determinista; ticks cada minuto o avance manual; nunca velas reales |
| Señal | Cruce SMA 5/20 confirmado al cierre | Mismo cálculo de cruce, sobre los últimos 21 ticks artificiales |
| Entrada | Orden al cierre de señal; fill por defecto en siguiente apertura | Fill inmediato al tick de señal; no cola de ejecución |
| Posiciones | Una, sin pyramiding ni reversión automática | Automático abre solo estando flat; helper admite dos dentro del presupuesto. API no expone entradas manuales |
| Salidas | Bracket desde fill, stop 20 pips, objetivo bruto 40; cierre solicitado al fin del test | Mismas distancias desde fill; salidas en siguiente tick observado y cierre manual; sin fin de test ni OHLC |
| Tamaño | Floor(equity × riesgo / (0.002 + 0.0001 + 2 × mintick)); USD y pointvalue=1 | Divisor 0.00205 → 0.00212. USD por unidad, nunca lotes; floor y límites adicionales |
| Spread/costes | Comisión proxy 0.00005/unidad/lado; slippage 1 tick en órdenes de mercado/stop; no deslizamiento de límite por defecto | Bid/ask fijo midpoint ±0.00005; ahora ±0.00001 adicional por fill, incluyendo objetivos; no comisión adicional duplicada |
| Margen | Modelo 50:1, reserva 5%, cap calculado al precio de señal | Sin cap → 50:1 con reserva 5%, margen de posiciones existentes y coste de entrada reservado |
| Riesgo por entrada | Default 1%, configurable 0.1–2%; máximo 2% con una posición | Igual rango; budget en equity actual; cantidad reducida si exposición o margen lo exigen |
| Riesgo agregado | Una posición, máximo nominal según input | Suma de porcentajes históricos → suma de reservas USD / equity actual, límite 2% al admitir entrada |
| Pérdida diaria | 4% del equity previo al cambio de día NY; latch hasta día siguiente, chequeo M15 | Umbral reversible → latch persistente hasta cambio de día NY; chequeo por tick/comando/entrada |
| Tras bloqueo/pausa | Continúan brackets; no liquidación automática por umbral | Continúan stops/objetivos; no liquidación automática por umbral |
| Reinicio diario | Nuevo baseline y desbloqueo, señales posteriores | Nuevo baseline; requiere activar de nuevo si el bloqueo pausó el motor |
| Resultados | Ledger histórico separado en tradingview; fechas reales y feed | Ledger generado en Blobs; fuente artificial y versión por posición/cierre/CSV |
| Integraciones | Alert messages locales de investigación; sin webhook | API privada de controles generados; no receptor TradingView, ejecución ni conexión OANDA |

Para un feed de cinco decimales, el buffer Pine y el Netlify nuevo coinciden en 0.00212 USD/unidad: 4,716 unidades para equity inicial de 1,000 y riesgo 1%. En feeds con otro mintick Pine cambia; Netlify fija un tick ilustrativo de 0.00001. Los costes se aproximan de forma distinta, no se pretende igualdad de fills. Netlify aplica slippage incluso al objetivo: decisión conservadora específica de su simulador por ticks.

## Inconsistencias corregidas

1. El divisor anterior reservaba solo medio pip. El nuevo reserva un pip de spread y dos ticks de deslizamiento, comparable con Pine de cinco decimales. Distancia de stop sigue medida desde entry; el buffer es conservador, no una factura adicional.
2. Los porcentajes de entrada dejan de describir exposición tras pérdidas o cambios de configuración. Cada posición mantiene reserva USD; nuevas entradas se comprueban frente al equity actual. El dimensionamiento también reserva el coste inmediato de entrada para no superar 2% justo después del fill. Dos entradas completas del 1% pueden no caber tras costes; no se permite exceder el límite para completar dos posiciones.
3. El bloqueo diario anterior podía desaparecer al recuperarse el equity y pulsar Start. Ahora queda guardado aunque el equity se recupere, se cambie configuración o se recargue el estado. Solo el cambio de fecha NY lo libera.
4. El simulador no limitaba margen. Ahora resta margen utilizado y reserva 5%, incluyendo el efecto del coste inmediato. No se añade un supuesto de liquidación forzosa: una caída posterior puede incumplir margen; ese escenario no sirve para validar un broker.
5. La interfaz inicial decía M15/cuenta demo y el CSV no identificaba modelo. Ahora muestra simulación artificial, riesgo actual calculado y columnas de fuente/modelo. Migración conserva balances, fills y profits anteriores; las posiciones antiguas mantienen su ejecución sin el nuevo slippage, identificadas como v1. No se recalculan beneficios históricos ni se presentan como resultados del modelo v2.

## Diferencias deliberadas y límites que pueden engañar

- La serie senoidal es predecible y carece de microestructura, tendencia de mercado y gaps reales. Ganancias en Netlify solo comprueban software; no justifican expectativas de ingresos ni ajustes de estrategia.
- Un minuto de tick no equivale a una vela M15. Un avance manual altera la relación entre ticks y reloj. Señales y duración de operaciones no son comparables.
- Pine llena en siguiente apertura y Netlify inmediatamente: cambiar Pine para igualar esa ejecución falsearía la evidencia histórica ya registrada. La paridad de señales requiere una futura fuente OHLC y un motor separado.
- Netlify revisa stops solo en observaciones discretas, ejecutando al precio observado; un salto puede perder más que el stop. Pine usa un emulador OHLC con hipótesis de recorrido; si stop y objetivo se tocan en la misma vela, inspeccionar con datos intrabar/Bar Magnifier cuando esté disponible.
- El 4% es un bloqueo de entradas, no una pérdida máxima garantizada: salidas pendientes, posiciones existentes, gaps y cadencia de cálculo pueden superarlo. El latch no fuerza liquidación.
- El 2% es una condición de admisión, no una garantía permanente tras caída de equity. No se reduce ni cierra una posición existente para ocultar una infracción posterior.
- Faltan spreads variables, financiación/swap, liquidez, parciales y reglas reales de margen. El modelo 50:1 es ilustrativo. Un objetivo bruto de 2:1 tiene ratio neto inferior después de costes.
- Pine calcula tamaño antes del fill: un gap posterior puede modificar equity/margen. No hay garantía de riesgo exacto en la apertura siguiente.
- El helper de Netlify soporta dos posiciones, pero el generador automático solo entra estando flat. El panel describe capacidad, no una estrategia que actualmente abra dos a la vez.
- El motor Python local antiguo es una alternativa heredada, no el backend del panel. Sus pruebas no certifican el contrato nuevo de Netlify; no usarlo como sustituto de validación histórica.

## Pruebas y siguiente validación

`npm test` cubre riesgos 0.1/0.5/1/1.5/2%, balances 1/100/1000/10000, ambas direcciones, redondeo de unidades, exposición posterior a costes, margen restrictivo, caída de equity, cambios de riesgo, latch persistente, reinicio NY, salidas con pausa, gaps que exceden reserva, migración y etiquetas, rechazo de comandos reales, autenticación, origen, deduplicación y concurrencia. Ninguna prueba Node/Python compila Pine ni demuestra rentabilidad.

Antes de integrar:

1. Cargar el baseline sin modificar en TradingView, verificar compilación nuevamente y registrar commit, feed, M15 estándar, rango realmente disponible, entradas y propiedades. Mantener capital 1000 USD, riesgo 1%, SMA 5/20, 20/40 pips, 0.00005/unidad/lado, 1 tick y margen 2%.
2. Registrar/exportar operaciones y reconciliar comisiones, P/L cerrado y posición abierta. Inspeccionar gaps, stops, fills y restricciones de margen. Confirmar el latch diario en barras NY y preservar stops al bloquear entradas.
3. Separar desarrollo de un período posterior intacto. Las variantes short/session/ATR/target60 existentes son experimentos de desarrollo; no sustituyen la validación independiente del baseline ni deben mezclarse entre sí.
4. Evaluar costes superiores, financiación, parámetros cercanos y datos intrabar. Registrar profit factor, esperanza neta, drawdown, cantidad de trades, exposición y resultados por dirección, incluyendo posiciones abiertas y todas las limitaciones.
5. Guardar cada backtest histórico en tradingview con feed, fechas, commit y propiedades. No importarlo en el ledger generated-paper ni mezclar su CSV con datos artificiales. Un futuro ledger market-paper necesita esquema/almacenamiento distintos y autenticación/deduplicación propias.
6. Mantener OANDA desconectado hasta completar estas verificaciones. No crear credenciales, órdenes, webhook o ruta de dinero real. El adaptador read-only existente no es importado por Netlify; este cambio no lo activa.

Referencias primarias: https://www.tradingview.com/pine-script-docs/concepts/strategies/ y https://www.tradingview.com/pine-script-docs/faq/strategies/. Evidencia interna: validation.md, audit.md y documentos de experimentos enlazados por README.md.
