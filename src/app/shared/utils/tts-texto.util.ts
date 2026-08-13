// Utilidad compartida por TODOS los juegos con voz (Text-to-Speech / Web Speech API).
//
// Antes cada juego tenía su propia copia de `sinEmojis()` (o, en 4 de los 12
// juegos, ninguna copia en absoluto), lo que causaba que algunas mascotas
// leyeran los emojis en voz alta en vez de omitirlos (ej. "👍" pronunciado
// como "pulgar hacia arriba" por ciertas voces del sistema). Centralizar la
// función aquí evita que el arreglo se desincronice juego por juego otra vez.
//
// Rangos cubiertos (más amplios que el original [\u{1F300}-\u{1FFFF}], que
// dejaba pasar íconos muy comunes en los mensajes de las mascotas como
// ⭐ ✨ ✅ ❌ ⚠ ☁ ➗ ✦ ✧ ❖ ★ ☆ ❓):
//   - \u{1F1E6}-\u{1FAFF}  banderas + bloques principales de emoji modernos
//   - \u{2190}-\u{21FF}    flechas (→ ←) usadas como viñetas decorativas
//   - \u{2600}-\u{27BF}    símbolos varios y dingbats (☀ ✅ ❌ ✨ ➗ …)
//   - \u{2B00}-\u{2BFF}    símbolos varios y flechas (⭐ ★ …)
//   - \u{FE0F}             selector de variante (emoji vs. texto)
//   - \u{200D}             zero-width joiner (emojis compuestos)
const EMOJI_REGEX =
  /[\u{1F1E6}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

/**
 * Quita emojis y símbolos decorativos de un texto antes de mandarlo al
 * sintetizador de voz, para que la mascota no los pronuncie/describa.
 * Colapsa los espacios dobles que puede dejar un emoji a mitad de frase.
 */
export function sinEmojis(texto: string): string {
  if (!texto) return texto;
  return texto.replace(EMOJI_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}
