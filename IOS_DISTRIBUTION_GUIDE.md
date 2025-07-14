# Guía de Distribución iOS - Vehicle Inspection App

## Opciones de Distribución

### 1. TestFlight (Recomendado - GRATIS)

TestFlight es la herramienta oficial de Apple para distribuir apps de prueba sin pasar por la App Store.

#### Requisitos:
- Cuenta de desarrollador de Apple (gratis o de pago)
- Xcode instalado en macOS
- App configurada correctamente

#### Pasos:

1. **Preparar la cuenta de desarrollador:**
   ```bash
   # Abrir Xcode y configurar tu Apple ID
   # Ir a Xcode > Preferences > Accounts
   # Agregar tu Apple ID
   ```

2. **Configurar el proyecto:**
   ```bash
   # En Xcode, abrir ios/VehicleInspectionApp.xcworkspace
   # Seleccionar el proyecto VehicleInspectionApp
   # En la pestaña "Signing & Capabilities":
   # - Marcar "Automatically manage signing"
   # - Seleccionar tu Team
   ```

3. **Compilar y distribuir:**
   ```bash
   # Usar el script automatizado
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

4. **Subir a TestFlight:**
   - Abrir Xcode
   - Ir a Window > Organizer
   - Seleccionar tu app
   - Clic en "Distribute App"
   - Seleccionar "App Store Connect"
   - Subir el archivo IPA generado

5. **Invitar testers:**
   - Ir a App Store Connect
   - Seleccionar tu app
   - Ir a TestFlight
   - Agregar testers por email

### 2. Distribución Ad Hoc (Para dispositivos específicos)

Para distribuir a dispositivos específicos sin App Store:

```bash
# Compilar para distribución Ad Hoc
./build-ios.sh adhoc
```

#### Configurar dispositivos:
1. En Xcode, ir a Window > Devices and Simulators
2. Conectar dispositivos iOS
3. Agregar los UDIDs a tu perfil de desarrollador
4. Generar un nuevo perfil de distribución Ad Hoc

### 3. Distribución Enterprise (Requiere cuenta Enterprise)

Para distribución interna en empresas:

```bash
# Compilar para distribución Enterprise
./build-ios.sh enterprise
```

## Alternativas sin Mac

### 1. Servicios de CI/CD

#### GitHub Actions:
```yaml
# .github/workflows/ios-build.yml
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

#### Bitrise:
- Conectar tu repositorio
- Configurar el workflow de iOS
- Automatizar builds y distribución

#### App Center:
- Subir código fuente
- Configurar build automático
- Distribuir a testers

### 2. Servicios de Compilación en la Nube

#### Expo EAS Build:
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Configurar EAS
eas build:configure

# Compilar para iOS
eas build --platform ios
```

#### Codemagic:
- Conectar repositorio
- Configurar build pipeline
- Automatizar distribución

### 3. Macs Virtuales

#### MacStadium:
- Alquilar Mac en la nube
- Acceso remoto para desarrollo
- Compilación nativa

#### MacinCloud:
- Servicios de Mac virtual
- Acceso por RDP/VNC
- Compilación iOS nativa

## Configuración del Proyecto

### 1. Bundle Identifier
Asegúrate de que el Bundle ID sea único:
```
com.tuempresa.vehicleinspectionapp
```

### 2. Versión y Build Number
En `ios/VehicleInspectionApp/Info.plist`:
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

### 3. Permisos
Verificar que todos los permisos estén configurados:
- Cámara
- Galería de fotos
- Ubicación (si es necesario)

## Troubleshooting

### Error: "No provisioning profiles found"
1. Verificar que el Team esté seleccionado en Xcode
2. Marcar "Automatically manage signing"
3. Limpiar y reconstruir el proyecto

### Error: "Code signing is required"
1. Verificar certificados en Keychain Access
2. Regenerar certificados en Apple Developer Portal
3. Actualizar perfiles de aprovisionamiento

### Error: "Archive failed"
1. Limpiar build: `xcodebuild clean`
2. Verificar que todas las dependencias estén instaladas
3. Verificar que el workspace se abra correctamente

## Comandos Útiles

```bash
# Limpiar proyecto
cd ios && xcodebuild clean

# Instalar pods
cd ios && pod install

# Verificar certificados
security find-identity -v -p codesigning

# Listar dispositivos registrados
xcrun devicectl list devices

# Verificar provisioning profiles
ls ~/Library/MobileDevice/Provisioning\ Profiles/
```

## Enlaces Útiles

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [TestFlight Guide](https://developer.apple.com/testflight/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [React Native iOS Deployment](https://reactnative.dev/docs/running-on-device#ios)

## Notas Importantes

1. **Cuenta de Desarrollador:** Para TestFlight necesitas al menos una cuenta gratuita de desarrollador
2. **Dispositivos:** TestFlight permite hasta 10,000 testers externos
3. **Límites:** Apps en TestFlight expiran después de 90 días
4. **Actualizaciones:** Puedes actualizar la app sin pasar por revisión de App Store
5. **Feedback:** Los testers pueden enviar feedback directamente desde la app

## Próximos Pasos

1. Configurar tu cuenta de desarrollador de Apple
2. Probar la compilación localmente
3. Subir la primera versión a TestFlight
4. Invitar testers iniciales
5. Recopilar feedback y hacer mejoras
6. Considerar publicación en App Store cuando esté lista 