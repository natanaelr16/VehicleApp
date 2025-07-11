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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppStore } from '../stores/appStore';
import { InspectionItem } from '../types';
import { RootStackParamList } from '../components/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'InspectionForm'>;

const InspectionFormScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { 
    currentInspection, 
    updateVehicleInfo, 
    addInspectionItem, 
    updateInspectionItem,
    saveInspection,
    settings 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'vehicle' | 'inspection'>('vehicle');

  if (!currentInspection) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay inspección activa</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = () => {
    saveInspection();
    Alert.alert('Guardado', 'Inspección guardada correctamente');
  };

  const addItem = () => {
    const newItem: InspectionItem = {
      id: Date.now().toString(),
      category: 'General',
      item: '',
      status: 'good',
    };
    addInspectionItem(newItem);
  };

  const updateItem = (itemId: string, field: keyof InspectionItem, value: any) => {
    updateInspectionItem(itemId, { [field]: value });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#4CAF50';
      case 'bad': return '#F44336';
      case 'needs_attention': return '#FF9800';
      case 'not_applicable': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good': return 'Bueno';
      case 'bad': return 'Malo';
      case 'needs_attention': return 'Atención';
      case 'not_applicable': return 'N/A';
      default: return 'Pendiente';
    }
  };

  const nextStatus = (currentStatus: string) => {
    const statuses = ['good', 'needs_attention', 'bad', 'not_applicable'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  return (
    <View style={styles.container}>
      {/* Header moderno con botón de regreso */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Formulario de Inspección</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vehicle' && styles.activeTab]}
            onPress={() => setActiveTab('vehicle')}
          >
            <Text style={[styles.tabText, activeTab === 'vehicle' && styles.activeTabText]}>
              🚗 Vehículo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inspection' && styles.activeTab]}
            onPress={() => setActiveTab('inspection')}
          >
            <Text style={[styles.tabText, activeTab === 'inspection' && styles.activeTabText]}>
              🔍 Inspección
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'vehicle' ? (
          /* Tab de información del vehículo */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Información del Vehículo</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🚗 Placa</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.plate}
                onChangeText={(text) => updateVehicleInfo({ plate: text })}
                placeholder="ABC-123"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏭 Marca</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.brand}
                onChangeText={(text) => updateVehicleInfo({ brand: text })}
                placeholder="Toyota"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🚙 Modelo</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.model}
                onChangeText={(text) => updateVehicleInfo({ model: text })}
                placeholder="Corolla"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📅 Año</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.year}
                onChangeText={(text) => updateVehicleInfo({ year: text })}
                placeholder="2020"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🎨 Color</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.color}
                onChangeText={(text) => updateVehicleInfo({ color: text })}
                placeholder="Blanco"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔢 VIN</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.vin}
                onChangeText={(text) => updateVehicleInfo({ vin: text })}
                placeholder="1HGBH41JXMN109186"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>👤 Propietario</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.ownerName}
                onChangeText={(text) => updateVehicleInfo({ ownerName: text })}
                placeholder="Juan Pérez"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📞 Teléfono</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.ownerPhone}
                onChangeText={(text) => updateVehicleInfo({ ownerPhone: text })}
                placeholder="+1234567890"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        ) : (
          /* Tab de items de inspección */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔍 Items de Inspección</Text>
              <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <Text style={styles.addButtonText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>

            {currentInspection.items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  📝 No hay items de inspección
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Toca "Agregar" para crear el primer item
                </Text>
              </View>
            ) : (
              currentInspection.items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <TextInput
                      style={styles.itemInput}
                      value={item.item}
                      onChangeText={(text) => updateItem(item.id, 'item', text)}
                      placeholder="Descripción del item"
                    />
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        { backgroundColor: getStatusColor(item.status) }
                      ]}
                      onPress={() => updateItem(item.id, 'status', nextStatus(item.status))}
                    >
                      <Text style={styles.statusButtonText}>
                        {getStatusText(item.status)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TextInput
                    style={styles.notesInput}
                    value={item.notes}
                    onChangeText={(text) => updateItem(item.id, 'notes', text)}
                    placeholder="Notas adicionales (opcional)"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer moderno con botones */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Guardar Inspección</Text>
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
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    marginBottom: 20,
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
  itemCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  itemInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
  errorText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default InspectionFormScreen; 