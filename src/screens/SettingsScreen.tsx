import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { requestStoragePermissions } from '../utils/permissions';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useAppStore();
  
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    Alert.alert('✅ Configuración Guardada', 'Los cambios han sido aplicados correctamente.');
  };

  const updateLocalSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    return await requestStoragePermissions();
  };

  const selectLogo = async () => {
    console.log('Iniciando selección de logo...');
    
    // Verificar permisos de almacenamiento
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      return;
    }
    
    // Opciones optimizadas para logo de empresa en PDF
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 300,
      maxWidth: 400,
      quality: 0.9 as PhotoQuality,
      selectionLimit: 1,
    };

    console.log('Lanzando galería con opciones:', options);

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      console.log('Respuesta completa de selección de logo:', JSON.stringify(response, null, 2));
      
      if (response.didCancel) {
        console.log('Usuario canceló la selección de logo');
        Alert.alert('Cancelado', 'No se seleccionó ninguna imagen.');
      } else if (response.errorCode) {
        console.error('Error en selección de logo:', response.errorMessage);
        Alert.alert('Error', `Error al seleccionar imagen: ${response.errorMessage}`);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        console.log('Asset seleccionado:', JSON.stringify(asset, null, 2));
        
        if (asset.uri) {
          console.log('URI de la imagen:', asset.uri);
          updateLocalSetting('companyLogo', asset.uri);
          Alert.alert('✅ Logo Actualizado', 'El logo de la empresa ha sido actualizado correctamente.');
        } else {
          console.error('No se encontró URI en el asset');
          Alert.alert('Error', 'No se pudo obtener la URI de la imagen seleccionada.');
        }
      } else {
        console.error('No se encontraron assets en la respuesta');
        Alert.alert('Error', 'No se seleccionó ninguna imagen válida.');
      }
    });
  };

  const selectWatermark = async () => {
    console.log('Iniciando selección de marca de agua...');
    
    // Verificar permisos de almacenamiento
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      return;
    }
    
    // Opciones optimizadas para marca de agua en PDF
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 600,
      maxWidth: 800,
      quality: 0.8 as PhotoQuality,
      selectionLimit: 1,
    };

    console.log('Lanzando galería para marca de agua con opciones:', options);

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      console.log('Respuesta completa de selección de marca de agua:', JSON.stringify(response, null, 2));
      
      if (response.didCancel) {
        console.log('Usuario canceló la selección de marca de agua');
        Alert.alert('Cancelado', 'No se seleccionó ninguna imagen.');
      } else if (response.errorCode) {
        console.error('Error en selección de marca de agua:', response.errorMessage);
        Alert.alert('Error', `Error al seleccionar imagen: ${response.errorMessage}`);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        console.log('Asset seleccionado:', JSON.stringify(asset, null, 2));
        
        if (asset.uri) {
          console.log('URI de la imagen:', asset.uri);
          updateLocalSetting('watermarkLogo', asset.uri);
          Alert.alert('✅ Marca de Agua Actualizada', 'La marca de agua ha sido actualizada correctamente.');
        } else {
          console.error('No se encontró URI en el asset');
          Alert.alert('Error', 'No se pudo obtener la URI de la imagen seleccionada.');
        }
      } else {
        console.error('No se encontraron assets en la respuesta');
        Alert.alert('Error', 'No se seleccionó ninguna imagen válida.');
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Configuración</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información de la Empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Información de la Empresa</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la Empresa</Text>
            <TextInput
              style={styles.input}
              value={localSettings.companyName}
              onChangeText={(text) => updateLocalSetting('companyName', text)}
              placeholder="Mi Empresa de Inspecciones"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={localSettings.companyAddress}
              onChangeText={(text) => updateLocalSetting('companyAddress', text)}
              placeholder="Calle 123 #45-67, Bogotá"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={localSettings.companyPhone}
              onChangeText={(text) => updateLocalSetting('companyPhone', text)}
              placeholder="+57 1 234 5678"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={localSettings.companyEmail}
              onChangeText={(text) => updateLocalSetting('companyEmail', text)}
              placeholder="contacto@miempresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Logos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🖼️ Logos y Marca de Agua</Text>
          
          <View style={styles.logoSection}>
            <Text style={styles.label}>Logo de la Empresa</Text>
            <View style={styles.logoContainer}>
              <TouchableOpacity style={styles.logoButton} onPress={selectLogo}>
                {localSettings.companyLogo ? (
                  <View style={styles.logoPreviewContainer}>
                    <Image source={{ uri: localSettings.companyLogo }} style={styles.logoPreview} />
                    <Text style={styles.logoPreviewText}>Logo actual</Text>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoPlaceholderText}>+ Seleccionar Logo</Text>
                    <Text style={styles.logoPlaceholderSubtext}>PNG, JPG - 400x300px máx</Text>
                  </View>
                )}
              </TouchableOpacity>
              {localSettings.companyLogo && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => updateLocalSetting('companyLogo', '')}
                >
                  <Text style={styles.removeButtonText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.helpText}>
              📱 Este logo aparecerá en la página principal de la app{'\n'}
              📏 Tamaño recomendado: 400x300px máximo{'\n'}
              ⚫ Se recomienda usar imágenes con fondo negro{'\n'}
              💡 Toca "Seleccionar Logo" para elegir una imagen de tu galería
            </Text>
            
            {/* Eliminar botones de prueba para verificar funcionalidad */}
          </View>

          <View style={styles.logoSection}>
            <Text style={styles.label}>Marca de Agua</Text>
            <View style={styles.logoContainer}>
              <TouchableOpacity style={styles.logoButton} onPress={selectWatermark}>
                {localSettings.watermarkLogo ? (
                  <View style={styles.logoPreviewContainer}>
                    <Image source={{ uri: localSettings.watermarkLogo }} style={styles.logoPreview} />
                    <Text style={styles.logoPreviewText}>Marca de agua actual</Text>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoPlaceholderText}>+ Seleccionar Marca de Agua</Text>
                    <Text style={styles.logoPlaceholderSubtext}>PNG, JPG - 800x600px máx</Text>
                  </View>
                )}
              </TouchableOpacity>
              {localSettings.watermarkLogo && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => updateLocalSetting('watermarkLogo', '')}
                >
                  <Text style={styles.removeButtonText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.helpText}>
              💧 Esta imagen aparecerá como marca de agua en el centro de cada página del PDF{'\n'}
              📏 Tamaño recomendado: 800x600px máximo{'\n'}
              🎨 Se recomienda usar imágenes con fondo transparente (PNG)
            </Text>
          </View>
        </View>

        {/* Inspector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Inspector</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Inspector</Text>
            <TextInput
              style={styles.input}
              value={localSettings.inspectorName}
              onChangeText={(text) => updateLocalSetting('inspectorName', text)}
              placeholder="Juan Pérez"
            />
          </View>
        </View>

        {/* Bloque final: logo, leyenda, versión, marca y botón guardar */}
        <View style={{ alignItems: 'center', marginTop: 48, marginBottom: 32 }}>
          <Image source={require('../../assets/innovare_logo.png')} style={{ width: 300, height: 150, marginBottom: 10, resizeMode: 'contain' }} />
          <Text style={{ color: '#bbb', fontSize: 14, marginBottom: 2, marginTop: 2, textAlign: 'center' }}>
            App de inspección vehicular profesional
          </Text>
          <Text style={{ color: '#bbb', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
            v1.0.0
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Text style={{ fontWeight: 'bold', color: '#888', fontSize: 15, marginRight: 8 }}>
              Innovare by NRE
            </Text>
            <Text style={{ color: '#bbb', fontSize: 13 }}>
              © 2025
            </Text>
          </View>
          <TouchableOpacity style={[styles.saveButton, { marginTop: 32 }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 Guardar Configuración</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoSection: {
    marginBottom: 25,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 15,
  },
  logoButton: {
    flex: 1,
  },
  logoButtonDisabled: {
    opacity: 0.6,
  },

  logoPreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  logoPlaceholder: {
    width: 120,
    height: 80,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#6c757d',
    fontSize: 12,
    textAlign: 'center',
  },
  logoPlaceholderSubtext: {
    color: '#adb5bd',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  logoPreviewContainer: {
    alignItems: 'center',
  },
  logoPreviewText: {
    color: '#28a745',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  removeButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
    fontStyle: 'italic',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    backgroundColor: 'white',
  },
  radioButtonActive: {
    borderColor: '#FF0000',
    backgroundColor: '#FF0000',
  },
  radioButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  radioButtonTextActive: {
    color: 'white',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen; 