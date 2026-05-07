# legalfit — Producto modular de readiness regulatorio

## 1. Descripción del producto

legalfit es una plataforma conversacional de **readiness regulatorio** para startups y empresas tech.

El producto recopila información de la empresa vía WhatsApp, texto, voz o web, estructura esos datos y calcula qué tan preparada está para iniciar una revisión profesional sobre beneficios/regímenes como:

- Economía del Conocimiento
- Zonas Francas
- Exportación de Servicios
- MiPyME
- Tax Readiness (post-mvp)
- Cross-border / FX Readiness (post-mvp)

legalfit **no brinda asesoramiento legal, fiscal ni contable**.  
Su función es precalificar, ordenar información, detectar gaps y generar reportes para que especialistas continúen el proceso profesional.

---

## 2. Visión del producto

Convertir procesos regulatorios complejos en un sistema simple de diagnóstico previo.

La visión es que una startup pueda decir:

> “Quiero saber qué tan lista está mi empresa para acceder a beneficios o avanzar con Andén.”

Y en minutos reciba:

- score de preparación
- requisitos cumplidos
- requisitos pendientes
- checklist documental
- estimación orientativa de beneficios
- reporte exportable
- derivación a partner especializado

El valor no está en asesorar, sino en **preparar mejor a la empresa antes de la asesoría**.

---

## 3. Principio de producto

legalfit no decide.

legalfit muestra:

- qué información tiene la empresa
- qué información falta
- qué requisitos públicos parecen relevantes
- qué documentación debería preparar
- qué temas requieren revisión profesional


---

# 4. ICP por módulo

## 4.1 Economía del Conocimiento Module

### ICP

Startups y empresas tech argentinas que:

- desarrollan software
- venden SaaS
- prestan servicios digitales
- exportan servicios
- tienen empleados o equipo técnico
- facturan de forma recurrente
- quieren entender si están listas para revisar beneficios

### Buyer

- founder
- CFO
- COO


### Dolor

No saben si cumplen requisitos, qué documentación necesitan ni si vale la pena iniciar el proceso profesional.

---

## 4.2 Zonas Francas Module

### ICP

Empresas más sofisticadas que:

- exportan servicios o bienes
- operan cross-border
- evalúan radicación en una zona específica
- tienen volumen relevante
- quieren explorar una estructura operativa con Andén

### Buyer

- founder
- CFO
- head of operations
- Andén
- operadores de zonas francas

### Dolor

No saben si una zona franca es aplicable a su operación ni qué información debería analizar un especialista.

---

## 4.3 Exportación de Servicios Module

### ICP

Empresas que:

- venden software, servicios digitales o consultoría al exterior
- cobran en moneda extranjera
- tienen clientes en EEUU, Europa o LATAM
- emiten facturas de exportación
- quieren ordenar su operatoria exportadora

### Buyer

- founder
- CFO
- contador externo
- Andén

### Dolor

Tienen ingresos internacionales pero documentación, facturación y cobros poco ordenados.

---

## 4.4 MiPyME Module

### ICP

Empresas argentinas que:

- podrían aplicar a beneficios MiPyME
- necesitan ordenar su estado fiscal/documental
- quieren usar MiPyME como habilitante para otros regímenes

### Buyer

- founder
- administración
- contador
- Andén

### Dolor

No saben si tienen Certificado MiPyME vigente ni si es un bloqueo para acceder a otros beneficios.

---

## 4.5 Tax Readiness Module

### ICP

Startups en crecimiento que:

- tienen facturación local y exportada
- operan en varias provincias
- no tienen información fiscal ordenada
- quieren prepararse para revisión profesional

### Buyer

- CFO
- founder
- estudio contable
- Andén

### Dolor

La información fiscal está dispersa y no está lista para evaluación.

---

## 4.6 Cross-border / FX Readiness Module

### ICP

Empresas que:

- tienen clientes internacionales
- cobran afuera
- usan fintechs, bancos o procesadores internacionales
- tienen estructuras o clientes en distintas jurisdicciones

### Buyer

- founder
- CFO
- legal/ops
- Andén

### Dolor

No saben qué partes de su operación internacional requieren revisión profesional.

---

# 5. Verticales a tener

## MVP

1. Economía del Conocimiento
2. Exportación de Servicios
3. MiPyME
4. Zonas francas

Motivo:

- mayor volumen
- más claro para startups
- menor complejidad
- encaja con empresas tech argentinas

---

## V2

5. Tax Readiness
6. Cross-border / FX Readiness

Motivo:

- mayor complejidad
- requiere más controles
- mejor como upsell o análisis avanzado

---

# 6. Arquitectura del sistema

## Arquitectura conceptual

```txt
Canales
  ├── WhatsApp
  ├── Telegram
  ├── Web chat
  ├── Voz
  └── Admin dashboard

        ↓

Conversation Layer
  ├── Agente conversacional
  ├── Transcripción de voz
  ├── Extracción estructurada
  └── Confirmación con usuario

        ↓

Company Profile
  ├── Datos societarios
  ├── Actividad
  ├── Facturación
  ├── Exportaciones
  ├── Empleados
  ├── Documentación
  └── Estado operativo

        ↓

Rules Engine
  ├── Economía del Conocimiento
  ├── MiPyME
  ├── Exportación de Servicios
  ├── Zonas Francas
  ├── Tax Readiness
  └── Cross-border / FX

        ↓

Outputs
  ├── Readiness Score
  ├── Requirements Gap
  ├── Evidence Checklist
  ├── Benefit Estimate
  ├── PDF Report
  └── Handoff a Andén / partners