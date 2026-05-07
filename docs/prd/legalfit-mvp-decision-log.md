# Decision Log: legalfit MVP Anden-first

Fecha: 2026-05-07  
Documento relacionado: `docs/prd/legalfit-mvp-anden-zonas-francas.md`

Este log consolida las preguntas realizadas durante el grilling de `PROJECT.md`, las respuestas dadas por el usuario y las decisiones adoptadas. Las preguntas finales fueron cerradas en batch: para cada una se adopta la recomendacion indicada, salvo que se marque como pendiente de validacion de Anden.

## Decisiones Interactivas

1. Pregunta: quien paga y controla el workflow del MVP.  
   Respuesta: hibrido desde el dia uno.  
   Decision: superficie hibrida, pero workflow primario orientado a partner.

2. Pregunta: cual es la conversion primaria del MVP.  
   Respuesta: partner workflow.  
   Decision: Anden/partner invita o recibe empresas y usa legalfit como intake interno.

3. Pregunta: que partner priorizar primero.  
   Respuesta: Anden-first.  
   Decision: Anden es partner ancla del MVP.

4. Pregunta: primer modulo punta a punta.  
   Respuesta: Zonas Francas primero.  
   Decision: MVP enfocado en Zonas Francas para leads Anden.

5. Pregunta: resultado principal para Anden.  
   Respuesta: lead dossier para Anden.  
   Decision: el dossier operativo es el output principal; score/checklist son campos dentro del dossier.

6. Pregunta: decision operativa que debe permitir el dossier.  
   Respuesta: todas, con una decision principal explicita.  
   Decision: el dossier soporta priorizacion, aptitud preliminar y preparacion tecnica, pero routea por una decision principal.

7. Pregunta: etiqueta principal para operar el lead.  
   Respuesta: `next_action` y `fit_status`.  
   Decision: `next_action` manda; `fit_status` explica.

8. Pregunta: significado de `fit_status`.  
   Respuesta: fit compuesto.  
   Decision: fit comercial-operativo, documental, operacional y de riesgo, no aptitud legal.

9. Pregunta: dimensiones minimas de fit.  
   Respuesta: si.  
   Decision: `operational_fit`, `commercial_fit`, `documentation_readiness`, `risk_review_needed`.

10. Pregunta: como expresar cada dimension.  
    Respuesta: semaforo + explicacion estructurada.  
    Decision: nivel, razon, evidencias y faltantes.

11. Pregunta: valores permitidos del semaforo.  
    Respuesta: `high / medium / low / unknown`.  
    Decision: incluir `unknown` para no fingir precision.

12. Pregunta: que hacer con dimensiones `unknown`.  
    Respuesta: bloquear solo datos criticos.  
    Decision: `unknown` bloquea routing solo si falta dato critico.

13. Pregunta: datos criticos minimos.  
    Respuesta: si al set propuesto.  
    Decision: empresa/contacto, actividad, exportacion, tipo, rango, paises, cobro/facturacion, equipo, motivo y consentimiento.

14. Pregunta: evidencia/documentos en MVP.  
    Respuesta: solo checklist.  
    Decision: no carga documental; se genera checklist.

15. Pregunta: como medir `documentation_readiness`.  
    Respuesta: disponibilidad declarada.  
    Decision: se pregunta si la evidencia existe, sin verificar.

16. Pregunta: quien completa disponibilidad documental.  
    Respuesta: mixto.  
    Decision: empresa declara; Anden puede validar despues.

17. Pregunta: estados documentales.  
    Respuesta: si.  
    Decision: `declared_available`, `declared_unavailable`, `declared_unknown`, `not_applicable`, `verified_available`, `verified_missing`, `verification_needed`.

18. Pregunta: canal principal del MVP.  
    Respuesta: Telegram primero.  
    Decision: Telegram-first.

19. Pregunta: experiencia Telegram.  
    Respuesta: aceptar flujo mixto.  
    Decision: conversacion libre al inicio, preguntas guiadas para criticos y resumen/checklist confirmable.

