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
  // Arka plan katmanları (sıcak krem paleti)
  background: '#F6F1EB',         // Sayfa arka planı
  secondarySurface: '#FBF8F4',   // Tab bar, ikincil yüzeyler
  cardBackground: '#F8F4EF',     // Kart arka planları

  // Metin renkleri
  text: {
    primary: '#1E2B4A',          // Deep Navy — başlıklar, önemli metin
    secondary: '#6E6A67',        // Muted Taupe — açıklama metinleri
    muted: '#B8B2AA',            // Light Sand — alt bilgiler, placeholder
    inverse: '#FFFFFF',          // Koyu arka plan üstü beyaz metin
  },

  // Ana accent renkler
  accent: {
    warmGold: '#D8B07A',         // Altın — progress bar, CTA butonları
    lavender: '#B7B2FF',         // Lavanta — dekoratif detaylar
    green: '#B7D9C0',            // Yeşil — onay ikon, başarı göstergesi
    indigo: '#5B4FF0',           // İndigo — etiketler, mini progress, B1→B2
  },

  // Etiket / Badge renkleri (arka plan + metin çiftleri)
  tag: {
    green: { bg: '#ECFDF5', text: '#065F46' },   // DEVAM ET
    indigo: { bg: '#EEF2FF', text: '#5B4FF0' },   // ÖNERİLEN
    amber: { bg: '#FFFBEB', text: '#92400E' },     // KELİME BEKLİYOR
    red: { bg: '#FEF2F2', text: '#991B1B' },       // Hata / uyarı
    purple: { bg: '#EDE9FE', text: '#4C1D95' },    // Premium
  },

  // Grafik / İkon vurgu renkleri
  chart: {
    flame: '#F59E0B',            // Streak ateş ikonu, çubuk grafik
    flameMuted: 'rgba(245, 158, 11, 0.6)', // Geçmiş gün çubukları
    barMuted: '#E5E7EB',         // Pasif çubuk
  },

  // Kenarlık
  border: 'rgba(30, 43, 74, 0.06)',

  // Yüzey üstü yardımcı
  surface: {
    iconCircle: '#F3F4F6',       // İkon daire arka planı
    overlay: 'rgba(255,255,255,0.4)',  // Buton/overlay
    white: '#FFFFFF',
  },
};

// ────────────────────────────────────────────
// TİPOGRAFİ (Fontlar)
// ────────────────────────────────────────────
// ⚠ Bu font isimleri expo-google-fonts paket isimleridir.
//   _layout.tsx'de useFonts ile yüklenmektedir.

export const Typography = {
  // Başlık fontları — Instrument Serif
  header: 'InstrumentSerif_400Regular',
  headerItalic: 'InstrumentSerif_400Regular_Italic',

  // Body fontları — Plus Jakarta Sans
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
};

// ────────────────────────────────────────────
// ARALAMA / BOYUTLAR
// ────────────────────────────────────────────

export const Spacing = {
  /** Ekran kenarı boşluğu (px) */
  outer: 32,
  /** Temel ızgara birimi (px) */
  base: 8,
  /** Varsayılan kart köşe yarıçapı */
  radius: 20,
  /** Büyük kart köşe yarıçapı (Hero, Focus vb.) */
  radiusLarge: 24,
};

// ────────────────────────────────────────────
// FONT BOYUTLARI (Referans)
// ────────────────────────────────────────────
// Bileşenlerde inline kullanılır ama tutarlılık için burada belgelenmiştir.

export const FontSizes = {
  /** Micro label — tag, section header */
  micro: 9,
  /** Caption — meta text, context */
  caption: 11,
  /** Small body — metadata, descriptions */
  small: 12,
  /** Body text */
  body: 14,
  /** Subtitle — focus subtitle */
  subtitle: 17,
  /** Section value — stat numbers */
  value: 18,
  /** Card title — rec cards */
  cardTitle: 20,
  /** Medium heading — quote, daily focus */
  mediumHeading: 22,
  /** Large heading — focus title */
  largeHeading: 24,
  /** Hero heading */
  hero: 32,
};

// ────────────────────────────────────────────
// GÖLGE PRESET'LERİ
// ────────────────────────────────────────────

export const Shadows = {
  /** Aktif tab, elevated kart */
  subtle: {
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  /** Play butonu, floating nav */
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  /** Floating nav bar */
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
};
