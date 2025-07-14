# Compilación iOS desde Windows - Vehicle Inspection App

## Opciones para Compilar iOS desde Windows

### Opción 1: TestFlight (Recomendada - GRATIS)

TestFlight es la forma oficial de Apple para distribuir apps sin App Store. Es completamente gratis.

#### Requisitos:
- Cuenta de desarrollador de Apple (gratis)
- Acceso a una Mac (física o virtual)
- O usar servicios de CI/CD

### Opción 2: Servicios de CI/CD (Sin Mac)

#### GitHub Actions (Gratis para repos públicos)
1. Crear archivo `.github/workflows/ios-build.yml`:
```yaml
name: iOS Build
on: [push]
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          npm install
          cd ios && pod install
      - name: Build iOS
        run: |
          cd ios
          xcodebuild -workspace VehicleInspectionApp.xcworkspace \
                     -scheme VehicleInspectionApp \
                     -configuration Release \
                     -destination generic/platform=iOS \
                     -archivePath build/VehicleInspectionApp.xcarchive \
                     clean archive
```

#### Bitrise (Plan gratuito disponible)
1. Conectar tu repositorio de GitHub
2. Configurar workflow de iOS
3. Automatizar builds y distribución

#### App Center (Gratis para proyectos personales)
1. Subir código fuente
2. Configurar build automático
3. Distribuir a testers

### Opción 3: Macs Virtuales

#### MacStadium
- Alquilar Mac en la nube desde $0.50/hora
- Acceso remoto completo
- Compilación nativa de iOS

#### MacinCloud
- Servicios de Mac virtual
- Acceso por RDP/VNC
- Precios desde $1/hora

### Opción 4: Servicios de Compilación

#### Expo EAS Build
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Configurar EAS
eas build:configure

# Compilar para iOS
eas build --platform ios
```

#### Codemagic
- Conectar repositorio
- Configurar build pipeline
- Automatizar distribución

## Pasos para Configurar TestFlight

### 1. Preparar Cuenta de Desarrollador
1. Ir a [Apple Developer](https://developer.apple.com/)
2. Crear cuenta gratuita
3. Configurar Apple ID

### 2. Configurar Proyecto en Xcode
1. Abrir `ios/VehicleInspectionApp.xcworkspace` en Xcode
2. Seleccionar proyecto VehicleInspectionApp
3. En "Signing & Capabilities":
   - Marcar "Automatically manage signing"
   - Seleccionar tu Team

### 3. Compilar y Distribuir
```bash
# En macOS o Mac virtual:
./build-ios.sh testflight

# O manualmente:
cd ios
xcodebuild -workspace VehicleInspectionApp.xcworkspace \
           -scheme VehicleInspectionApp \
           -configuration Release \
           -destination generic/platform=iOS \
           -archivePath build/VehicleInspectionApp.xcarchive \
           clean archive

xcodebuild -exportArchive \
           -archivePath build/VehicleInspectionApp.xcarchive \
           -exportPath build/ \
           -exportOptionsPlist exportOptions.plist
```

### 4. Subir a TestFlight
1. Abrir Xcode
2. Ir a Window > Organizer
3. Seleccionar tu app
4. Clic en "Distribute App"
5. Seleccionar "App Store Connect"
6. Subir el archivo IPA

### 5. Invitar Testers
1. Ir a [App Store Connect](https://appstoreconnect.apple.com/)
2. Seleccionar tu app
3. Ir a TestFlight
4. Agregar testers por email

## Alternativas para Desarrollo

### 1. Simuladores en la Nube
- **BrowserStack**: Pruebas en dispositivos iOS reales
- **LambdaTest**: Simulador de iOS en navegador
- **Sauce Labs**: Testing en dispositivos reales

### 2. Desarrollo Híbrido
- **React Native Web**: Desarrollar para web y móvil
- **Expo**: Desarrollo multiplataforma
- **Ionic**: Apps híbridas con Capacitor

### 3. Servicios de Testing
- **Firebase Test Lab**: Testing automatizado
- **AWS Device Farm**: Testing en dispositivos reales
- **Perfecto**: Testing en la nube

## Comandos Útiles en Windows

```powershell
# Verificar Node.js
node --version
npm --version

# Instalar dependencias
npm install

# Ejecutar en Android (alternativa mientras configuras iOS)
npx react-native run-android

# Limpiar cache
npx react-native start --reset-cache

# Verificar configuración
npx react-native doctor
```

## Troubleshooting

### Error: "No se puede compilar iOS en Windows"
- **Solución**: Usar servicios de CI/CD o Mac virtual
- **Alternativa**: Desarrollar en Android primero

### Error: "Xcode no encontrado"
- **Solución**: Instalar Xcode en Mac
- **Alternativa**: Usar GitHub Actions

### Error: "Provisioning profiles"
- **Solución**: Configurar certificados en Apple Developer Portal
- **Alternativa**: Usar "Automatically manage signing"

## Recursos Adicionales

### Documentación Oficial
- [React Native iOS](https://reactnative.dev/docs/running-on-device#ios)
- [Apple Developer](https://developer.apple.com/)
- [TestFlight Guide](https://developer.apple.com/testflight/)

### Servicios Recomendados
- **GitHub Actions**: Gratis para repos públicos
- **Bitrise**: Plan gratuito disponible
- **App Center**: Gratis para proyectos personales
- **MacStadium**: Macs en la nube desde $0.50/hora

### Comunidad
- [React Native Community](https://github.com/react-native-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- [Discord React Native](https://discord.gg/react-native)

## Próximos Pasos

1. **Corto plazo**: Configurar GitHub Actions para builds automáticos
2. **Mediano plazo**: Probar en servicios como Bitrise o App Center
3. **Largo plazo**: Considerar Mac virtual para desarrollo completo

## Notas Importantes

- **TestFlight es GRATIS** y permite hasta 10,000 testers
- **No necesitas cuenta de desarrollador de pago** para TestFlight
- **Las apps en TestFlight expiran cada 90 días** (se pueden renovar)
- **Puedes actualizar sin pasar por revisión** de App Store
- **Los testers pueden enviar feedback** directamente desde la app 