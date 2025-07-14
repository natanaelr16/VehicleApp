#!/bin/bash

echo "🚀 Iniciando Vehicle App iOS en Docker..."

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar si docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose no está instalado. Por favor instala docker-compose primero."
    exit 1
fi

# Crear directorio para el simulador si no existe
mkdir -p ios-simulator

echo "📦 Construyendo imagen Docker..."
docker-compose -f docker-compose.ios.yml build

echo "🔧 Iniciando servicios..."
docker-compose -f docker-compose.ios.yml up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo "✅ Servicios iniciados correctamente!"
echo ""
echo "📱 Para acceder a la app:"
echo "   • Metro Bundler: http://localhost:8081"
echo "   • Debug port: localhost:9222"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: docker-compose -f docker-compose.ios.yml logs -f"
echo "   • Detener servicios: docker-compose -f docker-compose.ios.yml down"
echo "   • Reiniciar: docker-compose -f docker-compose.ios.yml restart"
echo ""
echo "🌐 Para probar en un navegador web:"
echo "   • Abre http://localhost:8081 en tu navegador"
echo "   • Usa las herramientas de desarrollador para simular un dispositivo móvil"
echo ""
echo "📱 Para probar en un dispositivo físico:"
echo "   • Instala la app Expo Go en tu dispositivo"
echo "   • Escanea el código QR que aparece en http://localhost:8081"
echo ""
echo "🛑 Para detener los servicios, ejecuta:"
echo "   docker-compose -f docker-compose.ios.yml down" 