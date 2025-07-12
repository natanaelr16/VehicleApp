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
    if (Platform.OS === 'android') {
      // Verificar si el archivo existe antes de intentar leerlo
      const fileExists = await RNFS.exists(imageUri);
      if (!fileExists) {
        console.warn('Archivo de imagen no existe:', imageUri);
        throw new Error('Archivo de imagen no encontrado');
      }
      
      // En Android, leer el archivo como base64
      const base64 = await RNFS.readFile(imageUri, 'base64');
      return `data:image/jpeg;base64,${base64}`;
    } else {
      // En iOS, la URI ya puede estar en el formato correcto
      return imageUri;
    }
  } catch (error) {
    console.error('Error convirtiendo imagen a base64:', error);
    throw error; // Re-lanzar el error para que el código que llama pueda manejarlo
  }
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