# 🐳 Guía para Ejecutar Vehicle App iOS en Docker

Esta guía te ayudará a ejecutar la aplicación Vehicle Inspection App en un entorno Docker para simular un dispositivo iOS.

## 📋 Prerrequisitos

1. **Docker Desktop** instalado en tu sistema
2. **docker-compose** instalado
3. Al menos **4GB de RAM** disponible
4. **Conexión a internet** para descargar las imágenes

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

```bash
# Dar permisos de ejecución al script
chmod +x run-ios-docker.sh

# Ejecutar el script
./run-ios-docker.sh
```

### Opción 2: Comandos Manuales

```bash
# Construir la imagen
docker-compose -f docker-compose.ios.yml build

# Iniciar los servicios
docker-compose -f docker-compose.ios.yml up -d

# Ver logs
docker-compose -f docker-compose.ios.yml logs -f
```

## 📱 Cómo Probar la App

### 1. En Navegador Web (Más Fácil)

1. Abre tu navegador y ve a `http://localhost:8081`
2. Verás la interfaz de Metro Bundler
3. Usa las herramientas de desarrollador (F12) para simular un dispositivo móvil:
   - Chrome: Device Toolbar (Ctrl+Shift+M)
   - Firefox: Responsive Design Mode
   - Safari: Develop > Enter Responsive Design Mode

### 2. En Dispositivo Físico

1. Instala **Expo Go** en tu dispositivo iOS desde la App Store
2. Asegúrate de que tu dispositivo esté en la misma red WiFi que tu computadora
3. Escanea el código QR que aparece en `http://localhost:8081`

### 3. En Simulador Web

La app se ejecutará en modo web, simulando la experiencia de un dispositivo móvil.

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.ios.yml logs -f vehicle-app-ios

# Detener todos los servicios
docker-compose -f docker-compose.ios.yml down

# Reiniciar servicios
docker-compose -f docker-compose.ios.yml restart

# Reconstruir imagen (si hay cambios)
docker-compose -f docker-compose.ios.yml build --no-cache

# Entrar al contenedor
docker exec -it vehicle-app-ios bash
```

## 🛠️ Solución de Problemas

### Error: Puerto 8081 ya está en uso
```bash
# Encuentra el proceso que usa el puerto
lsof -i :8081

# Mata el proceso
kill -9 <PID>

# O cambia el puerto en docker-compose.ios.yml
```

### Error: No se puede conectar al Metro Bundler
1. Verifica que Docker esté ejecutándose
2. Asegúrate de que los puertos 8081 y 9222 estén libres
3. Reinicia los servicios: `docker-compose -f docker-compose.ios.yml restart`

### Error: La app no carga
1. Verifica los logs: `docker-compose -f docker-compose.ios.yml logs vehicle-app-ios`
2. Asegúrate de que todas las dependencias estén instaladas
3. Reconstruye la imagen: `docker-compose -f docker-compose.ios.yml build --no-cache`

## 📊 Monitoreo

### Ver uso de recursos
```bash
# Ver estadísticas de los contenedores
docker stats

# Ver logs específicos
docker-compose -f docker-compose.ios.yml logs vehicle-app-ios
```

### Limpiar recursos
```bash
# Eliminar contenedores no utilizados
docker container prune

# Eliminar imágenes no utilizadas
docker image prune

# Limpieza completa
docker system prune -a
```

## 🔄 Desarrollo

### Hacer cambios en el código
1. Los cambios en el código se reflejarán automáticamente gracias a los volúmenes montados
2. Si agregas nuevas dependencias, reinicia los servicios:
   ```bash
   docker-compose -f docker-compose.ios.yml restart
   ```

### Agregar nuevas dependencias
1. Agrega la dependencia a `package.json`
2. Reconstruye la imagen:
   ```bash
   docker-compose -f docker-compose.ios.yml build --no-cache
   docker-compose -f docker-compose.ios.yml up -d
   ```

## 🎯 Características del Entorno Docker

- ✅ **Metro Bundler** ejecutándose en puerto 8081
- ✅ **Hot Reload** habilitado
- ✅ **Debug port** disponible en puerto 9222
- ✅ **Volúmenes montados** para desarrollo en tiempo real
- ✅ **Red aislada** para los servicios
- ✅ **Logs centralizados** para debugging

## 📞 Soporte

Si encuentras problemas:

1. Verifica que Docker Desktop esté ejecutándose
2. Asegúrate de tener suficiente RAM disponible
3. Revisa los logs para identificar errores específicos
4. Considera reiniciar Docker Desktop si hay problemas de conectividad

## 🎉 ¡Listo!

Tu app Vehicle Inspection App ahora está ejecutándose en Docker y lista para ser probada en un entorno que simula un dispositivo iOS. 