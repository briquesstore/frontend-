/**
 * Préréglages de dégradé des bannières promo affichées dans le carrousel de
 * l'app mobile.
 *
 * ⚠️ Les couleurs doivent rester synchronisées avec la palette Flutter
 * (`flutter/lib/features/home/presentation/widgets/promo_carousel.dart`) :
 * seule la clé est stockée en base, le rendu final est fait par l'app.
 */
export const BANNER_THEMES = [
  { key: 'ORANGE', label: 'Orange', from: '#FF9800', to: '#FF6D00' },
  { key: 'BLUE', label: 'Bleu', from: '#42A5F5', to: '#1565C0' },
  { key: 'GREEN', label: 'Vert', from: '#66BB6A', to: '#2E7D32' },
  { key: 'PURPLE', label: 'Violet', from: '#7E57C2', to: '#4527A0' },
  { key: 'RED', label: 'Rouge', from: '#EF5350', to: '#C62828' },
  { key: 'TEAL', label: 'Turquoise', from: '#26A69A', to: '#00695C' },
  { key: 'DARK', label: 'Ardoise', from: '#546E7A', to: '#263238' },
  { key: 'PINK', label: 'Rose', from: '#EC407A', to: '#AD1457' },
] as const;

export type BannerThemeKey = (typeof BANNER_THEMES)[number]['key'];

export const DEFAULT_BANNER_THEME: BannerThemeKey = 'ORANGE';

export const themeGradient = (key?: string | null): string => {
  const theme = BANNER_THEMES.find((t) => t.key === key) ?? BANNER_THEMES[0];
  return `linear-gradient(135deg, ${theme.from}, ${theme.to})`;
};
