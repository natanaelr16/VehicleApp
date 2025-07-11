import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppStore } from '../stores/appStore';
import { InspectionForm } from '../types';
import { RootStackParamList } from '../components/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { 
    savedInspections, 
    settings, 
    setCurrentInspection, 
    deleteInspection,
    clearCurrentInspection 
  } = useAppStore();

  const createNewInspection = () => {
    clearCurrentInspection();
    const newInspection: InspectionForm = {
      id: Date.now().toString(),
      vehicleInfo: {
        id: '',
        plate: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        vin: '',
        ownerName: '',
        ownerPhone: '',
      },
      inspectionDate: new Date(),
      inspectorName: settings.inspectorName,
      items: [],
      overallStatus: 'approved',
    };
    setCurrentInspection(newInspection);
    
    // Solución temporal: mostrar alerta en lugar de navegar
    Alert.alert(
      'Nueva Inspección Creada',
      'La inspección se ha creado correctamente. Para acceder al formulario, necesitamos configurar la navegación.',
      [
        { text: 'OK', onPress: () => console.log('OK Pressed') }
      ]
    );
    
    // Comentamos la navegación temporalmente
    // navigation.navigate('InspectionForm');
  };

  const loadInspection = (inspection: InspectionForm) => {
    setCurrentInspection(inspection);
    navigation.navigate('InspectionForm');
  };

  const handleDeleteInspection = (inspectionId: string, plate: string) => {
    Alert.alert(
      'Eliminar Inspección',
      `¿Estás seguro de que quieres eliminar la inspección del vehículo ${plate}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteInspection(inspectionId)
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header moderno con gradiente */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🚗 Inspección Vehicular</Text>
          <Text style={styles.subtitle}>{settings.companyName}</Text>
          <Text style={styles.welcomeText}>Bienvenido al sistema de inspecciones</Text>
        </View>
      </View>

      {/* Botón principal de nueva inspección */}
      <TouchableOpacity style={styles.newInspectionButton} onPress={createNewInspection}>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonIcon}>➕</Text>
          <Text style={styles.newInspectionText}>Nueva Inspección</Text>
          <Text style={styles.buttonSubtext}>Crear inspección desde cero</Text>
        </View>
      </TouchableOpacity>

      {/* Estadísticas modernas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statNumber}>{savedInspections.length}</Text>
          <Text style={styles.statLabel}>Total Inspecciones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statNumber}>
            {savedInspections.filter(i => i.overallStatus === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Aprobadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>❌</Text>
          <Text style={styles.statNumber}>
            {savedInspections.filter(i => i.overallStatus === 'rejected').length}
          </Text>
          <Text style={styles.statLabel}>Rechazadas</Text>
        </View>
      </View>

      {/* Sección de inspecciones recientes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Inspecciones Recientes</Text>
          <Text style={styles.sectionSubtitle}>
            {savedInspections.length} inspección{savedInspections.length !== 1 ? 'es' : ''} guardada{savedInspections.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {savedInspections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateText}>
              No hay inspecciones guardadas
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Crea tu primera inspección tocando el botón de arriba
            </Text>
          </View>
        ) : (
          savedInspections.slice(0, 5).map((inspection) => (
            <TouchableOpacity
              key={inspection.id}
              style={styles.inspectionCard}
              onPress={() => loadInspection(inspection)}
              onLongPress={() => handleDeleteInspection(inspection.id, inspection.vehicleInfo.plate)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.plateContainer}>
                  <Text style={styles.plateIcon}>🚗</Text>
                  <Text style={styles.plateText}>{inspection.vehicleInfo.plate || 'Sin placa'}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(inspection.overallStatus) }
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(inspection.overallStatus)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.vehicleInfo}>
                  {inspection.vehicleInfo.brand} {inspection.vehicleInfo.model} ({inspection.vehicleInfo.year})
                </Text>
                <View style={styles.cardDetails}>
                  <Text style={styles.dateText}>
                    📅 {formatDate(inspection.inspectionDate)}
                  </Text>
                  <Text style={styles.inspectorText}>
                    👤 {inspection.inspectorName || 'Sin asignar'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Footer con información adicional */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Mantén presionado una inspección para eliminarla
        </Text>
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return '#27ae60';
    case 'rejected': return '#e74c3c';
    case 'conditional': return '#f39c12';
    default: return '#95a5a6';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'approved': return 'Aprobado';
    case 'rejected': return 'Rechazado';
    case 'conditional': return 'Condicional';
    default: return 'Pendiente';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 30,
    paddingTop: 50,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
  },
  welcomeText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.8,
  },
  newInspectionButton: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  newInspectionText: {
    color: '#2c3e50',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
    marginTop: 0,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    margin: 20,
    marginTop: 10,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  inspectionCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plateIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  plateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  inspectorText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
});

export default HomeScreen; 