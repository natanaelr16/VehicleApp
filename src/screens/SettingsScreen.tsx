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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useAppStore();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [showWatermarkPicker, setShowWatermarkPicker] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    Alert.alert('✅ Configuración Guardada', 'Los cambios han sido aplicados correctamente.');
  };

  const updateLocalSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const selectLogo = () => {
    // TODO: Implementar selección de imagen
    Alert.alert('Seleccionar Logo', 'Funcionalidad de selección de imagen próximamente disponible.');
  };

  const selectWatermark = () => {
    // TODO: Implementar selección de imagen
    Alert.alert('Seleccionar Marca de Agua', 'Funcionalidad de selección de imagen próximamente disponible.');
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
            <TouchableOpacity style={styles.logoButton} onPress={selectLogo}>
              {localSettings.companyLogo ? (
                <Image source={{ uri: localSettings.companyLogo }} style={styles.logoPreview} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>+ Seleccionar Logo</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.helpText}>Este logo aparecerá en el encabezado de los reportes</Text>
          </View>

          <View style={styles.logoSection}>
            <Text style={styles.label}>Marca de Agua</Text>
            <TouchableOpacity style={styles.logoButton} onPress={selectWatermark}>
              {localSettings.watermarkLogo ? (
                <Image source={{ uri: localSettings.watermarkLogo }} style={styles.logoPreview} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>+ Seleccionar Marca de Agua</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.helpText}>Esta imagen aparecerá como marca de agua en los PDFs</Text>
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

        {/* Configuración de Reportes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Configuración de Reportes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Formato de Reporte</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  localSettings.reportTemplate === 'colombia' && styles.radioButtonActive
                ]}
                onPress={() => updateLocalSetting('reportTemplate', 'colombia')}
              >
                <Text style={[
                  styles.radioButtonText,
                  localSettings.reportTemplate === 'colombia' && styles.radioButtonTextActive
                ]}>
                  🇨🇴 Formato Colombia
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  localSettings.reportTemplate === 'general' && styles.radioButtonActive
                ]}
                onPress={() => updateLocalSetting('reportTemplate', 'general')}
              >
                <Text style={[
                  styles.radioButtonText,
                  localSettings.reportTemplate === 'general' && styles.radioButtonTextActive
                ]}>
                  🌍 Formato General
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Guardado Automático</Text>
            <Switch
              value={localSettings.autoSave}
              onValueChange={(value) => updateLocalSetting('autoSave', value)}
              trackColor={{ false: '#767577', true: '#FF0000' }}
              thumbColor={localSettings.autoSave ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Calidad de Fotos</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  localSettings.photoQuality === 'low' && styles.radioButtonActive
                ]}
                onPress={() => updateLocalSetting('photoQuality', 'low')}
              >
                <Text style={[
                  styles.radioButtonText,
                  localSettings.photoQuality === 'low' && styles.radioButtonTextActive
                ]}>
                  Baja
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  localSettings.photoQuality === 'medium' && styles.radioButtonActive
                ]}
                onPress={() => updateLocalSetting('photoQuality', 'medium')}
              >
                <Text style={[
                  styles.radioButtonText,
                  localSettings.photoQuality === 'medium' && styles.radioButtonTextActive
                ]}>
                  Media
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  localSettings.photoQuality === 'high' && styles.radioButtonActive
                ]}
                onPress={() => updateLocalSetting('photoQuality', 'high')}
              >
                <Text style={[
                  styles.radioButtonText,
                  localSettings.photoQuality === 'high' && styles.radioButtonTextActive
                ]}>
                  Alta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notas Predeterminadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notas Predeterminadas</Text>
          <Text style={styles.helpText}>
            Estas notas estarán disponibles como opciones rápidas durante la inspección
          </Text>
          
          {localSettings.defaultNotes.map((note, index) => (
            <View key={index} style={styles.inputGroup}>
              <Text style={styles.label}>Nota {index + 1}</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={(text) => {
                  const newNotes = [...localSettings.defaultNotes];
                  newNotes[index] = text;
                  updateLocalSetting('defaultNotes', newNotes);
                }}
                placeholder="Ej: En buen estado"
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Guardar Configuración</Text>
        </TouchableOpacity>
      </View>
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
  logoButton: {
    marginTop: 10,
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