import { useEffect, useMemo } from 'react';

/**
 * Convert a hex color to HSL components.
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Compute relative luminance of a hex color per WCAG 2.0.
 */
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Choose black or white foreground for best contrast against a background hex.
 */
function contrastForeground(bgHex: string): string {
  const lum = relativeLuminance(bgHex);
  // WCAG contrast ratio: (L1 + 0.05) / (L2 + 0.05)
  const contrastWhite = (1 + 0.05) / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / (0 + 0.05);
  return contrastWhite >= contrastBlack ? '#ffffff' : '#000000';
}

/**
 * Return a dimmed foreground for labels on the given background.
 * Uses the same black/white direction but with reduced opacity via alpha.
 */
function contrastForegroundDimmed(bgHex: string): string {
  const fg = contrastForeground(bgHex);
  return fg === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)';
}

/**
 * Generate a palette of shades from a base hex color.
 * Maps roughly to Tailwind's 50–900 scale.
 */
function generatePalette(hex: string) {
  const { h, s } = hexToHSL(hex);
  return {
    50: hslToHex(h, Math.min(s + 10, 100), 96),
    100: hslToHex(h, Math.min(s + 5, 100), 90),
    200: hslToHex(h, s, 80),
    300: hslToHex(h, s, 68),
    400: hslToHex(h, Math.max(s - 5, 0), 56),
    500: hslToHex(h, s, 46),
    600: hex,
    700: hslToHex(h, Math.min(s + 5, 100), 35),
    800: hslToHex(h, Math.min(s + 5, 100), 28),
    900: hslToHex(h, Math.min(s + 5, 100), 22),
  };
}

/**
 * Injects CSS custom properties for the accent color palette onto <html>.
 * Sets --accent-50 through --accent-900 plus contrast-aware foreground vars.
 */
export function useAccentColor(hex: string | null) {
  const palette = useMemo(() => (hex ? generatePalette(hex) : null), [hex]);

  useEffect(() => {
    if (!palette || !hex) return;
    const root = document.documentElement;
    for (const [shade, color] of Object.entries(palette)) {
      root.style.setProperty(`--accent-${shade}`, color);
    }
    // Contrast-aware foreground colors for text on accent backgrounds
    for (const shade of [600, 700, 900] as const) {
      const bg = palette[shade];
      root.style.setProperty(`--accent-fg-${shade}`, contrastForeground(bg));
      root.style.setProperty(`--accent-fg-${shade}-dimmed`, contrastForegroundDimmed(bg));
    }
  }, [palette, hex]);

  return palette;
}
