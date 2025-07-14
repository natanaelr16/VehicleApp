# Script de PowerShell para ejecutar Vehicle App iOS en Docker
Write-Host "🚀 Iniciando Vehicle App iOS en Docker..." -ForegroundColor Green

# Verificar si Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker Desktop primero." -ForegroundColor Red
    exit 1
}

# Verificar si docker-compose está instalado
try {
    docker-compose --version | Out-Null
    Write-Host "✅ docker-compose encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ docker-compose no está instalado. Por favor instala docker-compose primero." -ForegroundColor Red
    exit 1
}

# Crear directorio para el simulador si no existe
if (!(Test-Path "ios-simulator")) {
    New-Item -ItemType Directory -Path "ios-simulator"
    Write-Host "📁 Directorio ios-simulator creado" -ForegroundColor Yellow
}

Write-Host "📦 Construyendo imagen Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose.ios.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error construyendo la imagen Docker" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Iniciando servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.ios.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error iniciando los servicios" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Esperando que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "✅ Servicios iniciados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Para acceder a la app:" -ForegroundColor Cyan
Write-Host "   • Metro Bundler: http://localhost:8081" -ForegroundColor White
Write-Host "   • Debug port: localhost:9222" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   • Ver logs: docker-compose -f docker-compose.ios.yml logs -f" -ForegroundColor White
Write-Host "   • Detener servicios: docker-compose -f docker-compose.ios.yml down" -ForegroundColor White
Write-Host "   • Reiniciar: docker-compose -f docker-compose.ios.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Para probar en un navegador web:" -ForegroundColor Cyan
Write-Host "   • Abre http://localhost:8081 en tu navegador" -ForegroundColor White
Write-Host "   • Usa las herramientas de desarrollador para simular un dispositivo móvil" -ForegroundColor White
Write-Host "   • Chrome: Device Toolbar (F12 > Ctrl+Shift+M)" -ForegroundColor White
Write-Host "   • Firefox: Responsive Design Mode" -ForegroundColor White
Write-Host ""
Write-Host "📱 Para probar en un dispositivo físico:" -ForegroundColor Cyan
Write-Host "   • Instala la app Expo Go en tu dispositivo" -ForegroundColor White
Write-Host "   • Escanea el código QR que aparece en http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Para detener los servicios, ejecuta:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.ios.yml down" -ForegroundColor White
Write-Host ""
Write-Host "🎉 ¡Listo! Tu app está ejecutándose en Docker." -ForegroundColor Green 