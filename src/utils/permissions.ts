import { Platform, PermissionsAndroid, Alert } from 'react-native';

export const checkStoragePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // En iOS no necesitamos estos permisos
  }

  try {
    // Verificar si ya tenemos los permisos
    const writePermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    const readPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );

    if (writePermission && readPermission) {
      return true;
    }

    // Solicitar permisos si no los tenemos
    const permissions = [
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ];

    const results = await PermissionsAndroid.requestMultiple(permissions);
    
    const allGranted = Object.values(results).every(
      result => result === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      Alert.alert(
        'Permisos Requeridos',
        'Para generar PDFs, la app necesita acceso al almacenamiento. Por favor, ve a Configuración > Aplicaciones > [Tu App] > Permisos y habilita "Almacenamiento".',
        [
          { text: 'Entendido', style: 'default' }
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verificando permisos:', error);
    Alert.alert(
      'Error de Permisos',
      'No se pudieron verificar los permisos de almacenamiento.',
      [{ text: 'OK', style: 'default' }]
    );
    return false;
  }
};

export const requestStoragePermissions = async (): Promise<boolean> => {
  return await checkStoragePermissions();
}; 