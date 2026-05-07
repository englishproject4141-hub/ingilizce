/**
 * Premium Editorial Design System
 * ─────────────────────────────────
 * Görseldeki (ChatGPT Image) tasarıma birebir uyumlu.
 *
 * Fontlar:
 *   Başlıklar → Instrument Serif (Google Fonts)
 *   Body/UI   → Plus Jakarta Sans (Google Fonts)
 *
 * Palet:
 *   Sıcak krem arka plan, koyu lacivert metin,
 *   altın/amber accent, moru/indigo detay rengi.
 */

// ────────────────────────────────────────────
// RENKLER
// ────────────────────────────────────────────

export const Colors = {
  // Arka plan katmanları (görseldeki ultra-light sıcak krem paleti)
  background: '#FAF9F6',         // Sayfa arka planı (Görseldeki ton)
  secondarySurface: '#FFFFFF',   // Tab bar, ikincil yüzeyler
  cardBackground: '#FDFCFB',     // Kart arka planları

  // Metin renkleri
  text: {
    primary: '#1E2B4A',          // Deep Navy — başlıklar, önemli metin
    secondary: '#515151',        // Görseldeki muted metin rengi
    muted: '#A1A1A1',            // Daha açık detay metni
    inverse: '#FFFFFF',          // Koyu arka plan üstü beyaz metin
  },

  // Ana accent renkler
  accent: {
    warmGold: '#D9A669',         // Görseldeki 'For You' özel altın tonu
    lavender: '#F5F3FF',         
    green: '#88B091',            
    indigo: '#5B4FF0',           
  },

  // Etiket / Badge renkleri
  tag: {
    green: { bg: '#ECFDF5', text: '#065F46' },   
    indigo: { bg: '#EEF2FF', text: '#5B4FF0' },   
    amber: { bg: '#FFFBEB', text: '#92400E' },     
    red: { bg: '#FEF2F2', text: '#991B1B' },       
    purple: { bg: '#EDE9FE', text: '#4C1D95' },    
  },

  // Grafik / İkon vurgu renkleri
  chart: {
    flame: '#F59E0B',            
    flameMuted: 'rgba(245, 158, 11, 0.6)', 
    barMuted: '#E5E7EB',         
  },

  // Kenarlık
  border: 'rgba(30, 43, 74, 0.05)',

  // Yüzey üstü yardımcı
  surface: {
    iconCircle: '#FFFFFF',       
    overlay: 'rgba(255,255,255,0.4)',  
    white: '#FFFFFF',
  },
};

// ────────────────────────────────────────────
// TİPOGRAFİ (Fontlar)
// ────────────────────────────────────────────

export const Typography = {
  header: 'InstrumentSerif_400Regular',
  headerItalic: 'InstrumentSerif_400Regular_Italic',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
};

export const Spacing = {
  outer: 32,
  base: 8,
  radius: 20,
  radiusLarge: 24,
};

export const FontSizes = {
  micro: 9,
  caption: 11,
  small: 12,
  body: 14,
  subtitle: 17,
  value: 18,
  cardTitle: 20,
  mediumHeading: 22,
  largeHeading: 24,
  hero: 32,
};

export const Shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
};
