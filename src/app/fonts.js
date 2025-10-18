// your-new-next-app/src/app/fonts.js

import localFont from 'next/font/local';

// --- Define Proxima Soft font ---
// We create a variable that will hold all the font weights and styles.
export const proximaSoft = localFont({
  src: [
    {
      path: '../assets/fonts/ProximaSoft-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/ProximaSoft-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/ProximaSoft-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/ProximaSoft-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/ProximaSoft-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../assets/fonts/ProximaSoft-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../assets/fonts/ProximaSoft-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  display: 'swap', // This is a good default for performance
  variable: '--font-proxima-soft', // This creates a CSS variable for us to use
});