20. Pregunta: incluir voz/audio.  
    Respuesta: si, desde MVP.  
    Decision: voz como input abierto transcripto.

21. Pregunta: tono del bot.  
    Respuesta: founder-friendly.  
    Decision: claro, rapido, cercano y sin jerga.

22. Pregunta: momento del disclaimer.  
    Respuesta: inicio corto + cierre explicito.  
    Decision: disclaimer liviano al inicio y explicito antes de reporte/handoff.

23. Pregunta: consentimientos obligatorios.  
    Respuesta: si.  
    Decision: procesar respuestas, compartir dossier con Anden y permitir contacto de Anden.

24. Pregunta: si no acepta compartir con Anden.  
    Respuesta: entregar resumen basico sin compartir.  
    Decision: no se crea lead activo.

25. Pregunta: como recibe Anden el dossier.  
    Respuesta: dashboard + notificaciones.  
    Decision: dashboard como fuente de verdad.

26. Pregunta: dashboard liviano.  
    Respuesta: si.  
    Decision: Lead Inbox + notificaciones, no CRM completo.

27. Pregunta: edicion del dossier por Anden.  
    Respuesta: solo notas/estado.  
    Decision: dossier original inmutable.

28. Pregunta: que ve usuario vs Anden.  
    Respuesta: si a resumen/checklist para usuario y dossier completo para Anden.  
    Decision: fit/routing quedan internos.

29. Pregunta: reglas explicitas vs LLM.  
    Respuesta: hibrido progresivo.  
    Decision: reglas para decisiones criticas; LLM para extraccion, normalizacion y redaccion.

30. Pregunta: trazabilidad MVP.  
    Respuesta: minima.  
    Decision: guardar inputs y output final; se agrega version de rulebook para reproducibilidad.

31. Pregunta: dato de facturacion/exportacion.  
    Respuesta: rangos amplios.  
    Decision: no pedir montos exactos.

32. Pregunta: moneda de rangos.  
    Respuesta: USD exportacion + ARS local opcional.  
    Decision: USD para exportacion, ARS solo como contexto local.

33. Pregunta: horizonte temporal.  
    Respuesta: ultimos 12 meses.  
    Decision: rangos medidos sobre ultimos 12 meses.

34. Pregunta: empresas sin exportaciones actuales.  
    Respuesta: separar current/future.  
    Decision: `current_exporter` y `future_exporter`.

35. Pregunta: criterio para `future_exporter`.  
    Respuesta: si.  
    Decision: separar `future_exporter` de `exploratory` con senales concretas.

36. Pregunta: tipos de exportacion cubiertos.  
    Respuesta: servicios/software primero; bienes capturables inicialmente.  
    Decision: foco real en servicios/software.

37. Pregunta: que hacer con bienes en MVP.  
    Respuesta: excluir bienes del flujo MVP.  
    Decision: goods-only no tiene readiness.

38. Pregunta: goods-only que entra al bot.  
    Respuesta: captura minima opcional.  
    Decision: contacto + descripcion + consentimiento, sin dossier de fit.

39. Pregunta: otros modulos del MVP.  
    Respuesta: senales dentro del dossier.  
    Decision: Zonas Francas es modulo real; Exportacion, MiPyME y Economia del Conocimiento son senales.

40. Pregunta: senales livianas de MiPyME y Economia del Conocimiento.  
    Respuesta: si.  
    Decision: preguntar certificado MiPyME y estado/interes en Economia del Conocimiento.

41. Pregunta: senales obligatorias de Exportacion de Servicios.  
    Respuesta: si.  
    Decision: facturacion, cobro, clientes/paises y recurrencia.

42. Pregunta: valores de `next_action`.  
    Respuesta: si.  
    Decision: `request_missing_info`, `schedule_discovery`, `specialist_review`, `high_priority_case`, `not_now`, `out_of_scope`.

43. Pregunta: disparador de `high_priority_case`.  
    Respuesta: si.  
    Decision: categoria conservadora para casos fuertes con exportacion recurrente, volumen alto, urgencia, documentacion razonable y consentimiento.

