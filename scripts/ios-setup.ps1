# PowerShell script para configuración de iOS
# Nota: Este script debe ejecutarse en macOS o WSL con acceso a Xcode

Write-Host "🚀 Configurando Vehicle Inspection App para iOS..." -ForegroundColor Green

# Verificar si estamos en macOS o WSL
$isMacOSEnv = $false
$isWSL = $false

if ($env:OS -eq "Darwin" -or $env:OSTYPE -eq "darwin") {
    $isMacOSEnv = $true
    Write-Host "✅ Detectado macOS" -ForegroundColor Green
} elseif ($env:WSL_DISTRO_NAME) {
    $isWSL = $true
    Write-Host "✅ Detectado WSL" -ForegroundColor Green
} else {
    Write-Host "❌ Error: Este script debe ejecutarse en macOS o WSL para desarrollo iOS" -ForegroundColor Red
    Write-Host "💡 Para desarrollo iOS necesitas:" -ForegroundColor Yellow
    Write-Host "   - macOS con Xcode instalado" -ForegroundColor Yellow
    Write-Host "   - O WSL con acceso a Xcode" -ForegroundColor Yellow
    exit 1
}

# Verificar si Xcode está disponible
try {
    if ($isMacOSEnv) {
        $xcodeVersion = & xcodebuild -version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Xcode detectado: $xcodeVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ Error: Xcode no está instalado. Por favor instala Xcode desde la App Store" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Error: Xcode no está disponible" -ForegroundColor Red
    exit 1
}

# Verificar si CocoaPods está instalado
try {
    $podVersion = & pod --version 2>$null
            if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ CocoaPods detectado: $podVersion" -ForegroundColor Green
        } else {
            Write-Host "📦 Instalando CocoaPods..." -ForegroundColor Yellow
            if ($isMacOSEnv) {
                & sudo gem install cocoapods
            } else {
                & gem install cocoapods
            }
        }
} catch {
    Write-Host "❌ Error: No se pudo instalar CocoaPods" -ForegroundColor Red
    exit 1
}

# Verificar si Node.js está instalado
try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: Node.js no está instalado. Por favor instala Node.js" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: Node.js no está disponible" -ForegroundColor Red
    exit 1
}

# Verificar si React Native CLI está instalado
try {
    $rnVersion = & npx react-native --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ React Native CLI detectado" -ForegroundColor Green
    } else {
        Write-Host "📦 Instalando React Native CLI..." -ForegroundColor Yellow
        & npm install -g @react-native-community/cli
    }
} catch {
    Write-Host "❌ Error: No se pudo instalar React Native CLI" -ForegroundColor Red
    exit 1
}

Write-Host "📱 Instalando dependencias de Node.js..." -ForegroundColor Yellow
& npm install

Write-Host "🍎 Instalando dependencias de iOS..." -ForegroundColor Yellow
Set-Location ios
& pod install
Set-Location ..

Write-Host "🧹 Limpiando cache..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "react-native", "start", "--reset-cache"

Write-Host "📱 Compilando para iOS..." -ForegroundColor Yellow
& npx react-native run-ios

Write-Host "✅ ¡Configuración completada! La app debería abrirse en el simulador de iOS" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Consejos para desarrollo:" -ForegroundColor Cyan
Write-Host "   - Para abrir en un dispositivo específico: npx react-native run-ios --device 'iPhone 15 Pro'" -ForegroundColor White
Write-Host "   - Para abrir en iPad: npx react-native run-ios --device 'iPad Pro (12.9-inch)'" -ForegroundColor White
Write-Host "   - Para modo release: npx react-native run-ios --configuration Release" -ForegroundColor White
Write-Host "   - Para limpiar y reinstalar: cd ios && xcodebuild clean && cd .. && npx react-native run-ios" -ForegroundColor White 