#!/bin/bash

# Script para compilar y distribuir la app iOS
# Uso: ./build-ios.sh [testflight|adhoc|development]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que Xcode esté instalado
if ! command -v xcodebuild &> /dev/null; then
    print_error "Xcode no está instalado o no está en el PATH."
    exit 1
fi

# Verificar que CocoaPods esté instalado
if ! command -v pod &> /dev/null; then
    print_error "CocoaPods no está instalado. Instálalo con: sudo gem install cocoapods"
    exit 1
fi

# Tipo de distribución (por defecto testflight)
DISTRIBUTION_TYPE=${1:-testflight}

print_message "Iniciando compilación para iOS - Tipo: $DISTRIBUTION_TYPE"

# Limpiar builds anteriores
print_message "Limpiando builds anteriores..."
rm -rf ios/build
rm -rf ios/Pods

# Instalar dependencias de Node.js
print_message "Instalando dependencias de Node.js..."
npm install

# Instalar pods
print_message "Instalando CocoaPods..."
cd ios
pod install
cd ..

# Configurar el tipo de distribución
case $DISTRIBUTION_TYPE in
    "testflight")
        print_message "Configurando para TestFlight..."
        # El exportOptions.plist ya está configurado para app-store
        ;;
    "adhoc")
        print_message "Configurando para distribución Ad Hoc..."
        sed -i '' 's/app-store/ad-hoc/g' ios/exportOptions.plist
        ;;
    "development")
        print_message "Configurando para desarrollo..."
        sed -i '' 's/app-store/development/g' ios/exportOptions.plist
        ;;
    *)
        print_error "Tipo de distribución no válido. Usa: testflight, adhoc, o development"
        exit 1
        ;;
esac

# Compilar la app
print_message "Compilando la app..."
cd ios

# Crear el archivo .xcarchive
xcodebuild -workspace VehicleInspectionApp.xcworkspace \
           -scheme VehicleInspectionApp \
           -configuration Release \
           -destination generic/platform=iOS \
           -archivePath build/VehicleInspectionApp.xcarchive \
           clean archive

# Exportar el IPA
print_message "Exportando IPA..."
xcodebuild -exportArchive \
           -archivePath build/VehicleInspectionApp.xcarchive \
           -exportPath build/ \
           -exportOptionsPlist exportOptions.plist

cd ..

print_message "¡Compilación completada!"
print_message "El archivo IPA se encuentra en: ios/build/VehicleInspectionApp.ipa"

if [ "$DISTRIBUTION_TYPE" = "testflight" ]; then
    print_message ""
    print_message "Para subir a TestFlight:"
    print_message "1. Abre Xcode"
    print_message "2. Ve a Window > Organizer"
    print_message "3. Selecciona tu app"
    print_message "4. Haz clic en 'Distribute App'"
    print_message "5. Selecciona 'App Store Connect'"
    print_message "6. Sube el archivo IPA generado"
    print_message ""
    print_message "O usa el comando:"
    print_message "xcrun altool --upload-app --type ios --file ios/build/VehicleInspectionApp.ipa --username TU_APPLE_ID --password TU_APP_SPECIFIC_PASSWORD"
fi

print_message "¡Proceso completado exitosamente!" 