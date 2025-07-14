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
 * Convierte una imagen a base64 para uso en PDFs
 */
export const imageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    let base64Data: string;
    let originalFormat: string = 'jpeg';
    
    // Verificar si ya es una URI de data:image (común en ambos Android e iOS)
    if (imageUri.startsWith('data:image')) {
      // Extraer solo la parte base64 y determinar formato
      const parts = imageUri.split(',');
      base64Data = parts[1];
      
      // Extraer el formato del header
      const header = imageUri.split(',')[0];
      if (header.includes('image/png')) {
        originalFormat = 'png';
      } else if (header.includes('image/jpeg') || header.includes('image/jpg')) {
        originalFormat = 'jpeg';
      } else if (header.includes('image/webp')) {
        originalFormat = 'webp';
      }
      

    } else if (Platform.OS === 'android') {
      // Verificar si el archivo existe antes de intentar leerlo
      const fileExists = await RNFS.exists(imageUri);
      if (!fileExists) {
        console.warn('Archivo de imagen no existe:', imageUri);
        throw new Error('Archivo de imagen no encontrado');
      }
      
      // En Android, leer el archivo como base64
      base64Data = await RNFS.readFile(imageUri, 'base64');

      
      // Determinar el formato original
      if (imageUri.toLowerCase().includes('.png')) {
        originalFormat = 'png';
      } else if (imageUri.toLowerCase().includes('.jpg') || imageUri.toLowerCase().includes('.jpeg')) {
        originalFormat = 'jpeg';
      } else if (imageUri.toLowerCase().includes('.webp')) {
        originalFormat = 'webp';
      }
      
    } else {
      // En iOS, leer el archivo como base64
      const fileExists = await RNFS.exists(imageUri);
      if (!fileExists) {
        console.warn('Archivo de imagen no existe:', imageUri);
        throw new Error('Archivo de imagen no encontrado');
      }
      base64Data = await RNFS.readFile(imageUri, 'base64');
      
      // Determinar el formato original
      if (imageUri.toLowerCase().includes('.png')) {
        originalFormat = 'png';
      } else if (imageUri.toLowerCase().includes('.jpg') || imageUri.toLowerCase().includes('.jpeg')) {
        originalFormat = 'jpeg';
      } else if (imageUri.toLowerCase().includes('.webp')) {
        originalFormat = 'webp';
      }
      

    }
    
    // Para el PDF, siempre usar JPEG por mejor compatibilidad y tamaño
    // Si la imagen original es PNG o WebP, podríamos convertirla aquí
    // Por ahora, mantenemos el formato original pero aseguramos que sea JPEG para el PDF
    
    return base64Data;
  } catch (error) {
    console.error('Error convirtiendo imagen a base64:', error);
    throw error; // Re-lanzar el error para que el código que llama pueda manejarlo
  }
};

/**
 * Valida si una imagen es válida para usar como logo o marca de agua
 */
export const validateImage = (imageUri: string): boolean => {
  // Verificar si la URI existe
  if (!imageUri) {
    return false;
  }
  
  // Si es una URI de data:image, es válida
  if (imageUri.startsWith('data:image')) {
    return true;
  }
  
  // Verificar si es una URI de archivo
  if (imageUri.startsWith('file://') || imageUri.startsWith('content://') || imageUri.startsWith('file:')) {
    // Verificar extensión de archivo
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lastDotIndex = imageUri.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      return false;
    }
    
    const extension = imageUri.toLowerCase().substring(lastDotIndex);
    return validExtensions.includes(extension);
  }
  
  return false;
};

/**
 * Determina el tipo MIME correcto para una imagen
 */
export const getImageMimeType = (imageUri: string): string => {
  if (imageUri.startsWith('data:image')) {
    // Extraer el tipo MIME del header
    const header = imageUri.split(',')[0];
    const mimeMatch = header.match(/data:([^;]+)/);
    return mimeMatch ? mimeMatch[1] : 'image/jpeg';
  }
  
  // Determinar por extensión
  const extension = imageUri.toLowerCase();
  let mimeType = 'image/jpeg'; // Por defecto
  
  if (extension.includes('.png')) {
    mimeType = 'image/png';
  } else if (extension.includes('.jpg') || extension.includes('.jpeg')) {
    mimeType = 'image/jpeg';
  } else if (extension.includes('.webp')) {
    mimeType = 'image/webp';
  } else if (extension.includes('.gif')) {
    mimeType = 'image/gif';
  } else if (extension.includes('.bmp')) {
    mimeType = 'image/bmp';
  }
  
  return mimeType;
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
 * Optimiza una imagen para uso en el PDF
 * Convierte a formato JPEG con calidad optimizada
 */
export const optimizeImageForPDF = async (
  imageUri: string,
  quality: number = 0.8,
  maxWidth: number = 1200,
  maxHeight: number = 800
): Promise<string> => {
  try {
    // Por ahora, retornamos la imagen original
    // En el futuro, se puede implementar:
    // 1. Redimensionamiento si es muy grande
    // 2. Conversión a JPEG si es PNG o WebP
    // 3. Compresión con calidad específica
    // 4. Optimización de metadatos
    
    const base64 = await imageToBase64(imageUri);
    return base64;
  } catch (error) {
    console.error('Error optimizando imagen para PDF:', error);
    throw error;
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