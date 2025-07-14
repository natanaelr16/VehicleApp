# Script para compilar y distribuir la app iOS en Windows
# Uso: .\build-ios.ps1 [testflight|adhoc|development]

param(
    [string]$DistributionType = "testflight"
)

# Función para mostrar mensajes
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
}

# Verificar que Node.js esté instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js no está instalado o no está en el PATH."
    exit 1
}

# Verificar que npm esté instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm no está instalado o no está en el PATH."
    exit 1
}

Write-Info "Iniciando compilación para iOS - Tipo: $DistributionType"

# Limpiar builds anteriores
Write-Info "Limpiando builds anteriores..."
if (Test-Path "ios/build") {
    Remove-Item -Recurse -Force "ios/build"
}
if (Test-Path "ios/Pods") {
    Remove-Item -Recurse -Force "ios/Pods"
}

# Instalar dependencias de Node.js
Write-Info "Instalando dependencias de Node.js..."
npm install

# Verificar si estamos en macOS (necesario para compilar iOS)
if ($env:OS -eq "Darwin" -or (Get-Command sw_vers -ErrorAction SilentlyContinue)) {
    Write-Info "Detectado macOS - procediendo con compilación iOS..."
    
    # Verificar que Xcode esté instalado
    if (-not (Get-Command xcodebuild -ErrorAction SilentlyContinue)) {
        Write-Error "Xcode no está instalado o no está en el PATH."
        exit 1
    }
    
    # Verificar que CocoaPods esté instalado
    if (-not (Get-Command pod -ErrorAction SilentlyContinue)) {
        Write-Error "CocoaPods no está instalado. Instálalo con: sudo gem install cocoapods"
        exit 1
    }
    
    # Instalar pods
    Write-Info "Instalando CocoaPods..."
    Set-Location ios
    pod install
    Set-Location ..
    
    # Configurar el tipo de distribución
    switch ($DistributionType) {
        "testflight" {
            Write-Info "Configurando para TestFlight..."
            # El exportOptions.plist ya está configurado para app-store
        }
        "adhoc" {
            Write-Info "Configurando para distribución Ad Hoc..."
            (Get-Content "ios/exportOptions.plist") -replace "app-store", "ad-hoc" | Set-Content "ios/exportOptions.plist"
        }
        "development" {
            Write-Info "Configurando para desarrollo..."
            (Get-Content "ios/exportOptions.plist") -replace "app-store", "development" | Set-Content "ios/exportOptions.plist"
        }
        default {
            Write-Error "Tipo de distribución no válido. Usa: testflight, adhoc, o development"
            exit 1
        }
    }
    
    # Compilar la app
    Write-Info "Compilando la app..."
    Set-Location ios
    
    # Crear el archivo .xcarchive
    xcodebuild -workspace VehicleInspectionApp.xcworkspace `
               -scheme VehicleInspectionApp `
               -configuration Release `
               -destination generic/platform=iOS `
               -archivePath build/VehicleInspectionApp.xcarchive `
               clean archive
    
    # Exportar el IPA
    Write-Info "Exportando IPA..."
    xcodebuild -exportArchive `
               -archivePath build/VehicleInspectionApp.xcarchive `
               -exportPath build/ `
               -exportOptionsPlist exportOptions.plist
    
    Set-Location ..
    
    Write-Info "¡Compilación completada!"
    Write-Info "El archivo IPA se encuentra en: ios/build/VehicleInspectionApp.ipa"
    
    if ($DistributionType -eq "testflight") {
        Write-Info ""
        Write-Info "Para subir a TestFlight:"
        Write-Info "1. Abre Xcode"
        Write-Info "2. Ve a Window > Organizer"
        Write-Info "3. Selecciona tu app"
        Write-Info "4. Haz clic en 'Distribute App'"
        Write-Info "5. Selecciona 'App Store Connect'"
        Write-Info "6. Sube el archivo IPA generado"
        Write-Info ""
        Write-Info "O usa el comando:"
        Write-Info "xcrun altool --upload-app --type ios --file ios/build/VehicleInspectionApp.ipa --username TU_APPLE_ID --password TU_APP_SPECIFIC_PASSWORD"
    }
    
} else {
    Write-Warning "No estás en macOS. Para compilar para iOS necesitas:"
    Write-Warning "1. Una Mac con Xcode instalado"
    Write-Warning "2. O usar servicios de CI/CD como:"
    Write-Warning "   - GitHub Actions con runners de macOS"
    Write-Warning "   - Bitrise"
    Write-Warning "   - App Center"
    Write-Warning "   - Expo EAS Build"
    Write-Warning ""
    Write-Warning "Alternativas para desarrollo:"
    Write-Warning "- Usar un simulador de iOS en la nube"
    Write-Warning "- Usar servicios como BrowserStack o LambdaTest"
    Write-Warning "- Compilar en una Mac virtual (VMware/Parallels)"
}

Write-Info "¡Proceso completado!" 