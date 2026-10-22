// ============================================================================
// REVA (reva.in) — Customer Pass Theme Presets & Aesthetic Design Tokens
// Supports rich presets: Cat Cafe, Artisan Bakery, Matcha Zen, Boba, Obsidian, Neon
// ============================================================================

import { ThemeConfig, StampIconType, CardGradientType, PageBgTone } from '@/types/database';

export interface ThemePresetOption {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  config: ThemeConfig;
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'warm_latte',
    name: 'Artisan Bakery & Roastery',
    subtitle: 'Warm cozy ivory, rich espresso & croissants',
    emoji: '☕',
    config: {
      preset: 'warm_latte',
      page_bg_tone: 'warm_ivory',
      custom_page_bg: '#FAF7F2',
      is_dark_mode: false,
      card_gradient: 'mocha_roast',
      card_bg_color: '#451A03',
      card_text_color: '#FFFFFF',
      accent_color: '#D97706',
      stamp_icon: 'croissant',
      card_radius: 'rounded_squircle',
      welcome_badge: '☕ Artisan Coffee & Bakery Pass',
      custom_tagline: 'Collect stamps on fresh brews and handcrafted sourdough',
    },
  },
  {
    id: 'cat_cafe',
    name: 'Cat & Pet Cafe',
    subtitle: 'Playful pinks, warm pastels & paw prints',
    emoji: '🐾',
    config: {
      preset: 'cat_cafe',
      page_bg_tone: 'soft_rose',
      custom_page_bg: '#FFF5F7',
      is_dark_mode: false,
      card_gradient: 'cat_pastel',
      card_bg_color: '#EC4899',
      card_text_color: '#FFFFFF',
      accent_color: '#DB2777',
      stamp_icon: 'paw',
      card_radius: 'rounded_squircle',
      welcome_badge: '🐾 Pet Cafe VIP Pass',
      custom_tagline: 'Collect paw stamps, cuddle with pets & earn free treats!',
    },
  },
  {
    id: 'emerald_matcha',
    name: 'Zen Matcha & Tea Bar',
    subtitle: 'Botanical mint, organic matcha foam & gold',
    emoji: '🍵',
    config: {
      preset: 'emerald_matcha',
      page_bg_tone: 'matcha_cream',
      custom_page_bg: '#F0FDF4',
      is_dark_mode: false,
      card_gradient: 'emerald_depth',
      card_bg_color: '#064E3B',
      card_text_color: '#FFFFFF',
      accent_color: '#10B981',
      stamp_icon: 'matcha',
      card_radius: 'rounded_squircle',
      welcome_badge: '🍵 Kyoto Matcha Club',
      custom_tagline: 'Ceremonial grade matcha rewards on every counter visit',
    },
  },
  {
    id: 'boba_sweet',
    name: 'Boba Tea & Desserts',
    subtitle: 'Taro purple, peach cream & bubble toppings',
    emoji: '🧋',
    config: {
      preset: 'boba_sweet',
      page_bg_tone: 'slate_clean',
      custom_page_bg: '#FAF5FF',
      is_dark_mode: false,
      card_gradient: 'sunset_glow',
      card_bg_color: '#7C3AED',
      card_text_color: '#FFFFFF',
      accent_color: '#F59E0B',
      stamp_icon: 'boba',
      card_radius: 'rounded_squircle',
      welcome_badge: '🧋 Boba VIP Club',
      custom_tagline: 'Sip your favorite handcrafted boba & unlock free toppings',
    },
  },
  {
    id: 'obsidian_luxury',
    name: 'Obsidian Midnight Lounge',
    subtitle: 'Deep dark mode, gold accents & diamond perks',
    emoji: '💎',
    config: {
      preset: 'obsidian_luxury',
      page_bg_tone: 'deep_dark',
      custom_page_bg: '#090D16',
      is_dark_mode: true,
      card_gradient: 'luxury_mesh',
      card_bg_color: '#0F172A',
      card_text_color: '#FFFFFF',
      accent_color: '#F59E0B',
      stamp_icon: 'gem',
      card_radius: 'rounded_soft',
      welcome_badge: '💎 Obsidian Black Card',
      custom_tagline: 'Exclusive privileges, VIP upgrades and signature perks',
    },
  },
  {
    id: 'neon_cyber',
    name: 'Neon Cyber & Arcade',
    subtitle: 'Electric violet, cyan highlights & lightning energy',
    emoji: '⚡',
    config: {
      preset: 'neon_cyber',
      page_bg_tone: 'deep_dark',
      custom_page_bg: '#0A0A14',
      is_dark_mode: true,
      card_gradient: 'cyber_neon',
      card_bg_color: '#4F46E5',
      card_text_color: '#FFFFFF',
      accent_color: '#06B6D4',
      stamp_icon: 'flash',
      card_radius: 'rounded_soft',
      welcome_badge: '⚡ Cyber Arcade Pass',
      custom_tagline: 'Level up your visits with instant high-score rewards',
    },
  },
  {
    id: 'clean_minimal',
    name: 'Clean Swiss Minimal',
    subtitle: 'High contrast typography, crisp monochrome style',
    emoji: '🖤',
    config: {
      preset: 'clean_minimal',
      page_bg_tone: 'slate_clean',
      custom_page_bg: '#F8FAFC',
      is_dark_mode: false,
      card_gradient: 'solid',
      card_bg_color: '#0F172A',
      card_text_color: '#FFFFFF',
      accent_color: '#0F172A',
      stamp_icon: 'star',
      card_radius: 'rounded_sharp',
      welcome_badge: 'ZERO-APP DIGITAL PASS',
      custom_tagline: 'Collect digital stamps on every visit and earn rewards',
    },
  },
];

