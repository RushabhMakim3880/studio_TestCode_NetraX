
import convert from 'color-convert';

export type CustomTheme = {
  colors: {
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    ring: string;
  };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export const generateThemeFromColor = (rgb: [number, number, number]): CustomTheme => {
  const [h, s, l] = convert.rgb.hsl(rgb);

  const isDark = l < 50;

  if (isDark) {
    // Generate a dark theme
    const accentL = clamp(l + 20, 40, 70);
    return {
      colors: {
        background: `hsl(${h}, ${s-5}%, 10%)`,
        foreground: `hsl(${h}, 5%, 85%)`,
        card: `hsl(${h}, ${s-5}%, 12%)`,
        'card-foreground': `hsl(${h}, 5%, 90%)`,
        popover: `hsl(${h}, ${s-5}%, 10%)`,
        'popover-foreground': `hsl(${h}, 5%, 90%)`,
        primary: `hsl(${h}, ${clamp(s-10, 10, 100)}%, 20%)`,
        'primary-foreground': `hsl(${h}, 5%, 90%)`,
        secondary: `hsl(${h}, ${clamp(s-15, 10, 100)}%, 30%)`,
        'secondary-foreground': `hsl(${h}, 5%, 95%)`,
        muted: `hsl(${h}, ${s-10}%, 18%)`,
        'muted-foreground': `hsl(${h}, 5%, 65%)`,
        accent: `hsl(${h}, ${clamp(s+10, 40, 100)}%, ${accentL}%)`,
        'accent-foreground': `hsl(${h}, ${s-5}%, 10%)`,
        destructive: `hsl(0, 63%, 30%)`,
        'destructive-foreground': `hsl(0, 5%, 95%)`,
        border: `hsl(${h}, ${s-10}%, 20%)`,
        input: `hsl(${h}, ${s-10}%, 20%)`,
        ring: `hsl(${h}, ${clamp(s+10, 40, 100)}%, ${accentL}%)`,
      }
    };
  } else {
    // Generate a light theme
    const primaryL = clamp(l - 20, 10, 40);
    return {
       colors: {
        background: `hsl(${h}, ${s-10}%, 98%)`,
        foreground: `hsl(${h}, 10%, 5%)`,
        card: `hsl(0, 0%, 100%)`,
        'card-foreground': `hsl(${h}, 10%, 5%)`,
        popover: `hsl(0, 0%, 100%)`,
        'popover-foreground': `hsl(${h}, 10%, 5%)`,
        primary: `hsl(${h}, ${clamp(s, 40, 100)}%, ${primaryL}%)`,
        'primary-foreground': `hsl(${h}, 20%, 98%)`,
        secondary: `hsl(${h}, ${s-5}%, 96%)`,
        'secondary-foreground': `hsl(${h}, 10%, 10%)`,
        muted: `hsl(${h}, ${s-5}%, 96%)`,
        'muted-foreground': `hsl(${h}, 5%, 45%)`,
        accent: `hsl(${h}, ${clamp(s, 40, 100)}%, ${clamp(l, 40, 60)}%)`,
        'accent-foreground': `hsl(${h}, 20%, 98%)`,
        destructive: `hsl(0, 84%, 60%)`,
        'destructive-foreground': `hsl(0, 5%, 98%)`,
        border: `hsl(${h}, 5%, 91%)`,
        input: `hsl(${h}, 5%, 91%)`,
        ring: `hsl(${h}, ${clamp(s, 40, 100)}%, ${primaryL}%)`,
      }
    };
  }
};
