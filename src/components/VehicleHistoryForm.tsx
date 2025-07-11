import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../stores/appStore';
import { VehicleHistory } from '../types';

const VehicleHistoryForm: React.FC = () => {
  const { currentInspection, updateVehicleHistory } = useAppStore();
  const [activeTab, setActiveTab] = useState<'basic' | 'taxes' | 'documents'>('basic');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Animación de despliegue
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animar entrada cuando el componente se monta
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!currentInspection) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay inspección activa</Text>
      </View>
    );
  }

  const vehicleHistory: VehicleHistory = currentInspection.vehicleHistory || {
    simitFines: '',
    pignoracion: 'No',
    timbreValue: '',
    governorTax: { status: 'AL DIA' },
    mobilityTax: { status: 'AL DIA' },
    soatExpiry: { month: '', year: '' },
    technicalExpiry: { applies: 'Si', month: '', year: '' },
    engineDisplacement: '',
    fuelType: 'Gasolina',
    mileage: '',
    registrationCity: '',
    fasecoldaReports: 'Sin reportes'
  };

  // Asegurar que los valores de fechas estén inicializados correctamente
  const soatExpiry = vehicleHistory.soatExpiry || { month: '', year: '' };
  const technicalExpiry = vehicleHistory.technicalExpiry || { applies: 'Si', month: '', year: '' };

  // Debug logs para fechas
  useEffect(() => {
    if (activeTab === 'documents') {
      console.log('=== DEBUG DOCUMENTS TAB ===');
      console.log('Force update count:', forceUpdate);
      console.log('Current inspection:', currentInspection);
      console.log('Vehicle history from store:', currentInspection?.vehicleHistory);
      console.log('SOAT values from store:', currentInspection?.vehicleHistory?.soatExpiry);
      console.log('Technical values from store:', currentInspection?.vehicleHistory?.technicalExpiry);
      console.log('Local soatExpiry:', soatExpiry);
      console.log('Local technicalExpiry:', technicalExpiry);
      console.log('==========================');
    }
  }, [activeTab, currentInspection?.vehicleHistory, soatExpiry, technicalExpiry, forceUpdate]);

  const updateField = (field: keyof VehicleHistory, value: any) => {
    updateVehicleHistory({ [field]: value });
  };

  const updateTaxField = (taxType: 'governorTax' | 'mobilityTax', field: 'status' | 'amount', value: any) => {
    const currentTax = vehicleHistory[taxType] || { status: 'AL DIA' as const };
    updateVehicleHistory({
      [taxType]: {
        ...currentTax,
        [field]: value
      }
    });
  };

  const updateExpiryField = (docType: 'soatExpiry' | 'technicalExpiry', field: 'month' | 'year' | 'applies', value: string) => {
    console.log('updateExpiryField:', { docType, field, value });
    
    if (docType === 'technicalExpiry') {
      const currentExpiry = vehicleHistory.technicalExpiry || { applies: 'Si', month: '', year: '' };
      console.log('Current technicalExpiry:', currentExpiry);
      updateVehicleHistory({
        technicalExpiry: {
          ...currentExpiry,
          [field]: value
        }
      });
    } else if (docType === 'soatExpiry') {
      const currentExpiry = vehicleHistory.soatExpiry || { month: '', year: '' };
      console.log('Current soatExpiry:', currentExpiry);
      updateVehicleHistory({
        soatExpiry: {
          ...currentExpiry,
          [field]: value
        }
      });
    }
    
    // Forzar re-render
    setForceUpdate(prev => prev + 1);
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString());

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Historial del Vehículo (RUNT)</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
            onPress={() => setActiveTab('basic')}
          >
            <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>
              🚗 Básico
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'taxes' && styles.activeTab]}
            onPress={() => setActiveTab('taxes')}
          >
            <Text style={[styles.tabText, activeTab === 'taxes' && styles.activeTabText]}>
              💰 Impuestos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
            onPress={() => setActiveTab('documents')}
          >
            <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
              📄 Documentos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        style={[
          styles.content, 
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
          },
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'basic' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Información Básica</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🚨 Multas por SIMIT</Text>
              <TextInput
                style={styles.input}
                value={vehicleHistory.simitFines || ''}
                onChangeText={(text) => updateField('simitFines', text)}
                placeholder="Ej: Sin multas pendientes"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔒 Pignoración</Text>
              <Picker
                selectedValue={vehicleHistory.pignoracion || 'No'}
                onValueChange={(value) => updateField('pignoracion', value)}
                style={styles.picker}
              >
                <Picker.Item label="No" value="No" />
                <Picker.Item label="Si" value="Si" />
              </Picker>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏷️ Timbre por valor de</Text>
              <TextInput
                style={styles.input}
                value={vehicleHistory.timbreValue || ''}
                onChangeText={(text) => updateField('timbreValue', text)}
                placeholder="Ej: $50,000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔧 Cilindraje</Text>
              <TextInput
                style={styles.input}
                value={vehicleHistory.engineDisplacement || ''}
                onChangeText={(text) => updateField('engineDisplacement', text)}
                placeholder="Ej: 1600 cc"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>⛽ Combustible</Text>
              <Picker
                selectedValue={vehicleHistory.fuelType || 'Gasolina'}
                onValueChange={(value) => updateField('fuelType', value)}
                style={styles.picker}
              >
                <Picker.Item label="Gasolina" value="Gasolina" />
                <Picker.Item label="Diesel" value="Diesel" />
                <Picker.Item label="Híbrido" value="Hibrido" />
                <Picker.Item label="Otro" value="Otro" />
              </Picker>
            </View>

            {vehicleHistory.fuelType === 'Otro' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>⛽ Especificar combustible</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleHistory.otherFuelType || ''}
                  onChangeText={(text) => updateField('otherFuelType', text)}
                  placeholder="Ej: Eléctrico, GLP, etc."
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📏 Kilometraje</Text>
              <TextInput
                style={styles.input}
                value={vehicleHistory.mileage || ''}
                onChangeText={(text) => updateField('mileage', text)}
                placeholder="Ej: 150,000 km"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏙️ Matrícula de</Text>
              <TextInput
                style={styles.input}
                value={vehicleHistory.registrationCity || ''}
                onChangeText={(text) => updateField('registrationCity', text)}
                placeholder="Ej: Bogotá"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📊 Fasecolda Reportes</Text>
              <Picker
                selectedValue={vehicleHistory.fasecoldaReports || 'Sin reportes'}
                onValueChange={(value) => updateField('fasecoldaReports', value)}
                style={styles.picker}
              >
                <Picker.Item label="Sin reportes" value="Sin reportes" />
                <Picker.Item label="Con Reportes" value="Con Reportes" />
              </Picker>
            </View>
          </View>
        )}

        {activeTab === 'taxes' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Impuestos</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏛️ Impuesto de Gobernación</Text>
              <Picker
                selectedValue={vehicleHistory.governorTax?.status || 'AL DIA'}
                onValueChange={(value) => updateTaxField('governorTax', 'status', value)}
                style={styles.picker}
              >
                <Picker.Item label="AL DÍA" value="AL DIA" />
                <Picker.Item label="DEBE" value="DEBE" />
              </Picker>
            </View>

            {vehicleHistory.governorTax?.status === 'DEBE' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>💰 Valor a pagar</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleHistory.governorTax?.amount || ''}
                  onChangeText={(text) => updateTaxField('governorTax', 'amount', text)}
                  placeholder="Ej: $150,000"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🚗 Impuesto Movilidad</Text>
              <Picker
                selectedValue={vehicleHistory.mobilityTax?.status || 'AL DIA'}
                onValueChange={(value) => updateTaxField('mobilityTax', 'status', value)}
                style={styles.picker}
              >
                <Picker.Item label="AL DÍA" value="AL DIA" />
                <Picker.Item label="DEBE" value="DEBE" />
              </Picker>
            </View>

            {vehicleHistory.mobilityTax?.status === 'DEBE' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>💰 Valor a pagar</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleHistory.mobilityTax?.amount || ''}
                  onChangeText={(text) => updateTaxField('mobilityTax', 'amount', text)}
                  placeholder="Ej: $80,000"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        )}

        {activeTab === 'documents' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Documentos</Text>
            
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🛡️ SOAT - Fecha de vencimiento</Text>
              <View style={styles.dateContainer}>
                <Picker
                  selectedValue={soatExpiry.month}
                  onValueChange={(value) => {
                    console.log('SOAT Month selected:', value);
                    updateExpiryField('soatExpiry', 'month', value);
                  }}
                  style={[styles.picker, styles.halfPicker]}
                >
                  <Picker.Item label="Mes" value="" />
                  {months.map((month, index) => (
                    <Picker.Item key={index} label={month} value={month} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={soatExpiry.year}
                  onValueChange={(value) => {
                    console.log('SOAT Year selected:', value);
                    updateExpiryField('soatExpiry', 'year', value);
                  }}
                  style={[styles.picker, styles.halfPicker]}
                >
                  <Picker.Item label="Año" value="" />
                  {years.map((year) => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔧 Técnicomecánica - ¿Aplica?</Text>
              <Picker
                selectedValue={technicalExpiry.applies}
                onValueChange={(value) => {
                  console.log('Technical applies selected:', value);
                  updateExpiryField('technicalExpiry', 'applies', value);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Si" value="Si" />
                <Picker.Item label="No" value="No" />
              </Picker>
            </View>

            {technicalExpiry.applies === 'Si' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>🔧 Técnicomecánica - Fecha de vencimiento</Text>
                <View style={styles.dateContainer}>
                  <Picker
                    selectedValue={technicalExpiry.month}
                    onValueChange={(value) => {
                      console.log('Technical Month selected:', value);
                      updateExpiryField('technicalExpiry', 'month', value);
                    }}
                    style={[styles.picker, styles.halfPicker]}
                  >
                    <Picker.Item label="Mes" value="" />
                    {months.map((month, index) => (
                      <Picker.Item key={index} label={month} value={month} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={technicalExpiry.year}
                    onValueChange={(value) => {
                      console.log('Technical Year selected:', value);
                      updateExpiryField('technicalExpiry', 'year', value);
                    }}
                    style={[styles.picker, styles.halfPicker]}
                  >
                    <Picker.Item label="Año" value="" />
                    {years.map((year) => (
                      <Picker.Item key={year} label={year} value={year} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>
    </Animated.View>
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
    paddingTop: 8,
    paddingBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
  picker: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    marginTop: 2,
    height: 50,
    minHeight: 50,
    maxHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  halfPicker: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 100,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
});

export default VehicleHistoryForm; 