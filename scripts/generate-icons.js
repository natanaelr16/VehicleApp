const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const inputPath = path.join(__dirname, '../assets/icons/icon_1024.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
  try {
    // Verificar que existe la imagen original
    if (!fs.existsSync(inputPath)) {
      console.error('❌ No se encontró la imagen: assets/icons/icon_1024.png');
      console.log('📁 Por favor, coloca tu imagen de 1024x1024 en esa ubicación');
      return;
    }

    console.log('🔄 Generando iconos...');

    // Generar iconos para cada densidad
    for (const [folder, size] of Object.entries(sizes)) {
      const outputPath = path.join(androidResPath, folder, 'ic_launcher.png');
      const outputRoundPath = path.join(androidResPath, folder, 'ic_launcher_round.png');

      // Crear icono normal
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      // Crear icono redondo
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputRoundPath);

      console.log(`✅ Generado: ${folder}/ic_launcher.png (${size}x${size})`);
      console.log(`✅ Generado: ${folder}/ic_launcher_round.png (${size}x${size})`);
    }

    console.log('🎉 ¡Iconos generados exitosamente!');
    console.log('📱 Ahora puedes compilar la app para ver el nuevo icono');

  } catch (error) {
    console.error('❌ Error generando iconos:', error);
  }
}

generateIcons(); 