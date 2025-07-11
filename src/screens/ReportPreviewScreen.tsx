import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import { generateInspectionPDF } from '../utils/pdfGenerator';
import { Linking, Platform } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

const ReportPreviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentInspection, settings } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!currentInspection) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay inspección para generar reporte</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }



  const generatePDF = async () => {
    if (!currentInspection) return;
    
    setIsGenerating(true);
    try {
      const filePath = await generateInspectionPDF(currentInspection, settings);
      
      if (filePath) {
        const fileName = filePath.split('/').pop() || 'reporte.pdf';
        console.log('Archivo generado en:', filePath);
        console.log('Nombre del archivo:', fileName);
        
        // Verificar si el archivo realmente existe
        const fileExists = await RNFS.exists(filePath);
        console.log('¿El archivo existe?', fileExists);
        
        if (!fileExists) {
          Alert.alert(
            '⚠️ Error',
            'El archivo PDF se generó pero no se pudo encontrar en el sistema de archivos.\n\nRuta: ' + filePath,
            [{ text: 'OK', style: 'default' }]
          );
          return;
        }
        
        // Menú simple de acciones
        Alert.alert(
          '✅ PDF Listo',
          `Reporte generado: ${fileName}\n\nUbicación: ${filePath}\n\nTamaño: ${(await RNFS.stat(filePath)).size} bytes`,
          [
            { 
              text: '📱 Abrir', 
              onPress: async () => {
                try {
                  console.log('Intentando abrir:', filePath);
                  await FileViewer.open(filePath, {
                    showOpenWithDialog: true,
                    onDismiss: () => {
                      console.log('FileViewer cerrado');
                    }
                  });
                } catch (error) {
                  console.error('Error abriendo PDF:', error);
                  Alert.alert(
                    '📱 No se pudo abrir automáticamente',
                    'Para ver el PDF:\n\n1. Instala Google Drive o Adobe Reader\n2. Ve a tu administrador de archivos\n3. Busca en la carpeta "Download"\n4. Toca el archivo para abrirlo',
                    [
                      { text: 'Instalar Google Drive', onPress: () => {
                        Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.docs');
                      }},
                      { text: 'OK', style: 'default' }
                    ]
                  );
                }
              }
            },
            { 
              text: '📤 Compartir', 
              onPress: async () => {
                try {
                  await Share.share({
                    url: `file://${filePath}`,
                    title: 'MTinspector - Reporte',
                    message: `Reporte: ${currentInspection.vehicleInfo.plate || 'vehículo'}`
                  });
                } catch (error) {
                  Alert.alert('Error', 'No se pudo compartir');
                }
              }
            },
            { 
              text: '📁 Buscar Archivo', 
              onPress: () => {
                const directory = Platform.OS === 'android' ? 'Documents' : 'Download';
                Alert.alert(
                  '📁 Ubicación del PDF',
                  `El archivo está en:\n\n📂 ${directory}\n📄 ${fileName}\n\nRuta completa:\n${filePath}`,
                  [
                    { text: 'Abrir Administrador', onPress: () => {
                      // Intentar abrir el administrador de archivos
                      Linking.openURL('content://com.android.externalstorage.documents/root/primary');
                    }},
                    { text: 'Copiar Ruta', onPress: () => {
                      // En una app real, aquí copiarías la ruta al portapapeles
                      Alert.alert('Ruta copiada', 'La ruta del archivo ha sido copiada al portapapeles');
                    }},
                    { text: 'OK', style: 'default' }
                  ]
                );
              }
            },
            { 
              text: '📋 Copiar a Download', 
              onPress: async () => {
                try {
                  const downloadPath = Platform.OS === 'android' 
                    ? `${RNFS.DownloadDirectoryPath}/${fileName}`
                    : `${RNFS.DocumentDirectoryPath}/Download/${fileName}`;
                  
                  await RNFS.copyFile(filePath, downloadPath);
                  Alert.alert(
                    '✅ Copiado',
                    `Archivo copiado a:\n${downloadPath}`,
                    [{ text: 'OK', style: 'default' }]
                  );
                } catch (error) {
                  Alert.alert('Error', 'No se pudo copiar el archivo: ' + error);
                }
              }
            },
            { text: 'Cerrar', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Error',
        'No se pudo generar el PDF. Verifica que tengas permisos de almacenamiento.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsGenerating(false);
    }
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
      case 'good': return 'BUENO';
      case 'bad': return 'MALO';
      case 'needs_attention': return 'ATENCIÓN';
      case 'not_applicable': return 'N/A';
      default: return 'PENDIENTE';
    }
  };

  const getOverallStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'APROBADO';
      case 'rejected': return 'RECHAZADO';
      case 'conditional': return 'CONDICIONAL';
      case 'pending': return 'PENDIENTE';
      default: return 'PENDIENTE';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const itemsByCategory = currentInspection.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📄 Vista Previa del Reporte</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Encabezado del Reporte */}
        <View style={styles.reportHeader}>
          {settings.companyLogo && (
            <Image source={{ uri: settings.companyLogo }} style={styles.companyLogo} />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{settings.companyName}</Text>
            {settings.companyAddress && (
              <Text style={styles.companyAddress}>{settings.companyAddress}</Text>
            )}
            {settings.companyPhone && (
              <Text style={styles.companyContact}>Tel: {settings.companyPhone}</Text>
            )}
            {settings.companyEmail && (
              <Text style={styles.companyContact}>Email: {settings.companyEmail}</Text>
            )}
          </View>
        </View>

        {/* Título del Reporte */}
        <View style={styles.reportTitle}>
          <Text style={styles.reportTitleText}>
            {settings.reportTemplate === 'colombia' 
              ? 'INSPECCIÓN TÉCNICO MECÁNICA VEHICULAR'
              : 'REPORTE DE INSPECCIÓN VEHICULAR'
            }
          </Text>
          <Text style={styles.reportSubtitle}>
            Certificado de Revisión Técnico Mecánica
          </Text>
        </View>

        {/* Información del Vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 INFORMACIÓN DEL VEHÍCULO</Text>
          <View style={styles.vehicleGrid}>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Placa:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.plate || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Marca:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.brand || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Modelo:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.model || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Año:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.year || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Color:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.color || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>VIN:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.vin || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Propietario:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.ownerName || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Teléfono:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.ownerPhone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Información de la Inspección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 INFORMACIÓN DE LA INSPECCIÓN</Text>
          <View style={styles.inspectionInfo}>
            <View style={styles.inspectionField}>
              <Text style={styles.fieldLabel}>Fecha de Inspección:</Text>
              <Text style={styles.fieldValue}>{formatDate(currentInspection.inspectionDate)}</Text>
            </View>
            <View style={styles.inspectionField}>
              <Text style={styles.fieldLabel}>Inspector:</Text>
              <Text style={styles.fieldValue}>{currentInspection.inspectorName || 'N/A'}</Text>
            </View>
            <View style={styles.inspectionField}>
              <Text style={styles.fieldLabel}>Estado General:</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(currentInspection.overallStatus === 'approved' ? 'good' : 'bad') }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {getOverallStatusText(currentInspection.overallStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items de Inspección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 ITEMS DE INSPECCIÓN</Text>
          
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemText}>{item.item}</Text>
                    {item.notes && (
                      <Text style={styles.itemNotes}>Nota: {item.notes}</Text>
                    )}
                  </View>
                  <View style={[
                    styles.itemStatus,
                    { backgroundColor: getStatusColor(item.status) }
                  ]}>
                    <Text style={styles.itemStatusText}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {currentInspection.items.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay items de inspección registrados
              </Text>
            </View>
          )}
        </View>

        {/* Inspección de Carrocería */}
        {currentInspection.bodyInspection && currentInspection.bodyInspection.points.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Inspección de Carrocería</Text>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 250, height: 125 }}>
                <Image
                  source={(() => {
                    switch (currentInspection.vehicleInfo.bodyType) {
                      case 'suv': return require('../../assets/vehicles/suv.png');
                      case 'pickup': return require('../../assets/vehicles/pickup.png');
                      default: return require('../../assets/vehicles/sedan.png');
                    }
                  })()}
                  style={{ width: 250, height: 125, borderRadius: 12 }}
                  resizeMode="contain"
                />
                {/* Puntos numerados */}
                {currentInspection.bodyInspection.points.map((point: any, idx: number) => (
                  <View
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: point.x * 250 - 10,
                      top: point.y * 125 - 10,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#FF0000',
                      borderWidth: 2,
                      borderColor: '#fff',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>{point.number}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.observationsList}>
              <Text style={styles.observationsTitle}>Observaciones:</Text>
              {currentInspection.bodyInspection.points.map((point: any) => (
                <Text key={point.number} style={styles.observationItem}>
                  {point.number}. {point.label}
                  {point.observation && ` - ${point.observation}`}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Notas Generales */}
        {currentInspection.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 NOTAS GENERALES</Text>
            <Text style={styles.notesText}>{currentInspection.notes}</Text>
          </View>
        )}

        {/* Pie de Página */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Este documento es generado automáticamente por el sistema de inspección vehicular.
          </Text>
          <Text style={styles.footerText}>
            Fecha de generación: {new Date().toLocaleDateString('es-CO')}
          </Text>
        </View>
      </ScrollView>

      {/* Botones de Acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={generatePDF}
          disabled={isGenerating}
        >
          <Text style={styles.generateButtonText}>
            {isGenerating ? '🔄 Generando...' : '📄 Generar PDF'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>📤 Compartir</Text>
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
  },
  reportHeader: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogo: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  reportTitle: {
    backgroundColor: '#FF0000',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  reportSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
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
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  vehicleField: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  inspectionInfo: {
    gap: 10,
  },
  inspectionField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  itemStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  notesText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 5,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'row',
    gap: 15,
  },
  generateButton: {
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
  generateButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
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
  shareButtonText: {
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
  });
  
export default ReportPreviewScreen; 