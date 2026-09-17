# Auditorías · CooperApp

Acá viven las dos revisiones que se le corren al proyecto al cerrar un sprint, con
sus prompts reusables y los informes de cada corrida.

Estaban fuera del repositorio hasta el 17/09/2026, así que no le llegaban a nadie
más del grupo. Es el mismo problema que había tenido el archivo de usuarios de
prueba: el que servía estaba afuera y el que llegaba estaba atrasado.

## Qué hay

| Archivo | Qué es |
|---|---|
| `prompt-testeo-QA.md` | Prompt para auditar **lo que falla**. Se corre al cerrar cada sprint |
| `prompt-auditoria-UX.md` | Prompt para revisar **lo que confunde**. Cada dos o tres sprints |
| `informes-QA/` | Un informe por corrida, con el resultado de las correcciones al final |
| `informes-UX/` | Lo mismo para las de experiencia de uso |

## Las dos reglas que hacen que esto sirva

**1. Cada auditoría va en un chat nuevo, no en el que se programó.** Quien escribió
el código arrastra sus propias suposiciones, incluidas las equivocadas. La gracia es
que alguien mire con ojos frescos lo que el otro dio por bueno.

**2. El que audita no arregla.** Reporta, y la corrección vuelve al chat de
desarrollo. Si arregla sobre la marcha se mezclan los cambios y se pierde el registro
de qué falló y por qué.

**Son dos revisiones distintas y no se mezclan.** QA busca lo que **falla**; UX busca
lo que **funciona pero confunde**. Un botón que hace exactamente lo que promete puede
ser un problema de UX si nadie entiende para qué está ahí. Si se mezclan, cada una
hace mal la mitad de la otra.

## Cómo se corre

Cada prompt tiene sus instrucciones adentro, arriba de todo. En resumen: se abre un
chat nuevo parado en la carpeta `pp2` y se pega el prompt entero.

**Los dos prompts hay que mantenerlos.** Cada módulo nuevo se agrega a su sección de
qué probar, y cada hallazgo que se manda al backlog se agrega a la lista de lo que ya
está decidido. Si no, la corrida siguiente prueba a fondo lo viejo, pasa por arriba lo
recién escrito —que es lo que menos ojos tuvo— y vuelve a reportar lo que ya se
discutió. Eso pasó una vez, entre el Sprint 06 y el 08, y se notó.

## Lo que enseñaron las corridas que ya se hicieron

- **Sprint 06 (QA)**: el hallazgo más grave fue un XSS que se había corregido en dos
  pantallas y quedó vivo en otras dos. Se arregló donde se lo vio y no donde estaba el
  patrón. Por eso el prompt de QA ahora **arranca por una regresión** que busca el
  mismo error en las pantallas que se sumaron después.
- **Sprints 07 y 08 (QA)**: los dos hallazgos críticos aparecieron recién al mandar
  **dos pedidos al mismo tiempo**. Todo lo que se prueba de a un pedido por vez andaba
  bien. El prompt tiene su propia sección para eso.
- **Sprint 08 (UX)**: tres de las correcciones estaban planificadas para el último
  sprint y arreglaban justo lo que el módulo siguiente iba a copiar. Se adelantaron.
  **Lo que se va a duplicar se arregla antes de duplicarlo.**

## Lo que esto NO reemplaza

Sentar a una persona de una empresa real adelante de la app y mirarla sin ayudarla.
Un chat puede marcar candidatos y detectar incoherencias; no puede decir qué entiende
alguien que nunca vio el sistema.
