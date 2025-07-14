import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../components/AppNavigator';
import { useAppStore } from '../stores/appStore';
import { Picker } from '@react-native-picker/picker';
import { VehicleHistoryMenuTabs, VehicleHistoryTabContent } from '../components/VehicleHistoryForm';
import DateTimePicker from '@react-native-community/datetimepicker';


const InspectionFormScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { 
    currentInspection, 
    updateVehicleInfo, 
    addInspectionItem, 
    updateInspectionItem,
    saveInspection,
    settings,
    updateFechaIngreso,
    updateHoraIngreso,
    updateSugerenciasDiagnostico,
    updatePrecioSugerido,
    updateResultadoInspeccion,
    setCurrentInspection
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'vehicle' | 'history' | 'inspection'>('vehicle');
  const [bodyType, setBodyType] = useState(currentInspection?.vehicleInfo.bodyType || 'sedan');
  const [showBodyTypeModal, setShowBodyTypeModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [runtAnim] = useState(new Animated.Value(0));
  const [runtTab, setRuntTab] = useState<'basic' | 'taxes' | 'documents'>('basic');
  const [showRuntMenu, setShowRuntMenu] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);


  // Scroll automático al nuevo item agregado (que ahora está al inicio)
  useEffect(() => {
    if (lastAddedItemId && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
      setLastAddedItemId(null);
    }
  }, [lastAddedItemId]);

  useEffect(() => {
    if (activeTab === 'history') {
      setShowRuntMenu(true);
      Animated.timing(runtAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else if (showRuntMenu) {
      Animated.timing(runtAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowRuntMenu(false));
    }
  }, [activeTab]);

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

  // Funciones para abrir selectores y actualizar
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const fecha = `${pad(selectedDate.getDate())}/${pad(selectedDate.getMonth() + 1)}/${selectedDate.getFullYear()}`;
      updateFechaIngreso(fecha);
    }
  };
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const hora = `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`;
      updateHoraIngreso(hora);
    }
  };

  const handleVehiclePhoto = () => {
    setShowPhotoOptions(true);
  };

  const takePhoto = () => {
    setShowPhotoOptions(false);
    launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
    }, (response) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          updateVehicleInfo({ vehiclePhoto: asset.uri });
        }
      }
    });
  };

  const selectFromGallery = () => {
    setShowPhotoOptions(false);
    launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
    }, (response) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          updateVehicleInfo({ vehiclePhoto: asset.uri });
        }
      }
    });
  };

  // Definir el listado fijo agrupado
  const inspectionGroups = [
    {
      title: 'Luces y Exterior',
      items: [
        'Luz Placa trasera', 'Luces altas', 'Luces bajas', 'Luces medias',
        'Direccional del Der', 'Direccional Del Izq', 'Luces Freno', 'Luces reversa',
        'Stop derecho', 'Stop izquiero', 'Tercer Stop', 'Exploradora derecha',
        'Exploradora izquierda', 'Farola derecha', 'Farola izquiera',
        'Puntas Chasis del Der', 'Puntas Chasis del Izq', 'Puntas Chasis tras Der', 'Puntas Chasis tras Izq',
      ]
    },
    {
      title: 'Motor y Soportes',
      items: [
        'Base Motor Der', 'Base Motor Izq', 'Fugas Aceite Motor', 'Fugas Aceite caja transmsion'
      ]
    },
    {
      title: 'Interior del Vehículo',
      items: [
        'Consola', 'Radio', 'Guantera', 'Cojineria', 'Forros', 'Tapetes', 'Visera',
        'Descansabrazos', 'Reposa cabezas', 'Sunroof', 'Antena',
        'Elevavidrios delanteross', 'Elevavidrios traseros'
      ]
    }
  ];

  // Mapeo visual <-> store
  const estadoVisualToStore = (estado: string) => {
    switch (estado) {
      case 'Bueno': return 'good';
      case 'Regular': return 'needs_attention';
      case 'Malo': return 'bad';
      case 'N/A': return 'not_applicable';
      default: return 'not_applicable';
    }
  };
  const estadoStoreToVisual = (estado: string) => {
    switch (estado) {
      case 'good': return 'Bueno';
      case 'needs_attention': return 'Regular';
      case 'bad': return 'Malo';
      case 'not_applicable': return 'N/A';
      default: return '';
    }
  };

  // Estado local para los resultados de inspección
  const [fixedItems, setFixedItems] = useState(() => {
    const initial: Record<string, { estado: string; observaciones: string }> = {};
    inspectionGroups.forEach(group => {
      group.items.forEach(item => {
        const found = currentInspection?.items?.find(i => i.item === item);
        initial[item] = found ? { estado: estadoStoreToVisual(found.status || ''), observaciones: found.notes || '' } : { estado: '', observaciones: '' };
      });
    });
    return initial;
  });

  const handleFixedItemChange = (item: string, field: 'estado' | 'observaciones', value: string) => {
    setFixedItems(prev => {
      const updated = { ...prev, [item]: { ...prev[item], [field]: value } };
      // Actualizar en el store
      const itemsArray = Object.entries(updated).map(([itemName, data]) => ({
        id: itemName,
        category: '',
        item: itemName,
        status: estadoVisualToStore(data.estado) as 'good' | 'bad' | 'needs_attention' | 'not_applicable',
        notes: data.observaciones
      }));
      if (currentInspection) {
        setCurrentInspection({ ...currentInspection, items: itemsArray });
      }
      return updated;
    });
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Información del Vehículo</Text>
              <TouchableOpacity onPress={handleVehiclePhoto} style={styles.photoButton}>
                <Text style={styles.photoButtonText}>📷</Text>
              </TouchableOpacity>
            </View>

            {/* Foto del vehículo */}
            {currentInspection.vehicleInfo.vehiclePhoto && (
              <View style={styles.vehiclePhotoContainer}>
                <Image 
                  source={{ uri: currentInspection.vehicleInfo.vehiclePhoto }} 
                  style={styles.vehiclePhoto}
                  resizeMode="cover"
                />
              </View>
            )}



            {/* Campos de fecha y hora de ingreso */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Ingreso</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={currentInspection.fechaIngreso || ''}
                  editable={false}
                  placeholder="DD/MM/AAAA"
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginLeft: 8 }}>
                  <Text style={{ fontSize: 22 }}>📅</Text>
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hora de Ingreso</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={currentInspection.horaIngreso || ''}
                  editable={false}
                  placeholder="HH:MM"
                />
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ marginLeft: 8 }}>
                  <Text style={{ fontSize: 22 }}>⏰</Text>
                </TouchableOpacity>
              </View>
              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                  is24Hour={true}
                />
              )}
            </View>

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

            {/* Eliminar campo VIN */}
            {/* <View style={styles.inputGroup}>
              <Text style={styles.label}>🔢 VIN</Text>
              <TextInput
                style={styles.input}
                value={currentInspection.vehicleInfo.vin}
                onChangeText={(text) => updateVehicleInfo({ vin: text })}
                placeholder="1HGBH41JXMN109186"
                autoCapitalize="characters"
              />
            </View> */}

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
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowBodyTypeModal(true)}
              >
                <Text style={styles.pickerText}>
                  {bodyType === 'sedan' ? 'Sedán' : bodyType === 'suv' ? 'SUV' : 'Pickup'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.bodyInspectionButton}
              onPress={() => (navigation as any).navigate('BodyInspection', { vehicleType: bodyType })}
            >
              <Text style={styles.bodyInspectionButtonText}>🚗 Inspección de Carrocería</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tireInspectionButton}
              onPress={() => (navigation as any).navigate('TireInspection', { vehicleType: bodyType })}
            >
              <Text style={styles.tireInspectionButtonText}>Inspección de ruedas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoInspectionButton}
              onPress={() => (navigation as any).navigate('PhotoInspection')}
            >
              <Text style={styles.photoInspectionButtonText}>📸 Inspección Fotográfica</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'history' || showRuntMenu ? (
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{
                opacity: runtAnim,
                transform: [
                  {
                    translateY: runtAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 0],
                    }),
                  },
                ],
              }}
            >
              <VehicleHistoryMenuTabs activeTab={runtTab} setActiveTab={setRuntTab} />
            </Animated.View>
            <View style={{ flex: 1, marginTop: 10 }}>
              <VehicleHistoryTabContent activeTab={runtTab} />
            </View>
          </View>
        ) : (
          /* Tab de items de inspección */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔧 Partes y Accesorios</Text>
              {/* Eliminar botones de agregar/quitar ítems */}
            </View>

            {/* En la pestaña de inspección, mostrar el listado fijo agrupado */}
            {activeTab === 'inspection' && (
              <View style={styles.section}>
                {inspectionGroups.map((group, groupIndex) => (
                  <View key={group.title} style={{ marginBottom: 24 }}>
                    <View style={{
                      backgroundColor: groupIndex < 2 ? '#FF0000' : '#f0f0f0',
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 12
                    }}>
                      <Text style={{ 
                        fontWeight: 'bold', 
                        fontSize: 16,
                        color: groupIndex < 2 ? 'white' : '#333',
                        textAlign: 'justify'
                      }}>{group.title}</Text>
                    </View>
                    {group.items.map((item, itemIndex) => (
                      <View key={item} style={{ 
                        marginBottom: 12, 
                        backgroundColor: itemIndex % 2 === 0 ? '#f8f9fa' : '#ffffff', 
                        borderRadius: 8, 
                        padding: 16,
                        borderLeftWidth: 4,
                        borderLeftColor: groupIndex < 2 ? '#FF0000' : '#007bff',
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        marginHorizontal: -8
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#2c3e50' }}>{item}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                          {['Bueno', 'Regular', 'Malo', 'N/A'].map(estado => {
                            let bgColor = '#fff';
                            if (fixedItems[item]?.estado === estado) {
                              if (estado === 'Bueno') bgColor = '#4CAF50'; // verde
                              else if (estado === 'Regular') bgColor = '#FFEB3B'; // amarillo
                              else if (estado === 'Malo') bgColor = '#FF0000'; // rojo
                              else if (estado === 'N/A') bgColor = '#9E9E9E'; // gris
                              else bgColor = '#fff'; // blanco para vacío
                            }
                            return (
                              <TouchableOpacity
                                key={estado}
                                style={{
                                  backgroundColor: bgColor,
                                  paddingHorizontal: 8,
                                  paddingVertical: 6,
                                  borderRadius: 12,
                                  marginRight: 4,
                                  borderWidth: fixedItems[item]?.estado === estado ? 2 : 1,
                                  borderColor: fixedItems[item]?.estado === estado ? '#333' : '#ccc',
                                  flex: 1,
                                  alignItems: 'center'
                                }}
                                onPress={() => handleFixedItemChange(item, 'estado', estado)}
                              >
                                <Text style={{
                                  color: estado === 'Regular' && fixedItems[item]?.estado === estado ? '#333' : (fixedItems[item]?.estado === estado ? 'white' : '#333'),
                                  fontWeight: 'bold',
                                  fontSize: 11
                                }}>{estado}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <TextInput
                          style={{ 
                            backgroundColor: 'white', 
                            borderWidth: 1, 
                            borderColor: '#e8e8e8', 
                            borderRadius: 8, 
                            padding: 10, 
                            fontSize: 14,
                            minHeight: 40
                          }}
                          value={fixedItems[item]?.observaciones || ''}
                          onChangeText={text => handleFixedItemChange(item, 'observaciones', text)}
                          placeholder="Observaciones (opcional)"
                          multiline
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'inspection' && (
          <TouchableOpacity
            style={{
              backgroundColor: '#FF0000',
              padding: 20,
              borderRadius: 16,
              alignItems: 'center',
              margin: 24,
              marginTop: 40,
              elevation: 4,
            }}
            onPress={() => navigation.navigate('DiagnosisSuggestions')}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              Finalizar inspección y agregar sugerencias de diagnóstico
            </Text>
          </TouchableOpacity>
        )}

        {/* Eliminar la sección de sugerencias de diagnóstico, precio sugerido y selector de aprobado/no aprobado del formulario principal. */}
      </ScrollView>

      {/* Modal para selección de tipo de carrocería */}
      <Modal
        visible={showBodyTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBodyTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBodyTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Tipo de Carrocería</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setBodyType('sedan');
                updateVehicleInfo({ bodyType: 'sedan' });
                setShowBodyTypeModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Sedán</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setBodyType('suv');
                updateVehicleInfo({ bodyType: 'suv' });
                setShowBodyTypeModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>SUV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setBodyType('pickup');
                updateVehicleInfo({ bodyType: 'pickup' });
                setShowBodyTypeModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Pickup</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de opciones de foto */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <View style={styles.photoOptionsModal}>
          <View style={styles.photoOptionsContent}>
            <Text style={styles.modalTitle}>Agregar Foto del Vehículo</Text>
            <TouchableOpacity style={styles.vehiclePhotoOption} onPress={takePhoto}>
              <Text style={styles.vehiclePhotoOptionText}>📷 Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.vehiclePhotoOption} onPress={selectFromGallery}>
              <Text style={styles.vehiclePhotoOptionText}>🖼️ Seleccionar de Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.vehiclePhotoOption, { borderBottomWidth: 0 }]} 
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={styles.vehiclePhotoOptionText}>❌ Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



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
  tireInspectionButton: {
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  tireInspectionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  photoInspectionButton: {
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  photoInspectionButtonText: {
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
    height: 50,
    minHeight: 50,
    maxHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  selectedValueText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  photoButton: {
    backgroundColor: '#FF0000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  photoButtonText: {
    fontSize: 20,
    color: 'white',
  },
  vehiclePhotoContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  vehiclePhoto: {
    width: 200,
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  photoOptionsModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOptionsContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  vehiclePhotoOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  vehiclePhotoOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },


});

export default InspectionFormScreen; 