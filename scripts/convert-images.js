const fs = require('fs');
const path = require('path');

// Función para convertir imagen a base64
function convertImageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error(`Error convirtiendo ${imagePath}:`, error);
    return null;
  }
}

// Convertir todas las imágenes
const vehiclesDir = path.join(__dirname, '../assets/vehicles');
const outputFile = path.join(__dirname, '../src/utils/vehicleImagesBase64.ts');

const vehicleTypes = ['sedan', 'suv', 'pickup'];
const base64Images = {};

vehicleTypes.forEach(type => {
  const imagePath = path.join(vehiclesDir, `${type}.png`);
  const base64 = convertImageToBase64(imagePath);
  if (base64) {
    base64Images[type] = base64;
    console.log(`✅ Convertida: ${type}.png`);
  } else {
    console.log(`❌ Error convirtiendo: ${type}.png`);
  }
});

// Generar archivo TypeScript
const tsContent = `// Imágenes de vehículos convertidas a base64
// Este archivo se genera automáticamente con scripts/convert-images.js

export const VEHICLE_IMAGES_BASE64 = ${JSON.stringify(base64Images, null, 2)};

export const getVehicleImageBase64 = (bodyType: string = 'sedan'): string => {
  return VEHICLE_IMAGES_BASE64[bodyType] || VEHICLE_IMAGES_BASE64.sedan || '';
};
`;

fs.writeFileSync(outputFile, tsContent);
console.log(`\n✅ Archivo generado: ${outputFile}`);
console.log('📁 Imágenes convertidas:', Object.keys(base64Images).join(', ')); 