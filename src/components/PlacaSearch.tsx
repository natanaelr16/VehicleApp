import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { consultarVehiculo, formatearParaFormulario } from '../services/runtService';
import { useAppStore } from '../stores/appStore';

interface PlacaSearchProps {
  onSuccess?: () => void;
}

const PlacaSearch: React.FC<PlacaSearchProps> = ({ onSuccess }) => {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateVehicleInfo, updateVehicleHistory } = useAppStore();

  const buscarVehiculo = async () => {
    if (!placa.trim()) {
      Alert.alert('Error', 'Por favor ingresa una placa válida');
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando búsqueda para placa:', placa);
      
      const resultado = await consultarVehiculo(placa.trim());
      
      if (resultado.runt.success && resultado.runt.data) {
        // Formatear datos para el formulario
        const datosFormateados = formatearParaFormulario(resultado.runt, resultado.simit);
        
        if (datosFormateados) {
          // Actualizar información del vehículo
          updateVehicleInfo(datosFormateados.vehicleInfo);
          
          // Actualizar historial del vehículo
          updateVehicleHistory(datosFormateados.vehicleHistory);
          
          Alert.alert(
            '✅ Éxito',
            `Información del vehículo ${placa.toUpperCase()} cargada exitosamente.\n\n` +
            `Marca: ${datosFormateados.vehicleInfo.brand}\n` +
            `Modelo: ${datosFormateados.vehicleInfo.model}\n` +
            `Año: ${datosFormateados.vehicleInfo.year}\n` +
            `Propietario: ${datosFormateados.vehicleInfo.ownerName}`,
            [
              {
                text: 'Continuar',
                onPress: () => onSuccess && onSuccess(),
              },
            ]
          );
        } else {
          Alert.alert('Error', 'No se pudo procesar la información del vehículo');
        }
      } else {
        let mensajeError = 'No se pudo obtener información del vehículo.\n\n';
        
        if (!resultado.runt.success) {
          mensajeError += `RUNT: ${resultado.runt.error}\n`;
        }
        
        if (!resultado.simit.success) {
          mensajeError += `SIMIT: ${resultado.simit.error}\n`;
        }
        
        Alert.alert('⚠️ Información', mensajeError + '\nPuedes continuar llenando el formulario manualmente.');
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Alert.alert(
        'Error',
        'No se pudo conectar con los servicios del RUNT/SIMIT. Verifica tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  const limpiarBusqueda = () => {
    setPlaca('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Consulta RUNT/SIMIT</Text>
        <Text style={styles.subtitle}>
          Ingresa la placa del vehículo para autocompletar la información
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          value={placa}
          onChangeText={setPlaca}
          placeholder="Ej: ABC123 o ABC-123"
          style={styles.placaInput}
          autoCapitalize="characters"
          maxLength={10}
          editable={!loading}
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={buscarVehiculo}
            disabled={loading || !placa.trim()}
            style={[
              styles.searchButton,
              (!placa.trim() || loading) && styles.searchButtonDisabled
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>🔍 Consultar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={limpiarBusqueda}
            disabled={loading}
            style={[styles.clearButton, loading && styles.clearButtonDisabled]}
          >
            <Text style={styles.clearButtonText}>🗑️ Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ Información que se obtiene:</Text>
        <Text style={styles.infoText}>• Datos del vehículo (marca, modelo, año, color)</Text>
        <Text style={styles.infoText}>• Información del propietario</Text>
        <Text style={styles.infoText}>• Estado de documentos (SOAT, técnicomecánica)</Text>
        <Text style={styles.infoText}>• Multas pendientes del SIMIT</Text>
        <Text style={styles.infoText}>• Estado de impuestos</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  placaInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  searchButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonDisabled: {
    backgroundColor: '#ecf0f1',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default PlacaSearch; 