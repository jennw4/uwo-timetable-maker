/** Deterministic, pleasant pastel color per course code (stable across reloads). */
export function courseColor(code: string): { bg: string; border: string } {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue} 70% 88%)`,
    border: `hsl(${hue} 55% 60%)`,
  };
}
