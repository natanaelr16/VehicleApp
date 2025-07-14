# Ubicación de los PDFs Generados

## Configuración de Almacenamiento

Los PDFs generados por la aplicación se guardan en diferentes ubicaciones dependiendo de la plataforma:

### Android
- **Directorio**: `Documents`
- **Ruta completa**: `/storage/emulated/0/Android/data/com.vehicleinspectionapp/files/Documents/`
- **Ejemplo**: `/storage/emulated/0/Android/data/com.vehicleinspectionapp/files/Documents/MTinspector_MXT897_2025-07-12.pdf`

### iOS
- **Directorio**: `Download`
- **Ruta completa**: `[App Sandbox]/Documents/Download/`
- **Ejemplo**: `/var/mobile/Containers/Data/Application/[APP_ID]/Documents/Download/MTinspector_MXT897_2025-07-12.pdf`

## Configuración en el Código

La configuración se encuentra en `src/utils/pdfGenerator.ts`:

```typescript
const options = {
  html: htmlContent,
  fileName: `MTinspector_${inspection.vehicleInfo.plate || 'Vehiculo'}_${new Date().toISOString().split('T')[0]}`,
  directory: Platform.OS === 'android' ? 'Documents' : 'Download',
  base64: false,
};
```

## Convención de Nombres

Los archivos PDF se nombran siguiendo este patrón:
```
MTinspector_[PLACA]_[FECHA].pdf
```

**Ejemplos**:
- `MTinspector_MXT897_2025-07-12.pdf`
- `MTinspector_ABC123_2025-01-15.pdf`
- `MTinspector_Vehiculo_2025-01-20.pdf` (cuando no hay placa)

## Acceso a los Archivos

### Android
1. **Desde el dispositivo**:
   - Usar un explorador de archivos como "Files" o "My Files"
   - Navegar a: `Internal Storage > Android > data > com.vehicleinspectionapp > files > Documents`

2. **Desde ADB** (desarrollo):
   ```bash
   adb shell ls /storage/emulated/0/Android/data/com.vehicleinspectionapp/files/Documents/
   ```

3. **Desde la aplicación**:
   - Los PDFs se pueden abrir directamente desde la app
   - Se muestran en la pantalla de vista previa del reporte

### iOS
1. **Desde el dispositivo**:
   - Usar la app "Files"
   - Navegar a: `On My iPhone/iPad > [App Name] > Documents > Download`

2. **Desde Xcode** (desarrollo):
   - Usar el Device Manager para acceder a los archivos de la app

## Permisos Requeridos

### Android
La aplicación solicita automáticamente los permisos necesarios:
- `WRITE_EXTERNAL_STORAGE`
- `READ_EXTERNAL_STORAGE`

```typescript
const permissions = [
  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
];
```

### iOS
No se requieren permisos especiales ya que los archivos se guardan en el sandbox de la aplicación.

## Verificación de Archivos

### En el Código
La aplicación verifica que el archivo se haya creado correctamente:

```typescript
if (file.filePath) {
  console.log('PDF generado exitosamente en:', file.filePath);
  return file.filePath;
} else {
  console.error('No se obtuvo filePath del resultado:', file);
  throw new Error('No se pudo generar el archivo PDF');
}
```

### En la Consola
Los logs muestran la ruta exacta donde se guardó el archivo:
```
PDF generado exitosamente en: /storage/emulated/0/Android/data/com.vehicleinspectionapp/files/Documents/MTinspector_MXT897_2025-07-12.pdf
```

## Funcionalidades de la App

### Vista Previa
- Los PDFs se pueden previsualizar directamente en la aplicación
- Se usa `react-native-file-viewer` para abrir los archivos

### Compartir
- Los PDFs se pueden compartir desde la aplicación
- Se usa `react-native-share` para enviar por email, WhatsApp, etc.

### Gestión
- Los archivos se mantienen en el almacenamiento local
- No se eliminan automáticamente (se mantienen hasta que el usuario los elimine manualmente)

## Solución de Problemas

### Archivo no encontrado
Si el archivo no aparece en la ubicación esperada:

1. **Verificar permisos**: Asegurarse de que la app tiene permisos de almacenamiento
2. **Revisar logs**: Buscar el mensaje "PDF generado exitosamente en:" en la consola
3. **Verificar espacio**: Asegurarse de que hay suficiente espacio en el dispositivo

### Error de permisos
Si hay problemas con los permisos:

1. **Android**: Ir a Configuración > Apps > [App Name] > Permisos > Almacenamiento
2. **iOS**: Los permisos se manejan automáticamente en el sandbox

## Notas Importantes

- Los archivos se guardan en el almacenamiento interno de la aplicación
- En Android, esto significa que los archivos NO se eliminan al desinstalar la app
- En iOS, los archivos se eliminan al desinstalar la app
- Se recomienda hacer copias de seguridad de los PDFs importantes 