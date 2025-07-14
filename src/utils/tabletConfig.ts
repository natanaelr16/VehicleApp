import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configuración específica para tablets
export const getTabletConfig = () => {
  const isTablet = SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 768;
  
  return {
    isTablet,
    
    // Layout específico para tablets
    layout: {
      // Número de columnas en grids
      gridColumns: isTablet ? 2 : 1,
      
      // Espaciado entre elementos
      itemSpacing: isTablet ? 24 : 16,
      
      // Padding de contenedores
      containerPadding: isTablet ? 32 : 20,
      
      // Ancho máximo para contenido centrado
      maxContentWidth: isTablet ? 1200 : SCREEN_WIDTH,
      
      // Margen lateral para contenido centrado
      sideMargin: isTablet ? 40 : 20,
    },
    
    // Configuración de formularios para tablets
    forms: {
      // Campos por fila en tablets
      fieldsPerRow: isTablet ? 2 : 1,
      
      // Espaciado entre campos
      fieldSpacing: isTablet ? 20 : 16,
      
      // Altura de campos de texto
      inputHeight: isTablet ? 56 : 48,
      
      // Tamaño de fuente en campos
      inputFontSize: isTablet ? 16 : 14,
    },
    
    // Configuración de imágenes para tablets
    images: {
      // Tamaño de imágenes de inspección
      inspectionImageSize: isTablet ? 300 : 200,
      
      // Tamaño de miniaturas
      thumbnailSize: isTablet ? 120 : 80,
      
      // Espaciado entre imágenes
      imageSpacing: isTablet ? 16 : 12,
      
      // Número de imágenes por fila
      imagesPerRow: isTablet ? 3 : 2,
    },
    
    // Configuración de navegación para tablets
    navigation: {
      // Tamaño de botones de navegación
      buttonSize: isTablet ? 56 : 48,
      
      // Espaciado entre botones
      buttonSpacing: isTablet ? 16 : 12,
      
      // Tamaño de iconos
      iconSize: isTablet ? 24 : 20,
    },
    
    // Configuración de PDF para tablets
    pdf: {
      // Tamaño de página
      pageWidth: isTablet ? 800 : 600,
      
      // Margen de página
      pageMargin: isTablet ? 40 : 20,
      
      // Tamaño de fuente del título
      titleFontSize: isTablet ? 24 : 20,
      
      // Tamaño de fuente del contenido
      contentFontSize: isTablet ? 14 : 12,
      
      // Tamaño de imágenes en PDF
      imageSize: isTablet ? 400 : 250,
    },
    
    // Configuración de modales para tablets
    modals: {
      // Ancho del modal
      width: isTablet ? 600 : SCREEN_WIDTH * 0.9,
      
      // Alto del modal
      height: isTablet ? 500 : SCREEN_HEIGHT * 0.8,
      
      // Padding del modal
      padding: isTablet ? 32 : 20,
    },
    
    // Configuración de listas para tablets
    lists: {
      // Altura de elementos de lista
      itemHeight: isTablet ? 80 : 60,
      
      // Padding de elementos
      itemPadding: isTablet ? 20 : 16,
      
      // Tamaño de fuente del título
      titleFontSize: isTablet ? 18 : 16,
      
      // Tamaño de fuente de la descripción
      descriptionFontSize: isTablet ? 14 : 12,
    },
    
    // Configuración de tarjetas para tablets
    cards: {
      // Padding de tarjetas
      padding: isTablet ? 24 : 16,
      
      // Radio de borde
      borderRadius: isTablet ? 12 : 8,
      
      // Elevación/sombra
      elevation: isTablet ? 4 : 2,
      
      // Espaciado entre tarjetas
      spacing: isTablet ? 20 : 16,
    },
  };
};

// Hook para usar la configuración de tablet
export const useTabletConfig = () => {
  return getTabletConfig();
};

// Configuración específica para diferentes tamaños de iPad
export const getIPadSizeConfig = () => {
  const { width, height } = Dimensions.get('window');
  const isIPad = width >= 768 || height >= 768;
  
  if (!isIPad) return null;
  
  // iPad mini (768x1024)
  if (width === 768 || height === 768) {
    return {
      type: 'iPad mini',
      gridColumns: 2,
      maxContentWidth: 700,
      imageSize: 250,
    };
  }
  
  // iPad Air/Pro 11" (834x1194)
  if (width === 834 || height === 834) {
    return {
      type: 'iPad Air/Pro 11"',
      gridColumns: 2,
      maxContentWidth: 800,
      imageSize: 300,
    };
  }
  
  // iPad Pro 12.9" (1024x1366)
  if (width === 1024 || height === 1024) {
    return {
      type: 'iPad Pro 12.9"',
      gridColumns: 3,
      maxContentWidth: 1000,
      imageSize: 350,
    };
  }
  
  // Configuración por defecto para tablets
  return {
    type: 'iPad (generic)',
    gridColumns: 2,
    maxContentWidth: 800,
    imageSize: 300,
  };
};

export default {
  getTabletConfig,
  useTabletConfig,
  getIPadSizeConfig,
}; 