44. Pregunta: disparador de `specialist_review`.  
    Respuesta: aceptada.  
    Decision: complejidad, riesgo, inconsistencias o estructura cross-border poco clara.

45. Pregunta: disparador de `not_now`.  
    Respuesta: si.  
    Decision: senal insuficiente hoy, pero no necesariamente fuera de alcance.

46. Pregunta: disparador de `out_of_scope`.  
    Respuesta: si.  
    Decision: goods-only, no Argentina, persona sin empresa, advice request directo o vertical no cubierta.

47. Pregunta: agregacion de fit global.  
    Respuesta: si.  
    Decision: `overall_fit` por reglas conservadoras, sin promedio numerico.

48. Pregunta: datos personales MVP.  
    Respuesta: si.  
    Decision: minimo necesario; sin DNI ni documentos personales.

49. Pregunta: retencion.  
    Respuesta: 180 dias.  
    Decision: leads/dossiers por 180 dias con eliminacion manual.

50. Pregunta: metrica primaria.  
    Respuesta: leads accionables para Anden.  
    Decision: exito ligado a calidad operativa, no conversaciones iniciadas.

51. Pregunta: definicion de lead accionable.  
    Respuesta: si.  
    Decision: consentimiento completo, datos criticos, scope permitido, dossier en inbox, contacto valido y `next_action` accionable.

52. Pregunta: metricas secundarias.  
    Respuesta: completion rate y tiempo hasta dossier.  
    Decision: medir simplicidad con completion y tiempo.

53. Pregunta: flujo conversacional minimo.  
    Respuesta: si.  
    Decision: bienvenida, descripcion, extraccion, repreguntas, senales, checklist, confirmacion, consentimientos, dossier y notificacion.

54. Pregunta: correccion antes del handoff.  
    Respuesta: si.  
    Decision: campos clave corregibles.

55. Pregunta: campos corregibles.  
    Respuesta: si.  
    Decision: empresa/contacto, actividad, exportacion, rango, paises, facturacion/cobro, equipo, motivo, documentacion y consentimientos.

56. Pregunta: autenticacion usuario final.  
    Respuesta: Telegram + email declarado sin verificacion.  
    Decision: sin cuenta/password ni email verification en MVP.

57. Pregunta: autenticacion Anden.  
    Respuesta: magic link/email OTP.  
    Decision: Anden accede por OTP/magic link.

58. Pregunta: roles internos.  
    Respuesta: un solo rol operator.  
    Decision: sin roles finos en MVP.

59A. Pregunta: stack tecnico.  
    Respuesta: decision diferida para discutir contraste normativo.  
    Decision: stack se cerro luego en Q66.

59B. Pregunta: quien valida el rulebook normativo.  
    Respuesta: Anden valida.  
    Decision: Anden valida rulebook v0.1 antes de produccion.

60. Pregunta: actualizacion del rulebook.  
    Respuesta: manual versionado.  
    Decision: cambios por control manual y aprobacion de Anden.

61. Pregunta: estructura de cada regla.  
    Respuesta: si.  
    Decision: `id`, `version`, `module`, `condition`, `effect`, `severity`, fuentes, explicacion interna, copy usuario y flag de review.

62. Pregunta: donde mostrar fuentes.  
    Respuesta: usuario general, Anden por regla.  
    Decision: fuentes detalladas internas; usuario ve referencias generales.

63. Pregunta: contradicciones.  
    Respuesta: si.  
    Decision: marcar `inconsistency_detected`; repreguntar si bloquea o derivar.

64. Pregunta: fuera de scope del MVP.  
    Respuesta: si.  
    Decision: excluir asesoramiento, elegibilidad, documentos, goods readiness, modulos completos, CRM, integraciones, pagos, white-label, scoring numerico y LLM-only decisions.

65. Pregunta: actualizar `PROJECT.md` o crear PRD separado.  
    Respuesta: crear PRD separado.  
    Decision: `PROJECT.md` queda vision original; PRD nuevo documenta MVP.

