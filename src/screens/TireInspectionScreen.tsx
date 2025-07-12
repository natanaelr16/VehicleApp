import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import ViewShot from 'react-native-view-shot';
import { TireInspection } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.6;

// 1. Modificar TireMeasurement para solo guardar valor numérico y nombre
interface TireMeasurement {
  id: string;
  position: string; // 'front-left', 'front-right', 'rear-left', 'rear-right'
  x: number;
  y: number;
  title: string; // 'Llanta DDerecha', etc.
  value: number; // vida útil
}

interface TireInspectionScreenProps {
  route?: any;
}

const TireInspectionScreen: React.FC<TireInspectionScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { currentInspection, updateTireInspection } = useAppStore();
  const vehicleType = route?.params?.vehicleType || 'sedan';
  const [measurements, setMeasurements] = useState<TireMeasurement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [valueInput, setValueInput] = useState('');
  const viewShotRef = useRef<ViewShot>(null);
  // Estado para la llanta detectada por tap
  const [pendingTapPosition, setPendingTapPosition] = useState<{x: number, y: number} | null>(null);
  const [chooseLlantasModal, setChooseLlantasModal] = useState(false);
  // Estado para el modal de opciones (editar/eliminar)
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedTireForOptions, setSelectedTireForOptions] = useState<{pos: typeof tirePositions[0], measurement: TireMeasurement} | null>(null);
  
  // Estados para batería y líquido de frenos
  const [batteryPercentage, setBatteryPercentage] = useState<number>(0);
  const [batteryObservations, setBatteryObservations] = useState<string>('');
  const [brakeFluidLevel, setBrakeFluidLevel] = useState<number>(0);
  const [brakeFluidObservations, setBrakeFluidObservations] = useState<string>('');

  // 2. Definir posiciones y nombres exactos
  const tirePositions: Array<{id: string, x: number, y: number, title: string}> = [
    { id: 'front-left', x: 0.22, y: 0.32, title: 'Llanta DIzquierda' },
    { id: 'front-right', x: 0.78, y: 0.32, title: 'Llanta DDerecha' },
    { id: 'rear-left', x: 0.22, y: 0.68, title: 'Llanta TIzquierda' },
    { id: 'rear-right', x: 0.78, y: 0.68, title: 'Llanta TDerecha' },
  ];

  // 1. Definir offsets para cada llanta (dirección de línea y etiqueta)
  const tireLabelOffsets = {
    'front-left':  { dx: -60, dy: -40 }, // izquierda-arriba
    'front-right': { dx: 60, dy: -40 },  // derecha-arriba
    'rear-left':   { dx: -60, dy: 40 },  // izquierda-abajo
    'rear-right':  { dx: 60, dy: 40 },   // derecha-abajo
  };

  // Sincronizar mediciones cuando cambie la inspección actual
  useEffect(() => {
    console.log('useEffect - currentInspection:', currentInspection);
    console.log('useEffect - tireInspection:', currentInspection?.tireInspection);
    console.log('useEffect - measurements del store:', currentInspection?.tireInspection?.measurements);
    
    if (currentInspection?.tireInspection?.measurements) {
      console.log('useEffect - cargando measurements del store:', currentInspection.tireInspection.measurements);
      setMeasurements(currentInspection.tireInspection.measurements);
    } else {
      console.log('useEffect - no hay measurements, inicializando array vacío');
      setMeasurements([]);
    }

    // Cargar datos de batería y líquido de frenos
    if (currentInspection?.tireInspection?.batteryStatus) {
      setBatteryPercentage(currentInspection.tireInspection.batteryStatus.percentage);
      setBatteryObservations(currentInspection.tireInspection.batteryStatus.observations);
    }
    
    if (currentInspection?.tireInspection?.brakeFluidLevel) {
      setBrakeFluidLevel(currentInspection.tireInspection.brakeFluidLevel.level);
      setBrakeFluidObservations(currentInspection.tireInspection.brakeFluidLevel.observations);
    }
  }, [currentInspection?.tireInspection]);

  // Obtener posiciones disponibles (no usadas)
  const getAvailablePositions = () => {
    const usedPositions = measurements.map(m => m.position);
    return tirePositions.filter(pos => !usedPositions.includes(pos.id));
  };

  // Obtener nombres de llantas disponibles (no usados)
  const getAvailableTireNames = () => {
    const usedNames = measurements.map(m => m.title);
    const allNames = ['Llanta Del. DER', 'Llanta Del IZQ', 'Llanta Tra. DER', 'Llanta Tra IZQ'];
    return allNames.filter(name => !usedNames.includes(name));
  };

  // 3. Modal/input solo para valor numérico
  const handlePositionSelect = (position: any) => {
    setSelectedPosition(position);
    const found = measurements.find(m => m.position === position.id);
    setValueInput(found ? String(found.value) : '');
    setModalVisible(true);
  };

  // Handler para tap sobre la imagen
  const handleImagePress = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    // Verificar si ya hay 4 mediciones
    if (measurements.length >= 4) {
      Alert.alert('Límite alcanzado', 'Ya tienes 4 llantas medidas. Elimina una para agregar otra.');
      return;
    }
    
    // Convertir coordenadas a porcentajes
    const x = locationX / IMAGE_WIDTH;
    const y = locationY / IMAGE_HEIGHT;
    
    // Guardar la posición del tap y mostrar modal de selección de nombre
    setPendingTapPosition({ x, y });
    setChooseLlantasModal(true);
  };

  // Handler para elegir nombre de llanta desde el modal
  const handleChooseLlanta = (tireName: string) => {
    if (pendingTapPosition) {
      // Crear nueva medición con nombre específico
      const newMeasurement: TireMeasurement = {
        id: `tire-${Date.now()}`,
        position: tireName,
        x: pendingTapPosition.x,
        y: pendingTapPosition.y,
        title: tireName,
        value: 0,
      };
      
      setSelectedPosition({ id: newMeasurement.id, x: pendingTapPosition.x, y: pendingTapPosition.y, title: tireName });
      setValueInput('');
      setModalVisible(true);
      
      // Agregar la medición temporalmente para mostrar el punto
      setMeasurements(prev => [...prev, newMeasurement]);
      setChooseLlantasModal(false);
      setPendingTapPosition(null);
    }
  };

  const handleAddMeasurement = () => {
    const value = parseFloat(valueInput.replace(',', '.'));
    if (isNaN(value) || value < 0 || value > 6.34) {
      Alert.alert('Valor inválido', 'Ingresa un valor numérico entre 0 y 6.34');
      return;
    }
    if (selectedPosition) {
      console.log('handleAddMeasurement - selectedPosition:', selectedPosition);
      console.log('handleAddMeasurement - value a agregar:', value);
      console.log('handleAddMeasurement - measurements antes:', measurements);
      
      // Actualizar la medición existente con el valor
      setMeasurements(prev => {
        const updated = prev.map(m => 
          m.id === selectedPosition.id 
            ? { ...m, value }
            : m
        );
        console.log('handleAddMeasurement - measurements después:', updated);
        return updated;
      });
      
      setSelectedPosition(null);
      setValueInput('');
      setModalVisible(false);
    }
  };

  const handleMeasurementLongPress = (id: string) => {
    Alert.alert(
      'Eliminar medición',
      '¿Deseas eliminar esta medición?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setMeasurements(measurements.filter(m => m.id !== id));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      console.log('handleSave - measurements antes de guardar:', measurements);
      console.log('handleSave - currentInspection:', currentInspection);
      
      let capturedImage: string | undefined = undefined;
      
      // Capturar la imagen si hay mediciones
      if (measurements.length > 0 && viewShotRef.current?.capture) {
        try {
          const result = await viewShotRef.current.capture();
          console.log('Resultado de ViewShot (llantas):', result);
          console.log('Tipo de resultado (llantas):', typeof result);
          
          // Convertir siempre a base64 para evitar problemas con archivos temporales
          if (result && typeof result === 'string') {
            if (result.startsWith('data:image')) {
              // Ya es base64
              capturedImage = result;
              console.log('Imagen de llantas ya en base64, longitud:', capturedImage.length);
            } else if (result.startsWith('file://')) {
              // Es una ruta de archivo, convertir a base64
              try {
                const RNFS = require('react-native-fs');
                const base64 = await RNFS.readFile(result, 'base64');
                capturedImage = `data:image/png;base64,${base64}`;
                console.log('Imagen de llantas convertida a base64, longitud:', capturedImage.length);
              } catch (convertError) {
                console.error('Error convirtiendo imagen de llantas a base64:', convertError);
                // Usar placeholder si falla la conversión
                capturedImage = `data:image/svg+xml;base64,${btoa(`
                  <svg width="300" height="180" xmlns="http://www.w3.org/2000/svg">
                    <rect width="300" height="180" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
                    <text x="150" y="90" text-anchor="middle" fill="#666" font-size="14">ERROR</text>
                  </svg>
                `)}`;
              }
            } else {
              // Otro formato, intentar convertir
              try {
                const RNFS = require('react-native-fs');
                const base64 = await RNFS.readFile(result, 'base64');
                capturedImage = `data:image/png;base64,${base64}`;
                console.log('Imagen de llantas convertida a base64, longitud:', capturedImage.length);
              } catch (convertError) {
                console.error('Error convirtiendo imagen de llantas a base64:', convertError);
                capturedImage = `data:image/svg+xml;base64,${btoa(`
                  <svg width="300" height="180" xmlns="http://www.w3.org/2000/svg">
                    <rect width="300" height="180" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
                    <text x="150" y="90" text-anchor="middle" fill="#666" font-size="14">ERROR</text>
                  </svg>
                `)}`;
              }
            }
          }
          
          console.log('Imagen final de llantas capturada:', capturedImage?.substring(0, 100));
        } catch (captureError) {
          console.error('Error capturando imagen de llantas:', captureError);
        }
      }
      
      if (currentInspection) {
        const tireInspectionData: TireInspection = {
          measurements,
          vehicleType,
          capturedImage,
          batteryStatus: {
            percentage: batteryPercentage,
            observations: batteryObservations
          },
          brakeFluidLevel: {
            level: brakeFluidLevel,
            observations: brakeFluidObservations
          }
        };
        
        console.log('handleSave - tireInspectionData a guardar:', tireInspectionData);
        
        updateTireInspection(tireInspectionData);
        
        // Forzar el guardado de la inspección actual
        useAppStore.getState().saveInspection();
        
        // Verificar que se guardó correctamente
        setTimeout(() => {
          const updatedInspection = useAppStore.getState().currentInspection;
          console.log('handleSave - currentInspection después de guardar:', updatedInspection);
          console.log('handleSave - tireInspection después de guardar:', updatedInspection?.tireInspection);
        }, 100);
      } else {
        console.error('handleSave - No hay currentInspection');
        Alert.alert('Error', 'No hay una inspección activa para guardar.');
        return;
      }
      
      Alert.alert('Mediciones guardadas', 'Las mediciones de llantas han sido guardadas.');
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando inspección de llantas:', error);
      Alert.alert('Error', 'No se pudo guardar la inspección de llantas.');
    }
  };

  const availablePositions = getAvailablePositions();

  // 4. Lógica de color
  const getColorByValue = (value?: number) => {
    if (typeof value !== 'number') return '#2196F3'; // azul/gris sin valor
    if (value < 1.40) return '#FF0000'; // rojo
    if (value <= 2.8) return '#FF9800'; // naranja
    if (value <= 4.5) return '#FFD600'; // amarillo
    if (value <= 6.34) return '#4CAF50'; // verde
    return '#2196F3';
  };

  // Función para detectar la llanta más cercana al tap
  const detectNearestTire = (x: number, y: number) => {
    let minDist = 9999;
    let nearest = null;
    tirePositions.forEach(pos => {
      const px = pos.x * IMAGE_WIDTH;
      const py = pos.y * IMAGE_HEIGHT;
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = pos;
      }
    });
    // Radio de tolerancia (ajustable)
    if (minDist < 80) return nearest;
    return null;
  };

  // Handler para mostrar opciones de editar/eliminar
  const handleShowOptions = (pos: typeof tirePositions[0], measurement: TireMeasurement) => {
    setSelectedTireForOptions({ pos, measurement });
    setOptionsModalVisible(true);
  };

  // Handler para editar medición
  const handleEditMeasurement = () => {
    if (selectedTireForOptions) {
      setSelectedPosition(selectedTireForOptions.pos);
      setValueInput(String(selectedTireForOptions.measurement.value));
      setModalVisible(true);
      setOptionsModalVisible(false);
      setSelectedTireForOptions(null);
    }
  };

  // Handler para eliminar medición
  const handleDeleteMeasurement = () => {
    if (selectedTireForOptions) {
      const measurementId = selectedTireForOptions.measurement.id;
      console.log('handleDeleteMeasurement - eliminando medición con id:', measurementId);
      setMeasurements(prev => {
        const filtered = prev.filter((meas: TireMeasurement) => meas.id !== measurementId);
        console.log('handleDeleteMeasurement - mediciones después de eliminar:', filtered);
        return filtered;
      });
      setOptionsModalVisible(false);
      setSelectedTireForOptions(null);
    }
  };

  // 5. Renderizar líneas y etiquetas
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspección de Llantas</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructions}>
          Toca en cualquier lugar de la imagen para marcar una llanta (máximo 4). 
          {'\n'}• Toca una llanta para editar su valor
          {'\n'}• Mantén presionado una llanta para opciones avanzadas
          {'\n'}• Usa los botones "Eliminar" en la lista para eliminar mediciones individuales
        </Text>
        
        <View style={styles.imageContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 0.9,
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
              result: 'base64'
            }}
          >
            <Pressable onPress={handleImagePress} style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
              <Image
                source={require('../../assets/vehicles/vehicle-skeleton.png')}
                style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: 12 }}
                resizeMode="contain"
              />
              {/* Dibujar puntos de llantas medidas */}
              {measurements.map((m) => {
                const color = getColorByValue(m.value);
                const cx = m.x * IMAGE_WIDTH;
                const cy = m.y * IMAGE_HEIGHT;
                // Calcular offset para la etiqueta (más corto)
                const dx = 35;
                const dy = -25;
                const labelX = cx + dx;
                const labelY = cy + dy;
                // Línea diagonal usando View
                return (
                  <React.Fragment key={m.id}>
                    {/* Punto pequeño */}
                    <TouchableOpacity
                      style={{ position: 'absolute', left: cx - 4, top: cy - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: color, borderWidth: 1, borderColor: '#fff', zIndex: 3 }}
                      onPress={() => {
                        setSelectedPosition({ id: m.id, x: m.x, y: m.y, title: m.title });
                        setValueInput(String(m.value));
                        setModalVisible(true);
                      }}
                    />
                    {/* Línea diagonal usando View */}
                    <View
                      style={{
                        position: 'absolute',
                        left: cx,
                        top: cy,
                        width: Math.sqrt((labelX - cx) ** 2 + (labelY - cy) ** 2),
                        height: 1,
                        backgroundColor: color,
                        zIndex: 2,
                        pointerEvents: 'none',
                        transform: [
                          {
                            rotate: `${Math.atan2(labelY - cy, labelX - cx) * (180 / Math.PI)}deg`
                          }
                        ],
                        transformOrigin: '0 0'
                      }}
                    />
                    {/* Etiqueta con long press para editar/eliminar */}
                    <Pressable
                      style={{ 
                        position: 'absolute', 
                        left: labelX - 8, 
                        top: labelY - 8, 
                        backgroundColor: color, 
                        borderRadius: 8, 
                        padding: 4, 
                        minWidth: 50, 
                        minHeight: 30,
                        zIndex: 4,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onLongPress={() => handleShowOptions({ id: m.id, x: m.x, y: m.y, title: m.title }, m)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 8 }}>{m.title}</Text>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>{m.value.toFixed(2)}</Text>
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </Pressable>
          </ViewShot>
        </View>
        
        {/* Lista de mediciones */}
        {measurements.length > 0 && (
          <View style={styles.measurementsList}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.measurementsTitle}>Llantas Registradas:</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF6B35',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6
                }}
                onPress={() => {
                  Alert.alert(
                    'Eliminar todas las mediciones',
                    '¿Deseas eliminar todas las mediciones de llantas?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar Todas',
                        style: 'destructive',
                        onPress: () => {
                          console.log('Eliminando todas las mediciones');
                          setMeasurements([]);
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Eliminar Todas</Text>
              </TouchableOpacity>
            </View>
            {measurements.map((measurement) => (
              <View key={measurement.id} style={styles.measurementItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.measurementItemTitle}>{measurement.title}</Text>
                  <Text style={styles.measurementItemText}>Valor: {measurement.value.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FF0000',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    marginLeft: 10
                  }}
                  onPress={() => {
                    Alert.alert(
                      'Eliminar medición',
                      `¿Deseas eliminar la medición de ${measurement.title}?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: () => {
                            console.log('Eliminando medición:', measurement.id);
                            setMeasurements(prev => prev.filter(m => m.id !== measurement.id));
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}



        {/* Información de límite */}
        {measurements.length < 4 && (
          <View style={styles.availablePositions}>
            <Text style={styles.availableTitle}>Puedes agregar {4 - measurements.length} llanta(s) más</Text>
          </View>
        )}

        {/* Estado de Batería */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔋 Estado de Batería</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Porcentaje de carga (0-100%):</Text>
            <TextInput
              style={styles.input}
              value={batteryPercentage.toString()}
              onChangeText={(text) => setBatteryPercentage(parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="Ej: 85"
              maxLength={3}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Observaciones:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={batteryObservations}
              onChangeText={setBatteryObservations}
              placeholder="Observaciones sobre el estado de la batería..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Estado de Líquido de Frenos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛑 Estado de Líquido de Frenos</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nivel (ingrese el valor):</Text>
            <TextInput
              style={styles.input}
              value={brakeFluidLevel.toString()}
              onChangeText={(text) => setBrakeFluidLevel(parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="Ej: 75"
              maxLength={3}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Observaciones:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={brakeFluidObservations}
              onChangeText={setBrakeFluidObservations}
              placeholder="Observaciones sobre el líquido de frenos..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Guardar mediciones</Text>
      </TouchableOpacity>
      
      {/* Modal simplificado */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Medida de {selectedPosition?.title}</Text>
            <TextInput
              style={styles.modalInput}
              value={valueInput}
              onChangeText={setValueInput}
              placeholder="Ej: 6.46"
              keyboardType="decimal-pad"
              maxLength={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    'Eliminar medición',
                    '¿Deseas eliminar esta medición?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => {
                          if (selectedPosition) {
                            setMeasurements(prev => prev.filter(m => m.id !== selectedPosition.id));
                          }
                          setModalVisible(false);
                          setSelectedPosition(null);
                          setValueInput('');
                        },
                      },
                    ]
                  );
                }} 
                style={[styles.modalButtonCancel, { backgroundColor: '#FF0000' }]}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddMeasurement} style={styles.modalButtonAdd}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para elegir llanta si el tap no está asignado */}
      <Modal visible={chooseLlantasModal} transparent animationType="fade" onRequestClose={() => setChooseLlantasModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}> 
          <View style={{ backgroundColor: '#111', borderRadius: 20, padding: 28, minWidth: 320, maxWidth: 420, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22, marginBottom: 10, textAlign: 'center' }}>Selecciona la llanta</Text>
            <Text style={{ color: '#ccc', fontSize: 15, marginBottom: 22, textAlign: 'center' }}>Elige el nombre de la llanta que vas a medir:</Text>
            {getAvailableTireNames().length === 0 ? (
              <Text style={{ color: 'white', fontSize: 16, marginBottom: 20 }}>No hay llantas disponibles</Text>
            ) : (
              getAvailableTireNames().map((tireName: string, idx: number) => (
                <TouchableOpacity
                  key={tireName || `llanta-${idx}`}
                  style={{
                    backgroundColor: '#FF0000',
                    borderRadius: 10,
                    marginVertical: 8,
                    paddingVertical: 18,
                    width: 240,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}
                  onPress={() => handleChooseLlanta(tireName)}
                >
                  <Text style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 20,
                    textAlign: 'center',
                    textShadowColor: '#000',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                    letterSpacing: 0.5,
                  }}>{tireName || `Llanta ${idx + 1}`}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              onPress={() => { setChooseLlantasModal(false); setPendingTapPosition(null); }}
              style={{
                backgroundColor: '#333',
                borderRadius: 10,
                marginTop: 18,
                paddingVertical: 16,
                width: 240,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de opciones (editar/eliminar) */}
      <Modal visible={optionsModalVisible} transparent animationType="fade" onRequestClose={() => setOptionsModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}> 
          <View style={{ backgroundColor: 'white', borderRadius: 18, padding: 28, minWidth: 300, maxWidth: 380, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 20, marginBottom: 18, textAlign: 'center' }}>Opciones para {selectedTireForOptions?.measurement.title}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#000',
                borderRadius: 8,
                marginVertical: 8,
                paddingVertical: 15,
                width: 200,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleEditMeasurement}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Editar medición</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#FF0000',
                borderRadius: 8,
                marginVertical: 8,
                paddingVertical: 15,
                width: 200,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleDeleteMeasurement}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Eliminar medición</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setOptionsModalVisible(false)}
              style={{
                backgroundColor: '#333',
                borderRadius: 8,
                marginTop: 12,
                paddingVertical: 15,
                width: 200,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#000',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  tireGuide: {
    position: 'absolute',
    width: 40, // Increased size for better touch area
    height: 40, // Increased size for better touch area
    alignItems: 'center',
    justifyContent: 'center',
  },
  tireGuideInner: {
    width: 40, // Increased size for better touch area
    height: 40, // Increased size for better touch area
    borderRadius: 20, // Increased border radius for better touch area
    backgroundColor: 'rgba(0, 0, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tireGuideText: {
    color: '#0066cc',
    fontWeight: 'bold',
    fontSize: 10, // Increased font size
    textAlign: 'center',
  },
  tireGuideSubtext: {
    color: '#666',
    fontSize: 8,
    marginTop: 2,
  },
  measurement: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  measurementTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
  },
  measurementBrand: {
    color: 'white',
    fontSize: 6,
    textAlign: 'center',
  },
  measurementsList: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    elevation: 2,
  },
  measurementsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#FF0000',
  },
  measurementItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  measurementItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  measurementItemText: {
    fontSize: 14,
    color: '#333',
  },
  availablePositions: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  availableTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  availablePositionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 5,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  availablePositionText: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalField: {
    width: '100%',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalValue: {
    fontSize: 16,
    color: '#666',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  modalButtonAdd: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  modalButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FF0000',
    paddingBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default TireInspectionScreen; 