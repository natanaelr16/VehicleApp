#!/bin/bash

echo "🍎 Iniciando iOS Testing con Docker desde Windows..."
echo "=================================================="

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    echo "📥 Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar si Docker está ejecutándose
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker no está ejecutándose"
    echo "🚀 Inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

echo "✅ Docker detectado y ejecutándose"

# Construir imagen Docker
echo "🔨 Construyendo imagen Docker para iOS..."
docker build -f Dockerfile.ios -t vehicle-app-ios .

if [ $? -ne 0 ]; then
    echo "❌ Error al construir la imagen Docker"
    exit 1
fi

echo "✅ Imagen Docker construida exitosamente"

# Ejecutar contenedor
echo "🚀 Iniciando contenedor iOS..."
echo "📱 Metro Bundler estará disponible en: http://localhost:8081"
echo "📱 Expo estará disponible en: http://localhost:19000"

docker run -it --rm \
  -v "$(pwd):/app" \
  -p 8081:8081 \
  -p 19000:19000 \
  -e REACT_NATIVE_PACKAGER_HOSTNAME=localhost \
  vehicle-app-ios

echo "✅ Contenedor iOS iniciado"
echo ""
echo "💡 Para probar tu app:"
echo "   1. Abre http://localhost:8081 en tu navegador"
echo "   2. Usa Expo Go app en tu dispositivo iOS"
echo "   3. Escanea el código QR desde Expo Go"
echo ""
echo "🔧 Para detener el contenedor: Ctrl+C" 