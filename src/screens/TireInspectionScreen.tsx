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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import ViewShot from 'react-native-view-shot';

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

  // 2. Definir posiciones y nombres exactos
  const tirePositions = [
    { id: 'front-left', x: 0.22, y: 0.32, title: 'Llanta DIzquierda' },
    { id: 'front-right', x: 0.78, y: 0.32, title: 'Llanta DDerecha' },
    { id: 'rear-left', x: 0.22, y: 0.68, title: 'Llanta TIzquierda' },
    { id: 'rear-right', x: 0.78, y: 0.68, title: 'Llanta TDerecha' },
  ];

  // Sincronizar mediciones cuando cambie la inspección actual
  useEffect(() => {
    if (currentInspection?.tireInspection?.measurements) {
      setMeasurements(currentInspection.tireInspection.measurements);
    } else {
      setMeasurements([]);
    }
  }, [currentInspection?.tireInspection?.measurements]);

  // Obtener posiciones disponibles (no usadas)
  const getAvailablePositions = () => {
    const usedPositions = measurements.map(m => m.position);
    return tirePositions.filter(pos => !usedPositions.includes(pos.id));
  };

  // 3. Modal/input solo para valor numérico
  const handlePositionSelect = (position: any) => {
    setSelectedPosition(position);
    const found = measurements.find(m => m.position === position.id);
    setValueInput(found ? String(found.value) : '');
    setModalVisible(true);
  };

  const handleAddMeasurement = () => {
    const value = parseFloat(valueInput.replace(',', '.'));
    if (isNaN(value) || value < 0 || value > 6.34) {
      Alert.alert('Valor inválido', 'Ingresa un valor numérico entre 0 y 6.34');
      return;
    }
    if (selectedPosition) {
      const newMeasurement: TireMeasurement = {
        id: selectedPosition.id,
        position: selectedPosition.id,
        x: selectedPosition.x,
        y: selectedPosition.y,
        title: selectedPosition.title,
        value,
      };
      // Reemplazar o agregar
      setMeasurements(prev => {
        const filtered = prev.filter(m => m.position !== selectedPosition.id);
        return [...filtered, newMeasurement];
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
      let capturedImage: string | undefined = undefined;
      
      // Capturar la imagen si hay mediciones
      if (measurements.length > 0 && viewShotRef.current?.capture) {
        try {
          const result = await viewShotRef.current.capture();
          capturedImage = result || undefined;
          console.log('Imagen de llantas capturada:', capturedImage);
        } catch (captureError) {
          console.error('Error capturando imagen de llantas:', captureError);
        }
      }
      
      if (currentInspection) {
        updateTireInspection({
          measurements,
          vehicleType,
          capturedImage
        });
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
          Selecciona una llanta disponible para agregar información. Las llantas ya medidas aparecen en rojo.
        </Text>
        
        <View style={styles.imageContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 0.9,
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT
            }}
          >
            <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
              <Image
                source={{
                  uri: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="300" height="180" xmlns="http://www.w3.org/2000/svg">
                      <rect width="300" height="180" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
                      <rect x="50" y="40" width="200" height="100" fill="#e0e0e0" stroke="#999" stroke-width="1"/>
                      <text x="150" y="30" text-anchor="middle" fill="#666" font-size="12">ESQUELETO DEL VEHÍCULO</text>
                    </svg>
                  `)
                }}
                style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: 12 }}
                resizeMode="contain"
              />
              {/* Dibujar líneas y etiquetas */}
              {tirePositions.map((pos) => {
                const m = measurements.find(meas => meas.position === pos.id);
                const color = getColorByValue(m?.value);
                // Coordenadas para líneas (ajustar según imagen)
                const startX = pos.x * IMAGE_WIDTH;
                const startY = pos.y * IMAGE_HEIGHT;
                const endX = pos.x * IMAGE_WIDTH + (pos.x < 0.5 ? -40 : 40);
                const endY = pos.y * IMAGE_HEIGHT + (pos.y < 0.5 ? -40 : 40);
                return (
                  <>
                    {/* Línea interactiva */}
                    <TouchableOpacity
                      key={pos.id}
                      activeOpacity={0.7}
                      style={{ position: 'absolute', left: Math.min(startX, endX), top: Math.min(startY, endY), width: Math.abs(endX - startX) || 2, height: Math.abs(endY - startY) || 2, zIndex: 2 }}
                      onPress={() => handlePositionSelect(pos)}
                    >
                      <View style={{ position: 'absolute', left: 0, top: 0, width: Math.abs(endX - startX) || 2, height: Math.abs(endY - startY) || 2, borderWidth: 3, borderColor: color, borderRadius: 2 }} />
                    </TouchableOpacity>
                    {/* Etiqueta con nombre y valor */}
                    {typeof m?.value === 'number' && (
                      <View style={{ position: 'absolute', left: endX, top: endY, backgroundColor: color, borderRadius: 8, padding: 4, minWidth: 60 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{pos.title}</Text>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{m.value.toFixed(2)}</Text>
                      </View>
                    )}
                  </>
                );
              })}
            </View>
          </ViewShot>
        </View>
        
        {/* Lista de mediciones */}
        {measurements.length > 0 && (
          <View style={styles.measurementsList}>
            <Text style={styles.measurementsTitle}>Llantas Registradas:</Text>
            {measurements.map((measurement) => (
              <View key={measurement.id} style={styles.measurementItem}>
                <Text style={styles.measurementItemTitle}>{measurement.title}</Text>
                <Text style={styles.measurementItemText}>Valor: {measurement.value.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Posiciones disponibles */}
        {availablePositions.length > 0 && (
          <View style={styles.availablePositions}>
            <Text style={styles.availableTitle}>Posiciones Disponibles:</Text>
            {availablePositions.map((pos) => (
              <TouchableOpacity
                key={pos.id}
                style={styles.availablePositionButton}
                onPress={() => handlePositionSelect(pos)}
              >
                <Text style={styles.availablePositionText}>{pos.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
              <TouchableOpacity onPress={handleAddMeasurement} style={styles.modalButtonAdd}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
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
});

export default TireInspectionScreen; 