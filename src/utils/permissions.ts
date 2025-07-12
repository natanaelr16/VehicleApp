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

export const checkCameraPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // En iOS se maneja automáticamente
  }

  try {
    // Verificar si ya tenemos el permiso de cámara
    const cameraPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );

    if (cameraPermission) {
      return true;
    }

    // Solicitar permiso de cámara
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );

    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Permiso de Cámara Requerido',
        'Para tomar fotos durante las inspecciones, la app necesita acceso a la cámara. Por favor, ve a Configuración > Aplicaciones > [Tu App] > Permisos y habilita "Cámara".',
        [
          { text: 'Entendido', style: 'default' }
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verificando permisos de cámara:', error);
    Alert.alert(
      'Error de Permisos',
      'No se pudieron verificar los permisos de cámara.',
      [{ text: 'OK', style: 'default' }]
    );
    return false;
  }
};

export const requestStoragePermissions = async (): Promise<boolean> => {
  return await checkStoragePermissions();
};

export const requestCameraPermissions = async (): Promise<boolean> => {
  return await checkCameraPermissions();
};

export const requestAllPermissions = async (): Promise<boolean> => {
  const storageGranted = await checkStoragePermissions();
  const cameraGranted = await checkCameraPermissions();
  
  return storageGranted && cameraGranted;
}; 