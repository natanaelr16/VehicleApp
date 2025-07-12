import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import { InspectionPhoto } from '../types';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { requestCameraPermissions, requestStoragePermissions } from '../utils/permissions';
import { formatDateForDisplay } from '../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PhotoInspectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentInspection, addInspectionPhoto, removeInspectionPhoto, updateInspectionPhoto } = useAppStore();
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<InspectionPhoto | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [observationsInput, setObservationsInput] = useState('');

  // Cargar fotos existentes
  useEffect(() => {
    if (currentInspection?.inspectionPhotos) {
      setPhotos(currentInspection.inspectionPhotos);
    }
  }, [currentInspection?.inspectionPhotos]);

  const takePhoto = async () => {
    try {
      // Verificar permisos de cámara
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) {
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        const newPhoto: InspectionPhoto = {
          id: `photo-${Date.now()}`,
          uri: result.assets[0].uri || '',
          label: photos.length + 1,
          observations: '',
          timestamp: new Date(),
        };

        setSelectedPhoto(newPhoto);
        setLabelInput(String(newPhoto.label));
        setObservationsInput('');
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const selectFromGallery = async () => {
    try {
      // Verificar permisos de almacenamiento
      const hasPermission = await requestStoragePermissions();
      if (!hasPermission) {
        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        const newPhoto: InspectionPhoto = {
          id: `photo-${Date.now()}`,
          uri: result.assets[0].uri || '',
          label: photos.length + 1,
          observations: '',
          timestamp: new Date(),
        };

        setSelectedPhoto(newPhoto);
        setLabelInput(String(newPhoto.label));
        setObservationsInput('');
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const savePhoto = () => {
    if (!selectedPhoto || !labelInput.trim()) {
      Alert.alert('Error', 'Debe ingresar una etiqueta numérica');
      return;
    }

    const label = parseInt(labelInput);
    if (isNaN(label) || label <= 0) {
      Alert.alert('Error', 'La etiqueta debe ser un número positivo');
      return;
    }

    // Verificar si la etiqueta ya existe
    const existingPhoto = photos.find(p => p.label === label && p.id !== selectedPhoto.id);
    if (existingPhoto) {
      Alert.alert('Error', 'Ya existe una foto con esa etiqueta');
      return;
    }

    const updatedPhoto: InspectionPhoto = {
      ...selectedPhoto,
      label,
      observations: observationsInput.trim(),
    };

    if (selectedPhoto.id.includes('photo-')) {
      // Nueva foto
      addInspectionPhoto(updatedPhoto);
    } else {
      // Foto existente
      updateInspectionPhoto(selectedPhoto.id, {
        label,
        observations: observationsInput.trim(),
      });
    }

    setModalVisible(false);
    setSelectedPhoto(null);
    setLabelInput('');
    setObservationsInput('');
  };

  const editPhoto = (photo: InspectionPhoto) => {
    setSelectedPhoto(photo);
    setLabelInput(String(photo.label));
    setObservationsInput(photo.observations);
    setModalVisible(true);
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Eliminar foto',
      '¿Deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            removeInspectionPhoto(photoId);
          },
        },
      ]
    );
  };

  const handleSave = () => {
    Alert.alert('Fotos guardadas', 'Las fotos de inspección han sido guardadas.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspección Fotográfica</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructions}>
          Toma fotos del vehículo y agrega etiquetas numéricas con observaciones para documentar el estado.
        </Text>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Text style={styles.actionButtonText}>📸 Tomar Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={selectFromGallery}>
            <Text style={styles.actionButtonText}>🖼️ Seleccionar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de fotos */}
        {photos.length > 0 ? (
          <View style={styles.photosList}>
            <Text style={styles.photosTitle}>Fotos Registradas ({photos.length})</Text>
            {photos
              .sort((a, b) => a.label - b.label)
              .map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoLabel}>Etiqueta: {photo.label}</Text>
                    {photo.observations && (
                      <Text style={styles.photoObservations}>{photo.observations}</Text>
                    )}
                    <Text style={styles.photoDate}>
                      {formatDateForDisplay(photo.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => editPhoto(photo)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePhoto(photo.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay fotos registradas. Toma la primera foto para comenzar.
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Guardar fotos</Text>
      </TouchableOpacity>

      {/* Modal para editar foto */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedPhoto?.id.includes('photo-') ? 'Nueva Foto' : 'Editar Foto'}
            </Text>
            
            {selectedPhoto && (
              <Image source={{ uri: selectedPhoto.uri }} style={styles.modalPhoto} />
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Etiqueta numérica:</Text>
              <TextInput
                style={styles.input}
                value={labelInput}
                onChangeText={setLabelInput}
                keyboardType="numeric"
                placeholder="Ej: 1"
                maxLength={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Observaciones:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={observationsInput}
                onChangeText={setObservationsInput}
                placeholder="Describe lo que se observa en la foto..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedPhoto(null);
                  setLabelInput('');
                  setObservationsInput('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={savePhoto}>
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
    padding: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photosList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FF0000',
    paddingBottom: 5,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  photoInfo: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 4,
  },
  photoObservations: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 12,
    color: '#999',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  saveButton: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSave: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PhotoInspectionScreen; 