import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useAppStore } from '../stores/appStore';
import { InspectionForm } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  InspectionForm: undefined;
  Settings: undefined;
  PhotoCapture: undefined;
  ReportPreview: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const { 
    savedInspections, 
    settings, 
    setCurrentInspection, 
    deleteInspection,
    clearCurrentInspection 
  } = useAppStore();

  const navigation = useNavigation<NavigationProp>();

  const createNewInspection = () => {
    clearCurrentInspection();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fecha = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newInspection: InspectionForm = {
      id: Date.now().toString(),
      vehicleInfo: {
        id: '',
        plate: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        ownerName: '',
        ownerPhone: '',
      },
      inspectionDate: now,
      inspectorName: settings.inspectorName,
      items: [],
      overallStatus: 'pending',
      fechaIngreso: fecha,
      horaIngreso: hora,
    };
    setCurrentInspection(newInspection);
    navigation.navigate('InspectionForm');
    
    // Mostrar mensaje de confirmación
    Alert.alert(
      '✅ Nueva Inspección Creada',
      'Se ha iniciado una nueva inspección. Completa los datos del vehículo y agrega los items de inspección.',
      [{ text: 'Entendido', style: 'default' }]
    );
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

  const getCardStatus = (inspection: InspectionForm) => {
    if (inspection.resultadoInspeccion === 'approved') return { color: '#4CAF50', text: 'Aprobado' };
    if (inspection.resultadoInspeccion === 'rejected') return { color: '#FF0000', text: 'Rechazado' };
    if (inspection.overallStatus === 'approved') return { color: '#4CAF50', text: 'Aprobado' };
    if (inspection.overallStatus === 'rejected') return { color: '#FF0000', text: 'Rechazado' };
    if (inspection.overallStatus === 'conditional') return { color: '#FF9800', text: 'Condicional' };
    return { color: '#9E9E9E', text: 'Pendiente' };
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.logoTitleContainer}>
            {settings.companyLogo && (
              <Image source={{ uri: settings.companyLogo }} style={styles.companyLogo} />
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Inspección Vehicular</Text>
              <Text style={styles.subtitle}>{settings.companyName}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.newInspectionButton} onPress={createNewInspection}>
        <Text style={styles.newInspectionText}>+ Nueva Inspección</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspecciones Recientes</Text>
        {savedInspections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay inspecciones guardadas
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Crea tu primera inspección tocando el botón de arriba
            </Text>
          </View>
        ) : (
          savedInspections.slice(0, 5).map((inspection) => {
            const status = getCardStatus(inspection);
            return (
              <TouchableOpacity
                key={inspection.id}
                style={styles.inspectionCard}
                onPress={() => loadInspection(inspection)}
                onLongPress={() => handleDeleteInspection(inspection.id, inspection.vehicleInfo.plate)}
              >
                <View style={styles.inspectionHeader}>
                  <Text style={styles.plateText}>{inspection.vehicleInfo.plate || 'Sin placa'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color }]}> 
                    <Text style={styles.statusText}>{status.text}</Text>
                  </View>
                </View>
                <Text style={styles.vehicleInfo}>
                  {inspection.vehicleInfo.brand} {inspection.vehicleInfo.model} ({inspection.vehicleInfo.year})
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(inspection.inspectionDate)}
                </Text>
                <Text style={styles.inspectorText}>
                  Inspector: {inspection.inspectorName || 'Sin asignar'}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{savedInspections.length}</Text>
          <Text style={styles.statLabel}>Total Inspecciones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{savedInspections.filter(i => (i.resultadoInspeccion || i.overallStatus) === 'approved').length}</Text>
          <Text style={styles.statLabel}>Aprobadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{savedInspections.filter(i => (i.resultadoInspeccion || i.overallStatus) === 'rejected').length}</Text>
          <Text style={styles.statLabel}>Rechazadas</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return '#4CAF50';
    case 'rejected': return '#FF0000';
    case 'conditional': return '#FF9800';
    default: return '#9E9E9E';
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'left',
    opacity: 0.8,
  },
  newInspectionButton: {
    backgroundColor: '#FF0000',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  newInspectionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  inspectionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  inspectorText: {
    fontSize: 12,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
  },
  settingsButtonText: {
    fontSize: 20,
    color: 'white',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 15,
    width: '100%',
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  companyLogo: {
    width: 100,
    height: 50,
    borderRadius: 6,
  },
});

export default HomeScreen; 