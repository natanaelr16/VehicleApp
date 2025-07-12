#!/bin/bash

echo "🚀 Configurando Vehicle Inspection App para iOS..."

# Verificar si estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: Este script debe ejecutarse en macOS para desarrollo iOS"
    exit 1
fi

# Verificar si Xcode está instalado
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode no está instalado. Por favor instala Xcode desde la App Store"
    exit 1
fi

# Verificar si CocoaPods está instalado
if ! command -v pod &> /dev/null; then
    echo "📦 Instalando CocoaPods..."
    sudo gem install cocoapods
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado. Por favor instala Node.js"
    exit 1
fi

# Verificar si React Native CLI está instalado
if ! command -v npx react-native &> /dev/null; then
    echo "📦 Instalando React Native CLI..."
    npm install -g @react-native-community/cli
fi

echo "📱 Instalando dependencias de Node.js..."
npm install

echo "🍎 Instalando dependencias de iOS..."
cd ios
pod install
cd ..

echo "🧹 Limpiando cache..."
npx react-native start --reset-cache &

echo "📱 Compilando para iOS..."
npx react-native run-ios

echo "✅ ¡Configuración completada! La app debería abrirse en el simulador de iOS"
echo ""
echo "💡 Consejos para desarrollo:"
echo "   - Para abrir en un dispositivo específico: npx react-native run-ios --device 'iPhone 15 Pro'"
echo "   - Para abrir en iPad: npx react-native run-ios --device 'iPad Pro (12.9-inch)'"
echo "   - Para modo release: npx react-native run-ios --configuration Release"
echo "   - Para limpiar y reinstalar: cd ios && xcodebuild clean && cd .. && npx react-native run-ios" 