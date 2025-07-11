// Utilidades para manejo de imágenes en el PDF
import { Platform } from 'react-native';
import { VEHICLE_IMAGES_BASE64, getVehicleImageBase64 } from './vehicleImagesBase64';

// Función para generar SVG con imagen del vehículo y puntos marcados
export const generateVehicleSVGWithPoints = async (
  bodyType: string = 'sedan',
  points: Array<{x: number, y: number, number: number}> = []
): Promise<string> => {
  try {
    // Obtener la imagen base64 del vehículo
    const base64Image = getVehicleImageBase64(bodyType);
    
    if (!base64Image) {
      console.error('No se pudo cargar la imagen del vehículo:', bodyType);
      return getPlaceholderImage();
    }
    
    // Crear SVG que contenga la imagen del vehículo y los puntos superpuestos
    const svgContent = `
      <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        
        <!-- Imagen del vehículo de fondo -->
        <image href="${base64Image}" x="0" y="0" width="300" height="150" preserveAspectRatio="xMidYMid meet"/>
        
        <!-- Puntos de inspección superpuestos -->
        ${points.map(point => `
          <circle 
            cx="${point.x * 300}" 
            cy="${point.y * 150}" 
            r="12" 
            fill="#FF0000" 
            stroke="#FFFFFF" 
            stroke-width="3"
            filter="url(#shadow)"
          />
          <text 
            x="${point.x * 300}" 
            y="${point.y * 150 + 4}" 
            text-anchor="middle" 
            fill="white" 
            font-size="12" 
            font-weight="bold"
            font-family="Arial, sans-serif"
          >
            ${point.number}
          </text>
        `).join('')}
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  } catch (error) {
    console.error('Error generando SVG con puntos:', error);
    return getPlaceholderImage();
  }
};

// Función para obtener imagen con puntos marcados
export const getVehicleImageWithPoints = async (
  bodyType: string = 'sedan',
  points: Array<{x: number, y: number, number: number}> = []
): Promise<string> => {
  try {
    // Si no hay puntos, devolver la imagen original
    if (points.length === 0) {
      return getVehicleImageBase64(bodyType);
    }
    
    // Generar SVG con la imagen y los puntos superpuestos
    return await generateVehicleSVGWithPoints(bodyType, points);
  } catch (error) {
    console.error('Error obteniendo imagen del vehículo:', error);
    return getPlaceholderImage();
  }
};

// Imagen placeholder en caso de error
const getPlaceholderImage = (): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
      <text x="150" y="75" text-anchor="middle" fill="#666" font-size="14">Imagen no disponible</text>
    </svg>
  `)}`;
}; 