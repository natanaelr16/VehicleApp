/**
 * Utilidades para manejo de fechas en la aplicación
 */

/**
 * Convierte un timestamp a un objeto Date de manera segura
 */
export const safeParseDate = (timestamp: any): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (timestamp && typeof timestamp === 'string') {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  if (timestamp && typeof timestamp === 'number') {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Si no se puede parsear, retornar fecha actual
  return new Date();
};

/**
 * Formatea una fecha de manera segura para mostrar en la UI
 */
export const formatDateForDisplay = (timestamp: any): string => {
  try {
    const date = safeParseDate(timestamp);
    return date.toLocaleDateString('es-CO');
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Sin fecha';
  }
};

/**
 * Verifica si un valor es una fecha válida
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  
  return false;
}; 