66. Pregunta: aceptar stack.  
    Respuesta: si.  
    Decision: Next.js + Supabase/Postgres + Telegram Bot API + OpenAI.

67. Pregunta: donde corre el bot Telegram.  
    Respuesta: Next.js webhook/serverless.  
    Decision: webhook/API route en Next.js para MVP.

68. Pregunta: tareas lentas.  
    Respuesta: jobs en Postgres/Supabase.  
    Decision: cola simple en DB para transcripcion, extraccion, dossier y notificaciones.

69. Pregunta: cerrar grilling o seguir modelo de datos.  
    Respuesta: seguir modelo de datos.  
    Decision: continuar con schema conceptual.

70. Pregunta: entidad central.  
    Respuesta: `lead_case`.  
    Decision: `lead_case` es agregado principal.

71. Pregunta: como guardar `company_profile`.  
    Respuesta: modelo hibrido.  
    Decision: columnas operativas + JSONB flexible.

72. Pregunta: borrador mutable vs dossier.  
    Respuesta: borrador mutable + perfil confirmado + dossier inmutable.  
    Decision: separar extraccion tentativa, perfil confirmado y snapshot final.

73. Pregunta: guardar mensajes crudos.  
    Respuesta: si a mensajes minimos + transcript.  
    Decision: guardar texto, tipo, timestamp y transcripcion durante retencion; no conservar audio tras transcribir.

74. Pregunta: tablas minimas.  
    Respuesta: si.  
    Decision: `lead_cases`, `intake_sessions`, `intake_messages`, `company_profiles`, `dossiers`, `rulebook_versions`, `rule_results`, `anden_operators`, `lead_notes`, `jobs`.

75. Pregunta: reglas en DB o codigo/config.  
    Respuesta: si a codigo/config versionado.  
    Decision: reglas en codigo/config; metadata/resultados en DB.

76. Pregunta: detalle de `rule_results`.  
    Respuesta: si.  
    Decision: una fila por regla aplicada o relevante con evidencia, efecto, severidad y fuente.

77. Pregunta: estados de jobs.  
    Respuesta: si.  
    Decision: `queued`, `processing`, `succeeded`, `failed`, `retrying`, `dead`.

78. Pregunta: estados internos de `lead_case`.  
    Respuesta: si.  
    Decision: separar lifecycle de commercial_state.

79. Pregunta: abandono de intakes incompletos.  
    Respuesta: si a 14 dias.  
    Decision: expiran a los 14 dias sin actividad.

80. Pregunta: duplicados.  
    Respuesta: permitir y marcar posible duplicado.  
    Decision: no bloquear ni fusionar automaticamente.

81. Pregunta: tabla `companies`.  
    Respuesta: no.  
    Decision: no hay master `companies` en MVP.

82. Pregunta: autorizacion operadores Anden.  
    Respuesta: allowlist en `anden_operators`.  
    Decision: Supabase Auth + allowlist activa.

83. Pregunta: masking interno.  
    Respuesta: no masking para operadores autorizados.  
    Decision: sin field-level masking en MVP.

84. Pregunta: agregar esquema conceptual.  
    Respuesta: si.  
    Decision: PRD incluye schema conceptual.

85. Pregunta: seguridad Supabase.  
    Respuesta: RLS en tablas sensibles + allowlist + service role server-side.  
    Decision: RLS desde MVP.

86. Pregunta: cerrar modelo de datos.  
    Respuesta: si.  
    Decision: modelo de datos cerrado para PRD.

87. Pregunta: consentimiento de procesamiento.  
    Respuesta: consentimiento corto al inicio y handoff/contacto al final.  
    Decision: dos momentos de consentimiento.

88. Pregunta: arranque de captura del caso.  
    Respuesta: pregunta abierta unica.  
    Decision: no empezar con formulario.

89. Pregunta: que extraer de primera respuesta.  
    Respuesta: si.  
    Decision: actividad, servicios/bienes, exportacion, futuro, paises/clientes, facturacion/cobro, motivo, urgencia, riesgos y contacto voluntario.

