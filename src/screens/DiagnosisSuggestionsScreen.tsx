import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';

// Función para formatear el precio con puntos y coma
function formatPrecio(input: string) {
  // Eliminar todo lo que no sea número o coma
  let value = input.replace(/[^\d,]/g, '');
  // Separar parte entera y decimal
  let [entera, decimal] = value.split(',');
  entera = entera ? entera.replace(/^0+/, '') : '';
  // Formatear miles
  if (entera) {
    entera = entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  return decimal !== undefined ? `${entera},${decimal}` : entera;
}

const DiagnosisSuggestionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentInspection,
    updateSugerenciasDiagnostico,
    updatePrecioSugerido,
    updateResultadoInspeccion,
    saveInspection
  } = useAppStore();

  const [sugerencias, setSugerencias] = useState(currentInspection?.sugerenciasDiagnostico || []);
  const [precio, setPrecio] = useState(currentInspection?.precioSugerido || '');
  const [resultado, setResultado] = useState(currentInspection?.resultadoInspeccion || undefined);

  const handleGuardar = () => {
    updateSugerenciasDiagnostico(sugerencias);
    updatePrecioSugerido(precio);
    if (resultado) updateResultadoInspeccion(resultado);
    saveInspection();
    Alert.alert('Guardado', 'Sugerencias y resultado guardados correctamente');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sugerencias de Diagnóstico</Text>
      {sugerencias.length > 0 ? (
        sugerencias.map((sug, idx) => (
          <View key={idx} style={styles.suggestionRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={sug}
              onChangeText={text => {
                const nuevas = [...sugerencias];
                nuevas[idx] = text;
                setSugerencias(nuevas);
              }}
              placeholder={`Sugerencia #${idx + 1}`}
            />
            <TouchableOpacity
              onPress={() => {
                const nuevas = [...sugerencias];
                nuevas.splice(idx, 1);
                setSugerencias(nuevas);
              }}
              style={styles.deleteButton}
            >
              <Text style={{ color: '#FF0000', fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.emptyStateText}>No hay sugerencias agregadas</Text>
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setSugerencias([...sugerencias, ''])}
      >
        <Text style={styles.addButtonText}>+ Agregar Sugerencia</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Precio Sugerido</Text>
      <TextInput
        style={styles.input}
        value={precio}
        onChangeText={text => setPrecio(formatPrecio(text))}
        placeholder="$0.00"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>¿Aprobado?</Text>
      <View style={styles.resultRow}>
        <TouchableOpacity
          style={[styles.resultButton, resultado === 'approved' && styles.resultButtonApproved]}
          onPress={() => setResultado('approved')}
        >
          <Text style={{ color: resultado === 'approved' ? 'white' : '#333', fontWeight: 'bold' }}>Aprobado</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resultButton, resultado === 'rejected' && styles.resultButtonRejected]}
          onPress={() => setResultado('rejected')}
        >
          <Text style={{ color: resultado === 'rejected' ? 'white' : '#333', fontWeight: 'bold' }}>No Aprobado</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
        <Text style={styles.saveButtonText}>Guardar y Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#222',
    textAlign: 'center',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  deleteButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 6,
  },
  addButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
    marginTop: 18,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  resultButton: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginRight: 10,
  },
  resultButtonApproved: {
    backgroundColor: '#4CAF50',
  },
  resultButtonRejected: {
    backgroundColor: '#FF0000',
  },
  saveButton: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 10,
  },
});

export default DiagnosisSuggestionsScreen; 