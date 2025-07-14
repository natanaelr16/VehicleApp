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
import CustomAlert from '../components/CustomAlert';
import { formatDateForDisplay } from '../utils/dateUtils';

const ReportPreviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentInspection, settings, saveInspection } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress: () => void; style?: 'primary' | 'secondary' | 'danger' }>;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Auto-guardar al generar preview
  React.useEffect(() => {
    if (currentInspection) {
      saveInspection();
    }
  }, [currentInspection, saveInspection]);

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
    
    // Mostrar diálogo de confirmación personalizado
    setCustomAlert({
      visible: true,
      title: 'Generar PDF Oficial',
      message: '¿Estás seguro de que deseas generar el PDF oficial de la inspección?\n\nEste documento será guardado automáticamente.',
      buttons: [
        {
          text: 'Cancelar',
          onPress: () => setCustomAlert({ visible: false, title: '', message: '', buttons: [] }),
          style: 'secondary',
        },
        {
          text: 'Generar PDF',
          onPress: async () => {
            setCustomAlert({ visible: false, title: '', message: '', buttons: [] });
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
                  setCustomAlert({
                    visible: true,
                    title: 'Error',
                    message: 'El archivo PDF se generó pero no se pudo encontrar en el sistema de archivos.\n\nRuta: ' + filePath,
                    buttons: [
                      {
                        text: 'Entendido',
                        onPress: () => setCustomAlert({ visible: false, title: '', message: '', buttons: [] }),
                        style: 'primary',
                      },
                    ],
                  });
                  return;
                }
                
                // Mostrar diálogo de éxito con opciones
                setCustomAlert({
                  visible: true,
                  title: 'PDF Generado',
                  message: `${fileName}\n\nEl reporte se guardó correctamente.\n\n¿Deseas abrirlo o compartirlo?`,
                  buttons: [
                    {
                      text: 'Compartir',
                      onPress: async () => {
                        setCustomAlert({ visible: false, title: '', message: '', buttons: [] });
                        try {
                          const success = await shareFileWithFallback(filePath);
                          if (!success) {
                            console.log('Compartir cancelado por el usuario');
                          }
                        } catch (error) {
                          console.error('Error compartiendo archivo:', error);
                          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                          setCustomAlert({
                            visible: true,
                            title: 'Error al Compartir',
                            message: `No se pudo compartir el archivo PDF.\n\nError: ${errorMessage}\n\nRuta: ${filePath}\n\nAsegúrate de que:\n• El archivo existe\n• Tienes permisos de almacenamiento\n• La app de destino soporta archivos PDF`,
                            buttons: [
                              {
                                text: 'Entendido',
                                onPress: () => setCustomAlert({ visible: false, title: '', message: '', buttons: [] }),
                                style: 'primary',
                              },
                            ],
                          });
                        }
                      },
                      style: 'primary',
                    },
                    {
                      text: 'Abrir PDF',
                      onPress: async () => {
                        setCustomAlert({ visible: false, title: '', message: '', buttons: [] });
                        try {
                          await FileViewer.open(filePath, {
                            showOpenWithDialog: true,
                            onDismiss: () => {},
                          });
                        } catch (error) {
                          setCustomAlert({
                            visible: true,
                            title: 'No se pudo abrir',
                            message: 'Instala Google Drive o Adobe Reader para abrir el PDF.',
                            buttons: [
                              {
                                text: 'Entendido',
                                onPress: () => setCustomAlert({ visible: false, title: '', message: '', buttons: [] }),
                                style: 'primary',
                              },
                            ],
                          });
                        }
                      },
                      style: 'secondary',
                    },
                  ],
                });
              }
            } catch (error) {
              setCustomAlert({
                visible: true,
                title: 'Error al Generar PDF',
                message: 'No se pudo generar el PDF. Verifica que tengas permisos de almacenamiento.',
                buttons: [
                  {
                    text: 'Entendido',
                    onPress: () => setCustomAlert({ visible: false, title: '', message: '', buttons: [] }),
                    style: 'primary',
                  },
                ],
              });
            } finally {
              setIsGenerating(false);
            }
          },
          style: 'primary',
        },
      ],
    });
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

  const shareFileWithFallback = async (filePath: string) => {
    try {
      // Verificar que el archivo existe
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        throw new Error('El archivo PDF no existe en la ruta especificada');
      }

      // Obtener información del archivo
      const fileStats = await RNFS.stat(filePath);
      console.log('Información del archivo a compartir:', {
        path: filePath,
        size: fileStats.size,
        exists: fileExists,
        platform: Platform.OS
      });

      // Intentar compartir con diferentes formatos de URL según la plataforma
      let shareUrl = filePath;
      if (Platform.OS === 'android') {
        // En Android, usar file:// protocol
        shareUrl = `file://${filePath}`;
      } else if (Platform.OS === 'ios') {
        // En iOS, usar la ruta directa
        shareUrl = filePath;
      }

      console.log('Intentando compartir con URL:', shareUrl);

      const shareResult = await Share.share({
        url: shareUrl,
        title: 'MTinspector - Reporte de Inspección',
        message: `Reporte de inspección: ${currentInspection.vehicleInfo.plate || 'vehículo'} - ${new Date().toLocaleDateString('es-CO')}`,
      });

      console.log('Resultado del compartir:', shareResult);
      
      if (shareResult.action === Share.sharedAction) {
        console.log('✅ Archivo compartido exitosamente');
        return true;
      } else if (shareResult.action === Share.dismissedAction) {
        console.log('❌ Compartir cancelado por el usuario');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error en shareFileWithFallback:', error);
      throw error;
    }
  };



  // Definir el listado fijo agrupado para mostrar en el PDF
  const inspectionGroups = [
    {
      title: 'Luces y Exterior',
      items: [
        'Luz Placa trasera', 'Luces altas', 'Luces bajas', 'Luces medias',
        'Direccional del Der', 'Direccional Del Izq', 'Luces Freno', 'Luces reversa',
        'Stop derecho', 'Stop izquiero', 'Tercer Stop', 'Exploradora derecha',
        'Exploradora izquierda', 'Farola derecha', 'Farola izquiera',
        'Puntas Chasis del Der', 'Puntas Chasis del Izq', 'Puntas Chasis tras Der', 'Puntas Chasis tras Izq',
      ]
    },
    {
      title: 'Motor y Soportes',
      items: [
        'Base Motor Der', 'Base Motor Izq', 'Fugas Aceite Motor', 'Fugas Aceite caja transmsion'
      ]
    },
    {
      title: 'Interior del Vehículo',
      items: [
        'Consola', 'Radio', 'Guantera', 'Cojineria', 'Forros', 'Tapetes', 'Visera',
        'Descansabrazos', 'Reposa cabezas', 'Sunroof', 'Antena',
        'Elevavidrios delanteross', 'Elevavidrios traseros'
      ]
    }
  ];

  // Función para obtener el estado de un item específico
  const getItemStatus = (itemName: string) => {
    const item = currentInspection.items.find(i => i.item === itemName);
    return item ? item.status : 'not_applicable';
  };

  const getItemNotes = (itemName: string) => {
    const item = currentInspection.items.find(i => i.item === itemName);
    return item ? item.notes : '';
  };

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



        {/* Información de Fecha y Hora de Ingreso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 INFORMACIÓN DE INGRESO</Text>
          <View style={styles.inspectionInfo}>
            <View style={styles.inspectionField}>
              <Text style={styles.fieldLabel}>Fecha de Ingreso:</Text>
              <Text style={styles.fieldValue}>{currentInspection.fechaIngreso || 'N/A'}</Text>
            </View>
            <View style={styles.inspectionField}>
              <Text style={styles.fieldLabel}>Hora de Ingreso:</Text>
              <Text style={styles.fieldValue}>{currentInspection.horaIngreso || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Información del Vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 DATOS DEL VEHÍCULO</Text>
          <View style={styles.vehicleGrid}>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Placa:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.plate || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Propietario:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.ownerName || 'N/A'}</Text>
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
              <Text style={styles.fieldLabel}>Color:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.color || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Año:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.year || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Teléfono:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleInfo.ownerPhone || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Tipo de Carrocería:</Text>
              <Text style={styles.fieldValue}>
                {currentInspection.vehicleInfo.bodyType === 'sedan' ? 'Sedán' : 
                 currentInspection.vehicleInfo.bodyType === 'suv' ? 'SUV' : 
                 currentInspection.vehicleInfo.bodyType === 'pickup' ? 'Pickup' : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Foto del Vehículo - Tarjeta Individual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 FOTO DEL VEHÍCULO</Text>
          <View style={styles.vehiclePhotoCard}>
            {currentInspection.vehicleInfo.vehiclePhoto ? (
              <Image 
                source={{ uri: currentInspection.vehicleInfo.vehiclePhoto }} 
                style={styles.vehiclePhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noPhotoCard}>
                <Text style={styles.noPhotoText}>📷</Text>
                <Text style={styles.noPhotoLabel}>NO PHOTO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Precio Sugerido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💲 PRECIO SUGERIDO</Text>
          <Text style={styles.priceValue}>
            {currentInspection.precioSugerido ? `$${currentInspection.precioSugerido}` : 'No ingresado'}
          </Text>
        </View>

        {/* Datos RUNT Completos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 DATOS RUNT COMPLETOS</Text>
          <View style={styles.vehicleGrid}>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Multas SIMIT:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleHistory?.simitFines || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Pignoración:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleHistory?.pignoracion || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Timbre:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleHistory?.timbreValue || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Imp. Gobernación:</Text>
              <Text style={styles.fieldValue}>
                {currentInspection.vehicleHistory?.governorTax?.status || 'N/A'}
                {currentInspection.vehicleHistory?.governorTax?.status === 'DEBE' && currentInspection.vehicleHistory?.governorTax?.amount 
                  ? ` - $${currentInspection.vehicleHistory.governorTax.amount}` : ''}
              </Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Imp. Movilidad:</Text>
              <Text style={styles.fieldValue}>
                {currentInspection.vehicleHistory?.mobilityTax?.status || 'N/A'}
                {currentInspection.vehicleHistory?.mobilityTax?.status === 'DEBE' && currentInspection.vehicleHistory?.mobilityTax?.amount 
                  ? ` - $${currentInspection.vehicleHistory.mobilityTax.amount}` : ''}
              </Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>SOAT:</Text>
              <Text style={styles.fieldValue}>
                {currentInspection.vehicleHistory?.soatExpiry?.month || ''} {currentInspection.vehicleHistory?.soatExpiry?.year || ''}
              </Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Tecnomecánica:</Text>
              <Text style={styles.fieldValue}>
                {currentInspection.vehicleHistory?.technicalExpiry?.applies === 'No' ? 'No aplica' : 
                 (currentInspection.vehicleHistory?.technicalExpiry?.month && currentInspection.vehicleHistory?.technicalExpiry?.year 
                   ? `${currentInspection.vehicleHistory.technicalExpiry.month} ${currentInspection.vehicleHistory.technicalExpiry.year}` 
                   : 'N/A')}
              </Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Cilindraje:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleHistory?.engineDisplacement || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Combustible:</Text>
              <Text style={styles.fieldValue}>
                {currentInspection.vehicleHistory?.fuelType || 'N/A'}
                {currentInspection.vehicleHistory?.fuelType === 'Otro' && currentInspection.vehicleHistory?.otherFuelType 
                  ? ` (${currentInspection.vehicleHistory.otherFuelType})` : ''}
              </Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Kilometraje:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleHistory?.mileage || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Matriculado en:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleHistory?.registrationCity || 'N/A'}</Text>
            </View>
            <View style={styles.vehicleField}>
              <Text style={styles.fieldLabel}>Fasecolda:</Text>
              <Text style={styles.fieldValue}>{currentInspection.vehicleHistory?.fasecoldaReports || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Sugerencias de Diagnóstico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 SUGERENCIAS DE DIAGNÓSTICO</Text>
          {(currentInspection.sugerenciasDiagnostico && currentInspection.sugerenciasDiagnostico.length > 0) ? (
            currentInspection.sugerenciasDiagnostico.map((s, idx) => (
              <Text key={idx} style={styles.diagnosisItem}>• {s}</Text>
            ))
          ) : (
            <Text style={styles.emptyDiagnosis}>No hay sugerencias registradas.</Text>
          )}
        </View>

        {/* Resultado de Inspección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ RESULTADO DE INSPECCIÓN</Text>
          <View style={[
            styles.resultBox,
            { 
              backgroundColor: currentInspection.resultadoInspeccion === 'approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 0, 0, 0.1)',
              borderColor: currentInspection.resultadoInspeccion === 'approved' ? '#4CAF50' : '#FF0000'
            }
          ]}>
            <Text style={[
              styles.resultText,
              { 
                color: currentInspection.resultadoInspeccion === 'approved' ? '#4CAF50' : '#FF0000'
              }
            ]}>
              {currentInspection.resultadoInspeccion === 'approved' ? '✅ APROBADO' : '❌ NO APROBADO'}
            </Text>
          </View>
        </View>

        {/* Items de Inspección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 ITEMS DE INSPECCIÓN</Text>
          
          {inspectionGroups.map((group, groupIndex) => (
            <View key={group.title} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{group.title.toUpperCase()}</Text>
              {group.items.map((itemName) => {
                const status = getItemStatus(itemName);
                const notes = getItemNotes(itemName);
                return (
                  <View key={itemName} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemText}>{itemName}</Text>
                      {notes && (
                        <Text style={styles.itemNotes}>Nota: {notes}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.itemStatus,
                      { backgroundColor: getStatusColor(status) }
                    ]}>
                      <Text style={styles.itemStatusText}>
                        {getStatusText(status)}
                      </Text>
                    </View>
                  </View>
                );
              })}
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

        {/* Inspección de Llantas */}
        {currentInspection.tireInspection && currentInspection.tireInspection.measurements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛞 Inspección de Llantas</Text>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 250, height: 150 }}>
                <Image
                  source={require('../../assets/vehicles/vehicle-skeleton.png')}
                  style={{ width: 250, height: 150, borderRadius: 12 }}
                  resizeMode="contain"
                />
                {/* Puntos de llantas medidas */}
                {currentInspection.tireInspection.measurements.map((measurement: any) => {
                  const getColorByValue = (value: number) => {
                    if (value < 1.40) return '#FF0000'; // rojo
                    if (value <= 2.8) return '#FF9800'; // naranja
                    if (value <= 4.5) return '#FFD600'; // amarillo
                    if (value <= 6.34) return '#4CAF50'; // verde
                    return '#2196F3';
                  };
                  
                  const color = getColorByValue(measurement.value);
                  const cx = measurement.x * 250;
                  const cy = measurement.y * 150;
                  const dx = 35;
                  const dy = -25;
                  const labelX = cx + dx;
                  const labelY = cy + dy;
                  
                  return (
                    <React.Fragment key={measurement.id}>
                      {/* Punto pequeño */}
                      <View
                        style={{
                          position: 'absolute',
                          left: cx - 4,
                          top: cy - 4,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: color,
                          borderWidth: 1,
                          borderColor: '#fff',
                          zIndex: 3
                        }}
                      />
                      {/* Línea diagonal */}
                      <View
                        style={{
                          position: 'absolute',
                          left: cx,
                          top: cy,
                          width: Math.sqrt((labelX - cx) ** 2 + (labelY - cy) ** 2),
                          height: 1,
                          backgroundColor: color,
                          zIndex: 2,
                          transform: [
                            {
                              rotate: `${Math.atan2(labelY - cy, labelX - cx) * (180 / Math.PI)}deg`
                            }
                          ],
                          transformOrigin: '0 0'
                        }}
                      />
                      {/* Etiqueta */}
                      <View
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
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 8 }}>{measurement.title}</Text>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>{measurement.value.toFixed(2)}</Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
            <View style={styles.observationsList}>
              <Text style={styles.observationsTitle}>Mediciones de Llantas:</Text>
              
              {/* Leyenda de colores */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#4CAF50', borderRadius: 6, marginRight: 4 }} />
                  <Text style={{ fontSize: 10, color: '#666' }}>Bueno (4.5-6.34mm)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#FFD600', borderRadius: 6, marginRight: 4 }} />
                  <Text style={{ fontSize: 10, color: '#666' }}>Regular (2.8-4.5mm)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#FF9800', borderRadius: 6, marginRight: 4 }} />
                  <Text style={{ fontSize: 10, color: '#666' }}>Atención (1.4-2.8mm)</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#FF0000', borderRadius: 6, marginRight: 4 }} />
                  <Text style={{ fontSize: 10, color: '#666' }}>Crítico (&lt;1.4mm)</Text>
                </View>
              </View>
              {currentInspection.tireInspection.measurements.map((measurement: any) => {
                const getStatusByValue = (value: number) => {
                  if (value < 1.40) return 'CRÍTICO';
                  if (value <= 2.8) return 'ATENCIÓN';
                  if (value <= 4.5) return 'REGULAR';
                  if (value <= 6.34) return 'BUENO';
                  return 'N/A';
                };
                
                const getStatusColor = (value: number) => {
                  if (value < 1.40) return '#FF0000';
                  if (value <= 2.8) return '#FF9800';
                  if (value <= 4.5) return '#FFD600';
                  if (value <= 6.34) return '#4CAF50';
                  return '#2196F3';
                };
                
                return (
                  <View key={measurement.id} style={styles.tireMeasurementItem}>
                    <Text style={styles.tireMeasurementText}>
                      {measurement.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.tireMeasurementValue, { color: getStatusColor(measurement.value) }]}>
                        {measurement.value.toFixed(2)} mm
                      </Text>
                      <View style={{
                        width: 44,
                        height: 18,
                        paddingHorizontal: 0,
                        borderRadius: 9,
                        backgroundColor: getStatusColor(measurement.value),
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                      }}>
                        <Text style={{
                          color: 'white',
                          fontSize: 9,
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}>
                          {getStatusByValue(measurement.value)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Estado de Batería */}
        {currentInspection.tireInspection?.batteryStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔋 Estado de Batería</Text>
            <View style={styles.vehicleGrid}>
              <View style={styles.vehicleField}>
                <Text style={styles.fieldLabel}>Porcentaje de carga:</Text>
                <Text style={styles.fieldValue}>
                  {currentInspection.tireInspection.batteryStatus.percentage}%
                </Text>
              </View>
            </View>
            {currentInspection.tireInspection.batteryStatus.observations && (
              <View style={styles.observationsList}>
                <Text style={styles.observationsTitle}>Observaciones:</Text>
                <Text style={styles.observationItem}>
                  {currentInspection.tireInspection.batteryStatus.observations}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Estado de Líquido de Frenos */}
        {currentInspection.tireInspection?.brakeFluidLevel && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛑 Estado de Líquido de Frenos</Text>
            <View style={styles.vehicleGrid}>
              <View style={styles.vehicleField}>
                <Text style={styles.fieldLabel}>Nivel:</Text>
                <Text style={styles.fieldValue}>
                  {currentInspection.tireInspection.brakeFluidLevel.level}
                </Text>
              </View>
            </View>
            {currentInspection.tireInspection.brakeFluidLevel.observations && (
              <View style={styles.observationsList}>
                <Text style={styles.observationsTitle}>Observaciones:</Text>
                <Text style={styles.observationItem}>
                  {currentInspection.tireInspection.brakeFluidLevel.observations}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Inspección Fotográfica */}
        {currentInspection.inspectionPhotos && currentInspection.inspectionPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Inspección Fotográfica</Text>
            <Text style={styles.observationsTitle}>
              Fotos registradas: {currentInspection.inspectionPhotos.length}
            </Text>
            <View style={styles.photosGrid}>
              {currentInspection.inspectionPhotos
                .sort((a, b) => a.label - b.label)
                .map((photo) => (
                  <View key={photo.id} style={styles.photoItem}>
                    <Image 
                      source={{ uri: photo.uri }} 
                      style={styles.photoThumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.photoInfo}>
                      <Text style={styles.photoLabel}>Foto #{photo.label}</Text>
                      {photo.observations && (
                        <Text style={styles.photoObservations} numberOfLines={2}>
                          {photo.observations}
                        </Text>
                      )}
                      <Text style={styles.photoDate}>
                        {formatDateForDisplay(photo.timestamp)}
                      </Text>
                    </View>
                  </View>
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

        {/* Sugerencias de Diagnóstico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 SUGERENCIAS DE DIAGNÓSTICO</Text>
          {(currentInspection.sugerenciasDiagnostico && currentInspection.sugerenciasDiagnostico.length > 0) ? (
            currentInspection.sugerenciasDiagnostico.map((s, idx) => (
              <Text key={idx} style={{ fontSize: 14, color: '#2c3e50', marginBottom: 4 }}>• {s}</Text>
            ))
          ) : (
            <Text style={{ fontSize: 14, color: '#888', fontStyle: 'italic' }}>No hay sugerencias registradas.</Text>
          )}
        </View>

        {/* Precio Sugerido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💲 PRECIO SUGERIDO</Text>
          <Text style={{ fontSize: 16, color: '#222', fontWeight: 'bold', marginBottom: 8 }}>
            {currentInspection.precioSugerido ? `$${currentInspection.precioSugerido}` : 'No ingresado'}
          </Text>
        </View>

        {/* Resultado de Inspección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ RESULTADO DE INSPECCIÓN</Text>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color:
              currentInspection.resultadoInspeccion === 'approved' ? '#4CAF50'
              : currentInspection.resultadoInspeccion === 'rejected' ? '#FF0000'
              : '#888',
            marginBottom: 8
          }}>
            {currentInspection.resultadoInspeccion === 'approved' ? 'Aprobado'
              : currentInspection.resultadoInspeccion === 'rejected' ? 'No Aprobado'
              : 'Sin resultado'}
          </Text>
        </View>

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
            {isGenerating ? 'Generando...' : 'Generar PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Diálogo personalizado */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        onDismiss={() => setCustomAlert({ visible: false, title: '', message: '', buttons: [] })}
      />
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
    marginHorizontal: 0,
  },
  generateButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  generateButtonText: {
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
  tireMeasurementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  tireMeasurementText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  tireMeasurementValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photoItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  photoThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoInfo: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 4,
  },
  photoObservations: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 12,
    color: '#999',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  diagnosisItem: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    paddingLeft: 10,
  },
  emptyDiagnosis: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  legalDisclaimer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
    borderRadius: 8,
  },
  legalDisclaimerText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  legalDisclaimerBold: {
    fontWeight: 'bold',
  },
  resultBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginVertical: 10,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vehicleInfoContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  vehicleDataContainer: {
    flex: 1,
  },
  vehiclePhotoContainer: {
    width: 250,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  vehiclePhoto: {
    width: 300,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: 'white',
  },
  vehiclePhotoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  noPhotoCard: {
    width: 300,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPhotoText: {
    fontSize: 48,
    color: '#ccc',
    marginBottom: 8,
  },
  noPhotoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  vehiclePhotoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  });
  
export default ReportPreviewScreen; 