90. Pregunta: repreguntas faltantes.  
    Respuesta: si.  
    Decision: maximo 3 preguntas por bloque.

91. Pregunta: rangos USD.  
    Respuesta: si.  
    Decision: usar rangos `No exportamos aun`, `< USD 10k`, `USD 10k - 50k`, `USD 50k - 250k`, `USD 250k - 1M`, `USD 1M+`, `Prefiero no responder`.

92. Pregunta: opciones de facturacion/cobro.  
    Respuesta: si.  
    Decision: separar billing y collection con opciones estructuradas.

93. Pregunta: momento de pedir contacto.  
    Respuesta: despues de descartar out-of-scope claro y antes del resumen final.  
    Decision: no pedir contacto al inicio ni despues del consentimiento final.

## Decisiones Cerradas En Batch

94. Pregunta: que datos de contacto son obligatorios para handoff.  
    Recomendacion: nombre, rol, empresa y email obligatorios; telefono, CUIT y sitio web opcionales.  
    Decision adoptada: aceptada. Telegram user id se guarda tecnicamente, no se pide.

95. Pregunta: idioma del MVP.  
    Recomendacion: Espanol primero.  
    Decision adoptada: MVP en espanol; ingles diferido.

96. Pregunta: como debe funcionar el resumen de confirmacion.  
    Recomendacion: resumen por secciones con controles para editar campos clave.  
    Decision adoptada: confirmacion seccionada antes de handoff.

97. Pregunta: que hacer con casos claramente out-of-scope.  
    Recomendacion: no completar intake entero; explicar scope y ofrecer captura minima si aporta valor.  
    Decision adoptada: flujo out-of-scope liviano.

98. Pregunta: que pasa si el usuario envia documentos o archivos.  
    Recomendacion: rechazar carga documental con explicacion corta y pedir solo disponibilidad declarada.  
    Decision adoptada: sin document uploads en MVP.

99. Pregunta: checklist documental minimo.  
    Recomendacion: invoices/export invoices, revenue summary, contratos/SOW, records de cobro, estructura/equipo, MiPyME si existe, Economia del Conocimiento si existe.  
    Decision adoptada: checklist declarativo con esos items.

100. Pregunta: opciones para cada item documental.  
     Recomendacion: `Lo tengo`, `No lo tengo`, `No se`, `No aplica`.  
     Decision adoptada: esas opciones mapean a estados declarados.

101. Pregunta: como capturar paises/clientes.  
     Recomendacion: free text normalizado a paises/regiones; no exigir nombres de clientes.  
     Decision adoptada: nombres de clientes solo si el usuario los ofrece.

102. Pregunta: como capturar motivo de consulta.  
     Recomendacion: extraer texto libre y ofrecer opciones estructuradas.  
     Decision adoptada: opciones `Evaluar zona franca`, `Ordenar exportaciones`, `Revisar estructura cross-border`, `Conversar con Anden`, `Preparar documentacion`, `No estoy seguro`.

103. Pregunta: como mostrar consentimiento final.  
     Recomendacion: botones separados para compartir dossier con Anden y permitir contacto.  
     Decision adoptada: consentimiento final separado; sin consentimiento no hay lead activo.

104. Pregunta: contenido del resumen para usuario.  
     Recomendacion: recap de datos declarados, faltantes y checklist, sin `fit_status` ni `next_action`.  
     Decision adoptada: usuario ve resumen/checklist, no routing interno.

105. Pregunta: canal de notificacion a Anden.  
     Recomendacion: email con link al Lead Inbox.  
     Decision adoptada: email MVP; dashboard sigue siendo fuente de verdad.

106. Pregunta: filtros y orden del Lead Inbox.  
     Recomendacion: newest first, filtros por `next_action`, `overall_fit`, estado, assignee y duplicado.  
     Decision adoptada: filtros minimos incluidos.

