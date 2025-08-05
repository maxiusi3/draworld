/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 童画奇旅品牌色彩
        cream: {
          50: '#FFF5E1',
          100: '#FFEBC3',
          200: '#FFD688',
          300: '#FFC04C',
          400: '#FFAB10',
          500: '#FF9500',
          600: '#CC7700',
          700: '#995A00',
          800: '#663C00',
          900: '#331E00',
        },
        sky: {
          50: '#E6F4FF',
          100: '#B3E0FF',
          200: '#80CCFF',
          300: '#4DB8FF',
          400: '#1AA4FF',
          500: '#5A9CFF', // 主色调
          600: '#0080E6',
          700: '#0066B3',
          800: '#004C80',
          900: '#00334D',
        },
        warm: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFD15A', // 辅助色
          600: '#FFB300',
          700: '#FF8F00',
          800: '#FF6F00',
          900: '#E65100',
        },
        rose: {
          50: '#FFF0F5',
          100: '#FFDBEA',
          200: '#FFC8DD', // 点缀色
          300: '#FFB3D1',
          400: '#FF9EC7',
          500: '#FF8ABD',
          600: '#E6739F',
          700: '#CC5C82',
          800: '#B34565',
          900: '#992E47',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    // 可以添加Tailwind插件，如 @tailwindcss/forms, @tailwindcss/typography
  ],
}