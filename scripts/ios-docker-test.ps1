# Script de PowerShell para iOS Testing con Docker desde Windows

Write-Host "Iniciando iOS Testing con Docker desde Windows..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Verificar si Docker está instalado
try {
    $dockerVersion = & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker detectado: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "Error: Docker no esta instalado" -ForegroundColor Red
        Write-Host "Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Error: Docker no esta instalado" -ForegroundColor Red
    Write-Host "Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar si Docker está ejecutándose
try {
    $dockerInfo = & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker esta ejecutandose" -ForegroundColor Green
    } else {
        Write-Host "Error: Docker no esta ejecutandose" -ForegroundColor Red
        Write-Host "Inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Error: Docker no esta ejecutandose" -ForegroundColor Red
    Write-Host "Inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}

# Construir imagen Docker
Write-Host "Construyendo imagen Docker para iOS..." -ForegroundColor Yellow
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" build -f Dockerfile.ios -t vehicle-app-ios .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al construir la imagen Docker" -ForegroundColor Red
    exit 1
}

Write-Host "Imagen Docker construida exitosamente" -ForegroundColor Green

# Ejecutar contenedor
Write-Host "Iniciando contenedor iOS..." -ForegroundColor Yellow
Write-Host "Metro Bundler estara disponible en: http://localhost:8081" -ForegroundColor Cyan
Write-Host "Expo estara disponible en: http://localhost:19000" -ForegroundColor Cyan

& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" run -it --rm `
  -v "${PWD}:/app" `
  -p 8081:8081 `
  -p 19000:19000 `
  -e REACT_NATIVE_PACKAGER_HOSTNAME=localhost `
  vehicle-app-ios

Write-Host "Contenedor iOS iniciado" -ForegroundColor Green
Write-Host ""
Write-Host "Para probar tu app:" -ForegroundColor Cyan
Write-Host "   1. Abre http://localhost:8081 en tu navegador" -ForegroundColor White
Write-Host "   2. Usa Expo Go app en tu dispositivo iOS" -ForegroundColor White
Write-Host "   3. Escanea el codigo QR desde Expo Go" -ForegroundColor White
Write-Host ""
Write-Host "Para detener el contenedor: Ctrl+C" -ForegroundColor Yellow 