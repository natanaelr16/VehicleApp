import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import { Picker } from '@react-native-picker/picker';
import VehicleHistoryForm from '../components/VehicleHistoryForm';
import PlacaSearch from '../components/PlacaSearch';


const InspectionFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    currentInspection, 
    updateVehicleInfo, 
    addInspectionItem, 
    updateInspectionItem,
    saveInspection,
    settings 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'vehicle' | 'history' | 'inspection'>('vehicle');
  const [bodyType, setBodyType] = useState(currentInspection?.vehicleInfo.bodyType || 'sedan');
  const scrollViewRef = useRef<ScrollView>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  // Scroll automático al nuevo item agregado (que ahora está al inicio)
  useEffect(() => {
    if (lastAddedItemId && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
      setLastAddedItemId(null);
    }
  }, [lastAddedItemId]);

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

  // Función para verificar si un item ya existe (ignorando mayúsculas/minúsculas)
  const isItemDuplicate = (itemName: string, excludeId?: string): boolean => {
    return currentInspection.items.some(item => 
      item.id !== excludeId && 
      item.item.toLowerCase().trim() === itemName.toLowerCase().trim()
    );
  };

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      category: 'General',
      item: '',
      status: 'good' as const,
    };
    addInspectionItem(newItem);
    setLastAddedItemId(newItem.id);
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Eliminar Item',
      '¿Estás seguro de que quieres eliminar este item de inspección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            const { removeInspectionItem } = useAppStore.getState();
            removeInspectionItem(itemId);
          }
        },
      ]
    );
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    updateInspectionItem(itemId, { [field]: value });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#4CAF50';
      case 'bad': return '#FF0000';
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
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              📋 RUNT
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

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'vehicle' ? (
          /* Tab de información del vehículo */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Información del Vehículo</Text>
            
            {/* Componente de búsqueda por placa */}
            <PlacaSearch 
              onSuccess={() => {
                // Opcional: mostrar mensaje de éxito o navegar a otra pestaña
                console.log('Información del vehículo cargada exitosamente');
              }}
            />
            
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Carrocería</Text>
              <Picker
                selectedValue={bodyType}
                onValueChange={(itemValue) => {
                  setBodyType(itemValue);
                  updateVehicleInfo({ bodyType: itemValue });
                }}
                style={styles.picker}
              >
                <Picker.Item label="Sedán" value="sedan" />
                <Picker.Item label="SUV" value="suv" />
                <Picker.Item label="Pickup" value="pickup" />
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.bodyInspectionButton}
              onPress={() => (navigation as any).navigate('BodyInspection', { vehicleType: bodyType })}
            >
              <Text style={styles.bodyInspectionButtonText}>🚗 Inspección de Carrocería</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'history' ? (
          <VehicleHistoryForm />
        ) : (
          /* Tab de items de inspección */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔧 Partes y Accesorios</Text>
              <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <Text style={styles.addButtonText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>

            {currentInspection.items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  🔧 No hay partes y accesorios registrados
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Toca "Agregar" para crear el primer elemento
                </Text>
              </View>
            ) : (
              currentInspection.items.map((item: any) => {
                const isDuplicate = isItemDuplicate(item.item, item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => removeItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInputContainer}>
                        <TextInput
                          style={[
                            styles.itemInput,
                            isDuplicate && styles.itemInputError
                          ]}
                          value={item.item}
                          onChangeText={(text) => updateItem(item.id, 'item', text)}
                          placeholder="Descripción del item"
                          onPressIn={(e) => e.stopPropagation()}
                        />
                        {isDuplicate && (
                          <Text style={styles.duplicateWarning}>
                            ⚠️ Item duplicado
                          </Text>
                        )}
                      </View>
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={[
                            styles.statusButton,
                            { backgroundColor: getStatusColor(item.status) }
                          ]}
                          onPress={() => updateItem(item.id, 'status', nextStatus(item.status))}
                          onPressIn={(e) => e.stopPropagation()}
                        >
                          <Text style={styles.statusButtonText}>
                            {getStatusText(item.status)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <TextInput
                      style={styles.notesInput}
                      value={item.notes}
                      onChangeText={(text) => updateItem(item.id, 'notes', text)}
                      placeholder="Notas adicionales (opcional)"
                      multiline
                      numberOfLines={2}
                      onPressIn={(e) => e.stopPropagation()}
                    />
                    

                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer moderno con botones */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.previewButton} 
          onPress={() => (navigation as any).navigate('ReportPreview')}
        >
          <Text style={styles.previewButtonText}>📄 Vista Previa</Text>
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  backButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 2,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: '#FF0000',
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
    backgroundColor: '#FF0000',
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
    flexDirection: 'row',
    gap: 15,
  },
  saveButton: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 100,
  },
  bodyInspectionButton: {
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  bodyInspectionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  picker: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    marginTop: 2,
    height: 36,
    minHeight: 36,
    maxHeight: 38,
    justifyContent: 'center',
  },
  itemInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemInputError: {
    borderColor: '#FF0000',
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
  },
  duplicateWarning: {
    color: '#FF0000',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

});

export default InspectionFormScreen; 