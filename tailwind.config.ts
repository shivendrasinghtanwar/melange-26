import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Combined palette: warm cream + Jaipur pink + marigold/emerald (Style II)
        // with deep burgundy (Style I) for the Particulars section.
        cream:    '#FAF1E4',
        cream2:   '#EFE7D8',
        rose:     '#F2D6CC',
        blush:    '#EAD7C4',
        pink:     '#C53A56',
        pinkDeep: '#A02642',
        burgundy: '#5C1A2B',
        wine:     '#7A2235',
        marigold: '#E0A436',
        goldSoft: '#D4B57C',
        emerald:  '#1B5E3F',
        ink:      '#3B1410',
        inkSoft:  '#6F4640',
      },
      fontFamily: {
        display:     ['"Marcellus"', 'serif'],
        italicserif: ['"Cormorant Garamond"', 'serif'],
        body:        ['"Outfit"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