export const STAMP_ICONS: Array<{ id: StampIconType; label: string; icon: string }> = [
  { id: 'paw', label: 'Paw Print (Cat/Pet)', icon: '🐾' },
  { id: 'coffee', label: 'Coffee Cup', icon: '☕' },
  { id: 'croissant', label: 'Croissant / Bakery', icon: '🥐' },
  { id: 'matcha', label: 'Matcha Bowl', icon: '🍵' },
  { id: 'boba', label: 'Boba Cup', icon: '🧋' },
  { id: 'heart', label: 'Sweet Heart', icon: '❤️' },
  { id: 'star', label: 'Gold Star', icon: '⭐' },
  { id: 'gift', label: 'Gift Box', icon: '🎁' },
  { id: 'gem', label: 'Diamond Gem', icon: '💎' },
  { id: 'flash', label: 'Lightning Flash', icon: '⚡' },
  { id: 'flame', label: 'Spicy Flame', icon: '🔥' },
  { id: 'sparkles', label: 'Magic Sparkles', icon: '✨' },
];

export const PAGE_BG_TONES: Array<{ id: PageBgTone; label: string; color: string; isDark: boolean }> = [
  { id: 'slate_clean', label: 'Crisp Slate', color: '#F8FAFC', isDark: false },
  { id: 'warm_ivory', label: 'Warm Ivory / Cream', color: '#FAF7F2', isDark: false },
  { id: 'soft_rose', label: 'Sweet Rose / Pastel', color: '#FFF5F7', isDark: false },
  { id: 'matcha_cream', label: 'Matcha Foam', color: '#F0FDF4', isDark: false },
  { id: 'deep_dark', label: 'Obsidian Midnight (Dark)', color: '#090D16', isDark: true },
];

export const CARD_GRADIENTS: Array<{ id: CardGradientType; label: string; preview: string }> = [
  { id: 'cat_pastel', label: 'Cat Cafe Pink & Violet Glow', preview: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' },
  { id: 'mocha_roast', label: 'Mocha Espresso & Amber Roast', preview: 'linear-gradient(135deg, #3E2723 0%, #795548 100%)' },
  { id: 'emerald_depth', label: 'Matcha Forest & Botanical Jade', preview: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' },
  { id: 'sunset_glow', label: 'Boba Sunset Peach & Violet', preview: 'linear-gradient(135deg, #7C3AED 0%, #F59E0B 100%)' },
  { id: 'luxury_mesh', label: 'Obsidian Luxury & Midnight Mesh', preview: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' },
  { id: 'cyber_neon', label: 'Electric Cyber Neon & Cyan', preview: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)' },
  { id: 'solid', label: 'Classic Solid Brand Color', preview: '#0F172A' },
];

export function resolveCompleteThemeConfig(theme?: ThemeConfig | null): ThemeConfig {
  const presetId = theme?.preset || 'warm_latte';
  const matched = THEME_PRESETS.find((p) => p.id === presetId) || THEME_PRESETS[0];

  return {
    ...matched.config,
    ...(theme || {}),
    card_gradient: theme?.card_gradient || matched.config.card_gradient,
    card_bg_color: theme?.card_bg_color || matched.config.card_bg_color,
    accent_color: theme?.accent_color || matched.config.accent_color,
    stamp_icon: theme?.stamp_icon || matched.config.stamp_icon,
    welcome_badge: theme?.welcome_badge || matched.config.welcome_badge,
    custom_tagline: theme?.custom_tagline || matched.config.custom_tagline,
    page_bg_tone: theme?.page_bg_tone || matched.config.page_bg_tone,
    custom_page_bg: theme?.custom_page_bg || matched.config.custom_page_bg,
  };
}

export function resolvePassBackground(theme?: ThemeConfig | null, defaultBrandColor: string = '#451A03'): string {
  const resolved = resolveCompleteThemeConfig(theme);
  if (resolved.card_gradient === 'cat_pastel') return 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)';
  if (resolved.card_gradient === 'mocha_roast') return 'linear-gradient(135deg, #3E2723 0%, #795548 100%)';
  if (resolved.card_gradient === 'emerald_depth') return 'linear-gradient(135deg, #064E3B 0%, #047857 100%)';
  if (resolved.card_gradient === 'sunset_glow') return 'linear-gradient(135deg, #7C3AED 0%, #F59E0B 100%)';
  if (resolved.card_gradient === 'luxury_mesh') return 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)';
  if (resolved.card_gradient === 'cyber_neon') return 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)';
  return resolved.card_bg_color || defaultBrandColor;
}

export function resolvePageBackground(theme?: ThemeConfig | null): { bg: string; isDark: boolean } {
  const resolved = resolveCompleteThemeConfig(theme);
  if (resolved.custom_page_bg) return { bg: resolved.custom_page_bg, isDark: Boolean(resolved.is_dark_mode) };

  switch (resolved.page_bg_tone) {
    case 'warm_ivory':
      return { bg: '#FAF7F2', isDark: false };
    case 'soft_rose':
      return { bg: '#FFF5F7', isDark: false };
    case 'matcha_cream':
      return { bg: '#F0FDF4', isDark: false };
    case 'deep_dark':
      return { bg: '#090D16', isDark: true };
    case 'slate_clean':
    default:
      return { bg: '#F8FAFC', isDark: false };
  }
}
