# 🍎 Desarrollo iOS - Vehicle Inspection App

## Requisitos Previos

### Hardware
- **Mac con macOS** (requerido para desarrollo iOS)
- **Xcode** (versión 15.0 o superior)
- **Dispositivo iOS** (opcional, para testing en dispositivo físico)

### Software
- **Node.js** (versión 18 o superior)
- **React Native CLI**
- **CocoaPods**
- **Git**

## 🚀 Configuración Inicial

### 1. Instalar Xcode
```bash
# Descargar desde la App Store o developer.apple.com
# Asegúrate de instalar también las Command Line Tools
xcode-select --install
```

### 2. Instalar CocoaPods
```bash
sudo gem install cocoapods
```

### 3. Configurar el Proyecto
```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd VehicleApp

# Instalar dependencias
npm install

# Instalar dependencias de iOS
cd ios
pod install
cd ..
```

## 📱 Ejecutar la App

### Opciones de Ejecución

#### Simulador iPhone
```bash
npm run ios
# o
npx react-native run-ios
```

#### Simulador iPad
```bash
npm run ios:tablet
# o
npx react-native run-ios --device 'iPad Pro (12.9-inch)'
```

#### Dispositivo Específico
```bash
# Listar dispositivos disponibles
xcrun simctl list devices

# Ejecutar en dispositivo específico
npm run ios:device
# o
npx react-native run-ios --device 'iPhone 15 Pro'
```

#### Modo Release
```bash
npm run ios:release
# o
npx react-native run-ios --configuration Release
```

### Scripts Útiles

```bash
# Configuración automática completa
npm run ios:setup

# Limpiar y reinstalar
npm run ios:clean

# Resetear cache de Metro
npm run start:reset
```

## 🎨 Características Responsive

La app está optimizada para funcionar perfectamente en:

### 📱 iPhone
- **Orientación**: Portrait y Landscape
- **Tamaños**: iPhone SE hasta iPhone 15 Pro Max
- **Densidad**: 1x, 2x, 3x

### 📱 iPad
- **Orientación**: Portrait, Landscape, Portrait Upside Down
- **Tamaños**: iPad mini hasta iPad Pro 12.9"
- **Layout**: Grid de 2 columnas en tablets
- **Elementos**: Botones y textos más grandes

### 🔧 Componentes Responsive

#### ResponsiveLayout
```tsx
import ResponsiveLayout from '../components/ResponsiveLayout';

<ResponsiveLayout padding="large" maxWidth={true}>
  {/* Tu contenido aquí */}
</ResponsiveLayout>
```

#### ResponsiveButton
```tsx
import ResponsiveButton from '../components/ResponsiveButton';

<ResponsiveButton
  title="Nueva Inspección"
  onPress={handlePress}
  variant="primary"
  size="large"
  fullWidth={true}
/>
```

#### Utilidades Responsive
```tsx
import { 
  getResponsiveDimensions, 
  isTablet, 
  getResponsiveColors 
} from '../utils/responsive';

const dimensions = getResponsiveDimensions();
const colors = getResponsiveColors();
const tablet = isTablet();
```

## 🐛 Solución de Problemas

### Error: "No provisioning profile found"
```bash
# Abrir Xcode
open ios/VehicleInspectionApp.xcworkspace

# En Xcode:
# 1. Seleccionar el proyecto
# 2. Seleccionar el target
# 3. En "Signing & Capabilities"
# 4. Marcar "Automatically manage signing"
# 5. Seleccionar tu equipo de desarrollo
```

### Error: "Build failed"
```bash
# Limpiar proyecto
npm run ios:clean

# O manualmente:
cd ios
xcodebuild clean
cd ..
rm -rf node_modules
npm install
cd ios
pod install
cd ..
npx react-native run-ios
```

### Error: "Metro bundler not found"
```bash
# Iniciar Metro manualmente
npx react-native start

# En otra terminal:
npx react-native run-ios
```

### Error: "Pod install failed"
```bash
# Limpiar cache de CocoaPods
pod cache clean --all
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods
rm -rf ~/Library/Developer/Xcode/DerivedData
pod install
```

## 📊 Testing en Diferentes Dispositivos

### Simuladores Recomendados

#### iPhone
- iPhone SE (3rd generation) - 375x667
- iPhone 15 Pro - 393x852
- iPhone 15 Pro Max - 430x932

#### iPad
- iPad Pro (11-inch) - 834x1194
- iPad Pro (12.9-inch) - 1024x1366

### Testing Checklist

- [ ] App se ve bien en iPhone portrait
- [ ] App se ve bien en iPhone landscape
- [ ] App se ve bien en iPad portrait
- [ ] App se ve bien en iPad landscape
- [ ] Botones son fáciles de tocar en móvil
- [ ] Texto es legible en todos los tamaños
- [ ] Imágenes se escalan correctamente
- [ ] Formularios son fáciles de usar
- [ ] PDFs se generan correctamente
- [ ] Navegación funciona bien

## 🔧 Configuración Avanzada

### Personalizar Colores
Edita `src/utils/responsive.ts`:
```tsx
export const getResponsiveColors = () => ({
  primary: '#007AFF',      // Color principal
  secondary: '#5856D6',    // Color secundario
  background: '#F2F2F7',   // Fondo
  surface: '#FFFFFF',      // Superficies
  // ... más colores
});
```

### Personalizar Dimensiones
```tsx
export const getResponsiveDimensions = () => {
  const tablet = isTablet();
  
  return {
    padding: {
      small: tablet ? 16 : 12,
      medium: tablet ? 24 : 16,
      // ... más dimensiones
    },
    // ... más configuraciones
  };
};
```

## 📱 Distribución

### Archivo IPA
```bash
# En Xcode:
# 1. Product > Archive
# 2. Distribute App
# 3. Ad Hoc o App Store
```

### TestFlight
```bash
# 1. Subir build a App Store Connect
# 2. Configurar TestFlight
# 3. Invitar testers
```

## 🎯 Mejores Prácticas

1. **Siempre testea en múltiples dispositivos**
2. **Usa los componentes responsive**
3. **Mantén el código limpio y documentado**
4. **Testea en modo release antes de distribuir**
5. **Usa el simulador de iPad para testing de tablets**
6. **Verifica la accesibilidad (VoiceOver)**
7. **Testea con diferentes tamaños de texto**

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Xcode
2. Verifica la configuración de signing
3. Limpia y reinstala las dependencias
4. Consulta la documentación de React Native
5. Revisa los issues del repositorio 