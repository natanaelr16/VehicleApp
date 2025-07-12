// Utilidades para manejo de imágenes en el PDF
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  size: number;
  type: string;
}

/**
 * Función de utilidad para debuggear problemas de imágenes
 */
export const debugImageInfo = (imageUri: string, context: string = 'Unknown') => {
  console.log(`🔍 [${context}] Debug Image Info:`);
  console.log(`  - URI: ${imageUri?.substring(0, 100)}${imageUri?.length > 100 ? '...' : ''}`);
  console.log(`  - Type: ${typeof imageUri}`);
  console.log(`  - Length: ${imageUri?.length || 0}`);
  console.log(`  - Starts with data:image: ${imageUri?.startsWith('data:image')}`);
  console.log(`  - Contains /: ${imageUri?.includes('/')}`);
  console.log(`  - Contains \\: ${imageUri?.includes('\\')}`);
  console.log(`  - Is likely base64: ${imageUri?.length > 100 && !imageUri?.includes('/') && !imageUri?.includes('\\')}`);
};

/**
 * Función segura para convertir imágenes a base64, manejando archivos temporales que pueden no existir
 */
export const safeImageToBase64 = async (imageUri: string, context: string = 'Unknown'): Promise<string> => {
  try {
    debugImageInfo(imageUri, context);
    
    // Si ya es base64, retornar directamente
    if (imageUri.startsWith('data:image')) {
      console.log(`${context} - Ya es base64, retornando directamente`);
      return imageUri;
    }
    
    // Si es una cadena larga sin rutas, probablemente ya es base64
    if (imageUri.length > 100 && !imageUri.includes('/') && !imageUri.includes('\\')) {
      console.log(`${context} - Detectado como base64 sin prefijo, agregando prefijo`);
      return `data:image/png;base64,${imageUri}`;
    }
    
    // Si es un archivo temporal que puede no existir, intentar leerlo
    if (Platform.OS === 'android') {
      try {
        // Verificar si el archivo existe antes de intentar leerlo
        const fileExists = await RNFS.exists(imageUri);
        if (!fileExists) {
          console.warn(`${context} - Archivo de imagen no existe:`, imageUri);
          throw new Error('Archivo de imagen no encontrado');
        }
        
        console.log(`${context} - Archivo existe, leyendo como base64...`);
        // En Android, leer el archivo como base64
        const base64 = await RNFS.readFile(imageUri, 'base64');
        const result = `data:image/jpeg;base64,${base64}`;
        console.log(`${context} - Conversión exitosa, longitud:`, result.length);
        return result;
      } catch (fileError) {
        console.error(`${context} - Error leyendo archivo:`, fileError);
        throw fileError;
      }
    } else {
      // En iOS, la URI ya puede estar en el formato correcto
      console.log(`${context} - iOS, retornando URI directamente`);
      return imageUri;
    }
  } catch (error) {
    console.error(`${context} - Error en safeImageToBase64:`, error);
    throw error;
  }
};

/**
 * Convierte una imagen a base64 para uso en PDFs
 */
export const imageToBase64 = async (imageUri: string): Promise<string> => {
  return safeImageToBase64(imageUri, 'imageToBase64');
};

/**
 * Valida si una imagen es válida para usar como logo o marca de agua
 */
export const validateImage = (imageUri: string): boolean => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const extension = imageUri.toLowerCase().substring(imageUri.lastIndexOf('.'));
  return validExtensions.includes(extension);
};

/**
 * Obtiene información de una imagen
 */
export const getImageInfo = async (imageUri: string): Promise<ImageInfo | null> => {
  try {
    const stats = await RNFS.stat(imageUri);
    return {
      uri: imageUri,
      width: 0, // Se puede obtener con react-native-image-size si es necesario
      height: 0,
      size: stats.size,
      type: imageUri.substring(imageUri.lastIndexOf('.') + 1).toLowerCase(),
    };
  } catch (error) {
    console.error('Error obteniendo información de imagen:', error);
    return null;
  }
};

/**
 * Optimiza una imagen para uso en la aplicación
 */
export const optimizeImage = async (
  imageUri: string, 
  maxWidth: number = 800, 
  maxHeight: number = 600
): Promise<string> => {
  // Por ahora, retornamos la URI original
  // En el futuro, se puede implementar compresión de imagen
  return imageUri;
};

/**
 * Limpia las imágenes temporales
 */
export const cleanupTempImages = async (): Promise<void> => {
  try {
    const tempDir = RNFS.TemporaryDirectoryPath;
    const files = await RNFS.readDir(tempDir);
    
    for (const file of files) {
      if (file.name.startsWith('temp_image_') && file.isFile()) {
        await RNFS.unlink(file.path);
      }
    }
  } catch (error) {
    console.error('Error limpiando imágenes temporales:', error);
  }
}; 