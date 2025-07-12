import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Basado en el diseño de iPhone 12 Pro
const scale = SCREEN_WIDTH / 390;

export const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Detectar tipo de dispositivo
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else {
    return (
      pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)
    );
  }
};

export const isPhone = () => !isTablet();

// Dimensiones adaptativas
export const getResponsiveDimensions = () => {
  const tablet = isTablet();
  
  return {
    // Espaciado
    padding: {
      small: tablet ? 16 : 12,
      medium: tablet ? 24 : 16,
      large: tablet ? 32 : 24,
      xlarge: tablet ? 48 : 32,
    },
    
    // Tamaños de fuente
    fontSize: {
      small: tablet ? normalize(14) : normalize(12),
      medium: tablet ? normalize(16) : normalize(14),
      large: tablet ? normalize(18) : normalize(16),
      xlarge: tablet ? normalize(24) : normalize(20),
      xxlarge: tablet ? normalize(32) : normalize(28),
    },
    
    // Tamaños de botones
    button: {
      height: tablet ? 56 : 48,
      borderRadius: tablet ? 12 : 8,
    },
    
    // Tamaños de imágenes
    image: {
      small: tablet ? 80 : 60,
      medium: tablet ? 120 : 90,
      large: tablet ? 200 : 150,
      xlarge: tablet ? 300 : 200,
    },
    
    // Layout
    layout: {
      maxWidth: tablet ? 800 : SCREEN_WIDTH,
      cardPadding: tablet ? 24 : 16,
      sectionSpacing: tablet ? 32 : 24,
    },
    
    // Grid
    grid: {
      columns: tablet ? 2 : 1,
      gap: tablet ? 24 : 16,
    },
  };
};

// Hook para dimensiones dinámicas
export const useResponsiveDimensions = () => {
  return getResponsiveDimensions();
};

// Colores adaptativos (puedes personalizar según tu tema)
export const getResponsiveColors = () => ({
  primary: '#000000', // Negro como era originalmente
  secondary: '#5856D6',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
});

export default {
  normalize,
  isTablet,
  isPhone,
  getResponsiveDimensions,
  getResponsiveColors,
}; 