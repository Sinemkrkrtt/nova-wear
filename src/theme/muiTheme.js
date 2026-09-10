import { createTheme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// NOVA WEAR — MUI TEMASI
//
// src/theme/tokens.css içindeki CSS değişkenlerinin JavaScript karşılığı.
// MUI bileşenleri (Button, Chip, Menu, TextField...) kendi renklerini buradan
// alır; böylece sx içine elle renk kodu yazmaya gerek kalmaz.
//
// DEĞER DEĞİŞTİRİRKEN: tokens.css ile bu dosyayı birlikte güncelle — ikisi
// aynı paleti temsil eder.
// ---------------------------------------------------------------------------

export const nw = {
  bg: '#FBF8F7',
  bgElev: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#F3ECEB',
  line: 'rgba(23,16,15,0.10)',
  lineStrong: 'rgba(23,16,15,0.22)',
  text: '#17100F',
  textDim: '#6E6261',
  textFaint: '#9C908F',
  accent: '#B85C74',
  accentHover: '#9C4A61',
  accentSoft: 'rgba(184,92,116,0.09)',
  onAccent: '#FFFFFF',
  success: '#1E8A5C',
  danger: '#C0392B',
  warning: '#B0741A',
  // Fiyatlar display fontuyla yazılmaz: Cormorant'ın ₺ simgesi el yazısı
  // biçiminde ve Türk lirası işaretine benzemiyor (bkz. tokens.css).
  fontDisplay: "'Cormorant Garamond', 'Jost', 'Times New Roman', serif",
  fontBody: "'Jost', 'Helvetica Neue', Arial, sans-serif",
  radius: { sm: 2, md: 3, lg: 4, pill: 999 },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    background: { default: nw.bg, paper: nw.surface },
    primary: { main: nw.accent, contrastText: nw.onAccent },
    secondary: { main: nw.text, contrastText: nw.bg },
    text: { primary: nw.text, secondary: nw.textDim, disabled: nw.textFaint },
    divider: nw.line,
    success: { main: nw.success },
    error: { main: nw.danger },
  },

  shape: { borderRadius: nw.radius.md },

  typography: {
    fontFamily: nw.fontBody,
    // Başlıklar display fontunu kullanır; gövde metni Inter'de kalır.
    // Serif display'de kalın ağırlık kabalaşıyor; zarafet ince ağırlıktan
    // ve nefes alan harf aralığından geliyor.
    h1: { fontFamily: nw.fontDisplay, fontWeight: 300, letterSpacing: '-0.005em' },
    h2: { fontFamily: nw.fontDisplay, fontWeight: 300, letterSpacing: '-0.005em' },
    h3: { fontFamily: nw.fontDisplay, fontWeight: 400, letterSpacing: 0 },
    h4: { fontFamily: nw.fontDisplay, fontWeight: 400, letterSpacing: 0 },
    h5: { fontFamily: nw.fontDisplay, fontWeight: 400 },
    h6: { fontFamily: nw.fontDisplay, fontWeight: 500 },
    button: { fontFamily: nw.fontBody, fontWeight: 600, textTransform: 'none' },
  },

  components: {
    // Butonlarda MUI'nin varsayılan BÜYÜK HARF ve gölge davranışını kapatıyoruz —
    // tasarım dili düz yüzey ve normal yazım üzerine kurulu.
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: nw.radius.pill, paddingInline: 22, paddingBlock: 11 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: nw.fontBody, fontWeight: 600, letterSpacing: '0.04em' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }, // MUI'nin dark mode'da eklediği degradeyi kaldırır
      },
    },
  },
});

export default theme;