107. Pregunta: layout del detalle de lead.  
     Recomendacion: header operativo, fit, faltantes, perfil, documentacion, fuentes, transcript colapsable, notas.  
     Decision adoptada: layout detallado orientado a discovery.

108. Pregunta: transiciones de estado comercial.  
     Recomendacion: flexibles en MVP; cualquier operador activo puede mover estado.  
     Decision adoptada: sin workflow estricto.

109. Pregunta: audit trail de operaciones internas.  
     Recomendacion: diferir audit trail completo; usar timestamps, assignee y notas.  
     Decision adoptada: auditoria fina fuera de MVP.

110. Pregunta: fuente de metricas.  
     Recomendacion: calcular con tablas y timestamps propios.  
     Decision adoptada: sin analytics vendor inicial.

111. Pregunta: manejo de errores del bot.  
     Recomendacion: mensaje corto, retry de job y continuar con texto estructurado si falla.  
     Decision adoptada: errores no generan lead accionable.

112. Pregunta: politica de retries.  
     Recomendacion: 3 intentos para transcripcion, extraccion, dossier y retention; 5 para notificaciones.  
     Decision adoptada: jobs pasan a `dead` al agotar intentos.

113. Pregunta: idempotencia.  
     Recomendacion: webhook idempotente por Telegram update/message id; jobs idempotentes donde aplique.  
     Decision adoptada: requisito de implementacion.

114. Pregunta: deployment target.  
     Recomendacion: Vercel + Supabase.  
     Decision adoptada: Vercel para Next.js, Supabase para DB/Auth.

115. Pregunta: ambientes y secrets.  
     Recomendacion: proyectos Supabase separados para dev/prod; secrets en env vars.  
     Decision adoptada: no commitear secretos; staging formal diferido.

116. Pregunta: criterios de salida a piloto real.  
     Recomendacion: rulebook aprobado, RLS smoke-tested, bot E2E texto/voz, Lead Inbox operativo, notificaciones, consent checks.  
     Decision adoptada: launch criteria del PRD.

117. Pregunta: tamano del piloto inicial.  
     Recomendacion: 10-20 leads reales con revision humana de todos los dossiers.  
     Decision adoptada: piloto controlado.

118. Pregunta: tratamiento de `high_priority_case` durante piloto.  
     Recomendacion: prioridad operativa, nunca decision automatica final.  
     Decision adoptada: todos requieren review humana.

119. Pregunta: orden de implementacion.  
     Recomendacion: schema/RLS, domain modules, dossier, bot/jobs, LLM, inbox, notifications, retention, hardening.  
     Decision adoptada: secuencia recomendada en PRD.

120. Pregunta: que hacer si el email declarado es invalido.  
     Recomendacion: no bloquear automaticamente en MVP; Anden lo corrige o marca estado comercial.  
     Decision adoptada: email verification sigue diferido.

121. Pregunta: visibilidad del transcript para Anden.  
     Recomendacion: transcript colapsable, no protagonista.  
     Decision adoptada: el dossier estructurado manda; transcript sirve para contexto/debug.

122. Pregunta: Telegram Web App.  
     Recomendacion: diferir; usar bot y botones primero.  
     Decision adoptada: Web App solo si correccion/checklist en chat se vuelve incomodo.

123. Pregunta: integracion CRM.  
     Recomendacion: diferir.  
     Decision adoptada: Lead Inbox es fuente de verdad durante MVP.

## Decisiones Pendientes De Validacion Externa

- Anden debe validar el rulebook normativo `v0.1` antes de produccion.
- Anden debe confirmar el source pack especifico de zona franca que quiere priorizar.
- Anden debe aprobar textos finales de disclaimer, consentimiento y user-safe copy.
- Anden debe validar si el alcance geografico queda limitado a Argentina durante todo el MVP.

## Nota De Consistencia

Las decisiones finales reemplazan formulaciones mas amplias de `PROJECT.md` para el MVP, pero no eliminan la vision modular original. `PROJECT.md` queda como vision de producto y el PRD queda como especificacion de MVP enfocado.
