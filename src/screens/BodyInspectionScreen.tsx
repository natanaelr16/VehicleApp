import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import { BodyInspectionPoint } from '../types';
import ViewShot from 'react-native-view-shot';

const VEHICLE_IMAGES: Record<string, any> = {
  sedan: require('../../assets/vehicles/sedan.png'),
  suv: require('../../assets/vehicles/suv.png'),
  pickup: require('../../assets/vehicles/pickup.png'),
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.5;

interface Point extends BodyInspectionPoint {
  observation?: string;
}

interface BodyInspectionScreenProps {
  route?: any;
}

const BodyInspectionScreen: React.FC<BodyInspectionScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { currentInspection, updateBodyInspection } = useAppStore();
  const vehicleType = route?.params?.vehicleType || 'sedan';
  console.log('BodyInspectionScreen - vehicleType:', vehicleType);
  console.log('BodyInspectionScreen - VEHICLE_IMAGES keys:', Object.keys(VEHICLE_IMAGES));
  const [points, setPoints] = useState<Point[]>(currentInspection?.bodyInspection?.points || []);
  console.log('BodyInspectionScreen - Estado inicial - points:', currentInspection?.bodyInspection?.points);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{x: number, y: number} | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const viewShotRef = useRef<ViewShot>(null);

  // Sincronizar puntos cuando cambie la inspección actual
  useEffect(() => {
    console.log('BodyInspectionScreen - currentInspection:', currentInspection);
    console.log('BodyInspectionScreen - bodyInspection:', currentInspection?.bodyInspection);
    console.log('BodyInspectionScreen - points:', currentInspection?.bodyInspection?.points);
    
    if (currentInspection?.bodyInspection?.points) {
      setPoints(currentInspection.bodyInspection.points);
      console.log('BodyInspectionScreen - Puntos cargados:', currentInspection.bodyInspection.points);
    } else {
      setPoints([]);
      console.log('BodyInspectionScreen - No hay puntos, array vacío');
    }
  }, [currentInspection?.bodyInspection?.points]);

  const handleImagePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const x = locationX / IMAGE_WIDTH;
    const y = locationY / IMAGE_HEIGHT;
    setPendingPoint({ x, y });
    setLabelInput('');
    setModalVisible(true);
  };

  const handleAddPoint = () => {
    if (pendingPoint) {
      setPoints([
        ...points,
        {
          x: pendingPoint.x,
          y: pendingPoint.y,
          label: labelInput,
          number: points.length + 1,
        },
      ]);
      setPendingPoint(null);
      setLabelInput('');
      setModalVisible(false);
    }
  };

  const handlePointLongPress = (index: number) => {
    Alert.alert(
      'Eliminar punto',
      '¿Deseas eliminar este punto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const newPoints = points.filter((_, i) => i !== index).map((p, idx) => ({ ...p, number: idx + 1 }));
            setPoints(newPoints);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      let capturedImage: string | undefined = undefined;
      
      // Capturar la imagen si hay puntos marcados
      if (points.length > 0 && viewShotRef.current?.capture) {
        try {
          const result = await viewShotRef.current.capture();
          capturedImage = result || undefined;
          console.log('Imagen capturada:', capturedImage);
        } catch (captureError) {
          console.error('Error capturando imagen:', captureError);
        }
      }
      
      if (currentInspection) {
        updateBodyInspection({
          points,
          vehicleType,
          capturedImage
        });
      }
      
      Alert.alert('Puntos guardados', 'Los puntos de inspección han sido guardados.');
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando inspección:', error);
      Alert.alert('Error', 'No se pudo guardar la inspección.');
    }
  };

  console.log('BodyInspectionScreen - Render - points:', points);
  console.log('BodyInspectionScreen - Render - vehicleType:', vehicleType);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspección de Carrocería</Text>
      </View>
      <Text style={styles.instructions}>
        Toca sobre la imagen para marcar puntos de daño o revisión. Mantén presionado un punto para eliminarlo.
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
          <View
            style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleImagePress}
          >
            <Image
              source={VEHICLE_IMAGES[vehicleType]}
              style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, borderRadius: 12 }}
              resizeMode="contain"
              onLoad={() => console.log('BodyInspectionScreen - Imagen cargada:', vehicleType)}
              onError={(error) => console.error('BodyInspectionScreen - Error cargando imagen:', error)}
            />
            {/* Puntos marcados */}
            {points.map((point, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.point,
                  {
                    left: point.x * IMAGE_WIDTH - 10,
                    top: point.y * IMAGE_HEIGHT - 10,
                  },
                ]}
                onLongPress={() => handlePointLongPress(idx)}
              >
                <View style={styles.pointInner}>
                  <Text style={styles.pointNumber}>{point.number}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ViewShot>
      </View>
      {/* Lista de observaciones */}
      {points.length > 0 && (
        <View style={styles.observationsList}>
          <Text style={styles.observationsTitle}>Observaciones:</Text>
          {points.map((point) => (
            <Text key={point.number} style={styles.observationItem}>
              {point.number}. {point.label}
            </Text>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Guardar puntos</Text>
      </TouchableOpacity>
      {/* Modal para ingresar descripción del punto */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Descripción del punto</Text>
            <TextInput
              style={styles.modalInput}
              value={labelInput}
              onChangeText={setLabelInput}
              placeholder="Ejemplo: Rayón, golpe, abolladura..."
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddPoint} style={styles.modalButtonAdd}>
                <Text style={styles.modalButtonText}>Agregar</Text>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    color: '#FF0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  instructions: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  point: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
  },
  observationsList: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
    elevation: 2,
  },
  observationsTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
    color: '#FF0000',
  },
  observationItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  modalButtonAdd: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default BodyInspectionScreen; 