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
  bg: '#000000',
  bgElev: '#1A1A20',
  surface: '#202027',
  surface2: '#2A2A33',
  line: 'rgba(255,255,255,0.09)',
  lineStrong: 'rgba(255,255,255,0.17)',
  text: '#F4F4F7',
  textDim: '#A2A2AE',
  textFaint: '#6E6E7B',
  accent: '#9B70FF',
  accentHover: '#B18FFF',
  accentSoft: 'rgba(155,112,255,0.16)',
  onAccent: '#150A26',
  success: '#3DD68C',
  danger: '#FF5F5F',
  warning: '#FFB450',
  // Syne'de ₺ simgesi bulunmadığı için listede hemen ardından Manrope var:
  // tarayıcı yalnızca eksik simgeyi ondan alır (bkz. tokens.css).
  fontDisplay: "'Syne', 'Manrope', 'Helvetica Neue', Arial, sans-serif",
  fontBody: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
  radius: { sm: 8, md: 14, lg: 20, pill: 999 },
};

const theme = createTheme({
  palette: {
    mode: 'dark',
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
    h1: { fontFamily: nw.fontDisplay, fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontFamily: nw.fontDisplay, fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontFamily: nw.fontDisplay, fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontFamily: nw.fontDisplay, fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontFamily: nw.fontDisplay, fontWeight: 600 },
    h6: { fontFamily: nw.fontDisplay, fontWeight: 600 },
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
