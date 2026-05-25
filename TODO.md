# TODO — Académie 2

## reader.html
- [x] Estructura HTML base (dark theme, fonts, navbar minimalista)
- [x] Parsear Markdown hardcodeado → array de frases con índices
- [x] Leer `acad2_config.wordsPerDay` del localStorage (default 300)
- [x] Leer posición guardada `acad2_reader_progress.blockIdx`
- [x] Mostrar últimas ~8 frases de la sesión anterior (estilo atenuado, no cuentan en el total)
- [x] Cargar frases del día hasta alcanzar el mínimo de palabras, parando al final de una frase
- [x] Barra de progreso del libro (% completado)
- [x] Botón "Terminar lectura" → guarda posición, guarda stats, redirige a translation.html
- [x] Botón "Continuar leyendo" → carga 20 frases más
- [x] Input vocabulario (fr + es) → guarda en `acad_user_vocab`
- [x] Cronómetro de lectura: start al cargar, stop al terminar → calcular wpm
- [x] Guardar stats de lectura en `acad2_stats` (sesión del día)

## translation.html
- [x] Estructura HTML base (mismos colores que v1)
- [x] Copiar lógica completa de `startTranslationChallenge()` de v1
- [x] Copiar sistema de claves Gemini con rotación (callGeminiAPI, rotateKey, etc.)
- [x] Copiar lógica de `speakFrench()` (SpeechSynthesis, voz fr-FR)
- [x] Añadir cronómetro por frase: start al mostrar la frase, stop al revelar
- [x] Acumular `translationTimes[]` durante la sesión
- [x] Guardar stats de traducción en `acad2_stats` al terminar
- [x] Marcar el día como completado en `acad2_days`
- [x] Pantalla de resumen al final (nº frases, tiempo medio)
- [x] Botón "Retour à l'accueil" → redirige a index.html

## index.html
- [x] Estructura HTML base + navbar (mismos colores que v1, streak counter)
- [x] Timeline horizontal scrollable con un botón por día
- [x] Lógica de estados de checkpoints (completado / hoy / futuro / manqué)
- [x] Scroll automático al checkpoint del día actual
- [x] Clic en checkpoint activo → redirige a reader.html
- [x] Widget: total de prácticas completadas
- [x] Widget: racha de días (streak actual)
- [x] Widget: tiempo total de lectura (minutos)
- [x] Widget: total de frases traducidas
- [x] Chart vitesse de lecture (Chart.js, mots/min por sesión)
- [x] Chart vitesse de traduction (Chart.js, seg/frase por sesión)
- [x] Modal de configuración (botón en navbar)
- [x] Config — Export vocabulario JSON (`acad_user_vocab`)
- [x] Config — Import vocabulario JSON (file input + merge)
- [x] Config — Gestión claves Gemini (listar, añadir, eliminar)
- [x] Config — Input `wordsPerDay` → guarda en `acad2_config`
- [x] Config — Input `sentencesPerSession` → guarda en `acad2_config`

## academie/index.html (v1)
- [x] Añadir botón "Exporter vocabulaire JSON" en la modal de claves API

---

## Pendiente / mejoras futuras
- [ ] Manejar el caso donde el usuario vuelve al reader el mismo día (no recargar el contenido ya leído)
- [ ] Añadir importación de vocabulario también en v1
- [ ] Reemplazar el libro placeholder en reader.html con el contenido real
- [ ] Test cross-browser del SpeechSynthesis en translation.html
