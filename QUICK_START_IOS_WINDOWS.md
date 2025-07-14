# 🚀 Guía Rápida: Probar iOS desde Windows

## 🎯 **Opción 1: Docker (Recomendado)**

### **Paso 1: Instalar Docker Desktop**
1. Descarga desde: https://www.docker.com/products/docker-desktop
2. Instala y reinicia tu computadora
3. Inicia Docker Desktop

### **Paso 2: Ejecutar Script**
```bash
# En PowerShell
npm run ios:docker:win

# O en Git Bash/WSL
npm run ios:docker
```

### **Paso 3: Probar la App**
1. Abre http://localhost:8081 en tu navegador
2. Descarga **Expo Go** en tu iPhone/iPad
3. Escanea el código QR desde Expo Go

---

## 🎯 **Opción 2: Expo Snack (Más Fácil)**

### **Paso 1: Instalar Expo**
```bash
npm run expo:install
```

### **Paso 2: Iniciar Expo**
```bash
npm run expo:start
```

### **Paso 3: Probar en Snack**
1. Abre https://snack.expo.dev/
2. Copia tu código a Snack
3. Prueba en el simulador web

---

## 🎯 **Opción 3: Servicios en la Nube**

### **Appetize.io (Recomendado)**
- ✅ Simulador real de iOS
- ✅ $40/mes para uso comercial
- ✅ Fácil de usar

### **BrowserStack**
- ✅ Dispositivos reales iOS
- ✅ $29/mes mínimo
- ✅ Testing automatizado

---

## 📱 **Requisitos Mínimos**

### **Para Docker:**
- Windows 10/11 Pro o Enterprise
- Docker Desktop instalado
- 8GB RAM mínimo
- 20GB espacio libre

### **Para Expo:**
- Cualquier Windows
- Node.js 18+
- Conexión a internet

### **Para Servicios en la Nube:**
- Solo conexión a internet
- Tarjeta de crédito (para servicios pagos)

---

## 🔧 **Solución de Problemas**

### **Docker no inicia:**
```bash
# Verificar que Docker Desktop esté ejecutándose
docker --version
docker info
```

### **Puertos ocupados:**
```bash
# Cambiar puertos en el script
-p 8082:8081  # Puerto alternativo
```

### **Problemas de red:**
```bash
# Verificar firewall de Windows
# Permitir Docker en el firewall
```

---

## 💡 **Consejos**

1. **Empezar con Expo** - Más fácil para principiantes
2. **Usar Docker** - Para testing más realista
3. **Considerar servicios pagos** - Para testing profesional
4. **Testear en dispositivos reales** - Para validación final

---

## 📞 **Soporte**

Si tienes problemas:
1. Verifica que Docker esté ejecutándose
2. Revisa los logs del contenedor
3. Consulta la documentación de Docker
4. Usa Expo como alternativa más fácil 