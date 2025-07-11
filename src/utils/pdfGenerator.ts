import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid } from 'react-native';
import { InspectionForm, AppSettings, BodyInspectionPoint, VehicleHistory, TireInspection } from '../types';
import { imageToBase64, validateImage } from './imageUtils';

export const generateInspectionPDF = async (
  inspection: InspectionForm,
  settings: AppSettings
): Promise<string | null> => {
  try {
    // Solicitar permisos en Android
    if (Platform.OS === 'android') {
      // Solicitar múltiples permisos
      const permissions = [
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      
      // Verificar si todos los permisos fueron concedidos
      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );
      
      if (!allGranted) {
        throw new Error('Se requieren permisos de almacenamiento para generar el PDF');
      }
    }

    const htmlContent = await generateHTMLContent(inspection, settings);
    
    const options = {
      html: htmlContent,
      fileName: `MTinspector_${inspection.vehicleInfo.plate || 'Vehiculo'}_${new Date().toISOString().split('T')[0]}`,
      directory: Platform.OS === 'android' ? 'Documents' : 'Download',
      base64: false,
    };

    console.log('Generando PDF con opciones:', options);
    const file = await RNHTMLtoPDF.convert(options);
    
    console.log('Resultado de generación:', file);
    
    if (file.filePath) {
      console.log('PDF generado exitosamente en:', file.filePath);
      return file.filePath;
    } else {
      console.error('No se obtuvo filePath del resultado:', file);
      throw new Error('No se pudo generar el archivo PDF');
    }
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};

const generateHTMLContent = async (inspection: InspectionForm, settings: AppSettings): Promise<string> => {
  // Convertir logo y marca de agua a base64 si es necesario
  let logoBase64 = '';
  let watermarkBase64 = '';
  if (settings.companyLogo && validateImage(settings.companyLogo)) {
    try {
      logoBase64 = await imageToBase64(settings.companyLogo);
    } catch (error) {
      console.error('Error convirtiendo logo a base64:', error);
    }
  }
  if (settings.watermarkLogo && validateImage(settings.watermarkLogo)) {
    try {
      watermarkBase64 = await imageToBase64(settings.watermarkLogo);
    } catch (error) {
      console.error('Error convirtiendo marca de agua a base64:', error);
    }
  }
  const getStatusText = (status: string) => {
    switch (status) {
      case 'good': return 'BUENO';
      case 'bad': return 'MALO';
      case 'needs_attention': return 'ATENCIÓN';
      case 'not_applicable': return 'N/A';
      default: return 'PENDIENTE';
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

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#FF0000';
      case 'conditional': return '#FF9800';
      case 'pending': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) {
      return new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    try {
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatVehicleHistory = (history: VehicleHistory | undefined) => {
    if (!history) {
      return '';
    }
    
    return `
      <div class="vehicle-history-section">
        <h3>📋 Historial del Vehículo (RUNT)</h3>
        <div class="history-grid">
          <div class="history-item">
            <strong>🚨 Multas SIMIT:</strong> ${history.simitFines || 'N/A'}
          </div>
          <div class="history-item">
            <strong>🔒 Pignoración:</strong> ${history.pignoracion || 'N/A'}
          </div>
          <div class="history-item">
            <strong>🏷️ Timbre:</strong> ${history.timbreValue || 'N/A'}
          </div>
          <div class="history-item">
            <strong>🏛️ Imp. Gobernación:</strong> ${history.governorTax?.status || 'N/A'}
            ${history.governorTax?.status === 'DEBE' && history.governorTax?.amount ? ` - $${history.governorTax.amount}` : ''}
          </div>
          <div class="history-item">
            <strong>🚗 Imp. Movilidad:</strong> ${history.mobilityTax?.status || 'N/A'}
            ${history.mobilityTax?.status === 'DEBE' && history.mobilityTax?.amount ? ` - $${history.mobilityTax.amount}` : ''}
          </div>
          <div class="history-item">
            <strong>🛡️ SOAT:</strong> ${history.soatExpiry?.month && history.soatExpiry?.year ? `${history.soatExpiry.month} ${history.soatExpiry.year}` : 'N/A'}
          </div>
          <div class="history-item">
            <strong>🔧 Técnicomecánica:</strong> ${history.technicalExpiry?.applies === 'No' ? 'No aplica' : (history.technicalExpiry?.month && history.technicalExpiry?.year ? `${history.technicalExpiry.month} ${history.technicalExpiry.year}` : 'N/A')}
          </div>
          <div class="history-item">
            <strong>🔧 Cilindraje:</strong> ${history.engineDisplacement || 'N/A'}
          </div>
          <div class="history-item">
            <strong>⛽ Combustible:</strong> ${history.fuelType || 'N/A'}
            ${history.fuelType === 'Otro' && history.otherFuelType ? ` (${history.otherFuelType})` : ''}
          </div>
          <div class="history-item">
            <strong>📏 Kilometraje:</strong> ${history.mileage || 'N/A'}
          </div>
          <div class="history-item">
            <strong>🏙️ Matrícula:</strong> ${history.registrationCity || 'N/A'}
          </div>
          <div class="history-item">
            <strong>📊 Fasecolda:</strong> ${history.fasecoldaReports || 'N/A'}
          </div>
        </div>
      </div>
    `;
  };

  // Calcular estadísticas
  const totalItems = inspection.items.length;
  const goodItems = inspection.items.filter(item => item.status === 'good').length;
  const attentionItems = inspection.items.filter(item => item.status === 'needs_attention').length;
  const badItems = inspection.items.filter(item => item.status === 'bad').length;
  const naItems = inspection.items.filter(item => item.status === 'not_applicable').length;

  const itemsHTML = inspection.items.map(item => {
    const isGood = item.status === 'good';
    const isAttention = item.status === 'needs_attention';
    const isBad = item.status === 'bad';
    
    return `
      <tr>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: left; font-size: 14px;">${item.item || 'Sin descripción'}</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
          ${isGood ? '<span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">✓</span>' : ''}
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
          ${isAttention ? '<span style="background: #FF9800; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">⚠</span>' : ''}
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
          ${isBad ? '<span style="background: #FF0000; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">✗</span>' : ''}
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: left; font-size: 12px; color: #666;">${item.notes || '-'}</td>
      </tr>
    `;
  }).join('');

  // Generar HTML para la inspección de carrocería si existe
  let bodyInspectionHTML = '';
  if (inspection.bodyInspection) {
    let vehicleImage;
    if (inspection.bodyInspection.capturedImage) {
      vehicleImage = inspection.bodyInspection.capturedImage;
    } else {
      // Usar una imagen placeholder para el tipo de vehículo
      const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
      vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="150" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
          <text x="150" y="75" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
        </svg>
      `);
    }

    bodyInspectionHTML = `
      <div style="margin: 30px 0; page-break-inside: avoid; background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #e0e0e0;">
        <h3 style="color: #000; border-bottom: 2px solid #FF0000; padding-bottom: 15px; margin-bottom: 20px; font-size: 20px;">
          🚗 Inspección de Carrocería
        </h3>
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1;">
            <p><strong>Tipo de Vehículo:</strong> ${inspection.vehicleInfo.bodyType || 'No especificado'}</p>
            <p><strong>Puntos Inspeccionados:</strong> 
              <span style="background: #FF0000; color: white; padding: 4px 8px; border-radius: 12px; font-weight: bold;">
                ${inspection.bodyInspection.points.length}
              </span>
            </p>
          </div>
        </div>
        
        ${inspection.bodyInspection.points.length > 0 ? `
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; border: 2px solid #FF0000; border-radius: 8px; padding: 15px; background: white;">
              <img src="${vehicleImage}" 
                   style="width: 350px; height: 175px; border-radius: 6px;" 
                   alt="Vehículo ${inspection.vehicleInfo.bodyType || 'sedan'}" />
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: #666; font-style: italic;">
              <strong>Leyenda:</strong> Los números rojos indican los puntos de inspección donde se encontraron daños o condiciones que requieren atención.
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #FF0000, #cc0000);">
                <th style="padding: 15px; border: none; text-align: center; color: white; font-weight: bold;">Punto</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Descripción</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Observación</th>
              </tr>
            </thead>
            <tbody>
              ${inspection.bodyInspection.points.map((point: BodyInspectionPoint) => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold; background: #f8f9fa;">
                    <span style="background: #FF0000; color: white; padding: 6px 10px; border-radius: 50%; font-size: 14px;">
                      ${point.number}
                    </span>
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0;">
                    ${point.label || 'Sin descripción'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; color: #666;">
                    ${point.observation || 'Sin observación'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align: center; color: #666; font-style: italic;">No se realizaron puntos de inspección en la carrocería.</p>'}
      </div>
    `;
  }

  // Función para generar HTML de items de inspección
  const generateInspectionItemsHTML = (inspection: InspectionForm) => {
    // Definir el listado fijo agrupado
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
      const item = inspection.items.find(i => i.item === itemName);
      return item ? item.status : 'not_applicable';
    };

    const getItemNotes = (itemName: string) => {
      const item = inspection.items.find(i => i.item === itemName);
      return item ? item.notes : '';
    };

    let html = '';
    
    inspectionGroups.forEach((group, groupIndex) => {
      html += `
        <div style="margin: 20px 0; background: #f8f9fa; border-radius: 8px; padding: 15px; border-left: 4px solid ${groupIndex < 2 ? '#FF0000' : '#007bff'};">
          <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: bold;">${group.title}</h4>
          <table class="inspection-items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th style="width: 15%;">Bueno</th>
                <th style="width: 15%;">Regular</th>
                <th style="width: 15%;">Malo</th>
                <th style="width: 15%;">N/A</th>
                <th style="width: 20%;">Observaciones</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      group.items.forEach(itemName => {
        const status = getItemStatus(itemName);
        const notes = getItemNotes(itemName);
        
        html += `
          <tr>
            <td>${itemName}</td>
            <td style="text-align: center;">${status === 'good' ? '<span class="status-good">✓</span>' : ''}</td>
            <td style="text-align: center;">${status === 'needs_attention' ? '<span class="status-attention">⚠</span>' : ''}</td>
            <td style="text-align: center;">${status === 'bad' ? '<span class="status-bad">✗</span>' : ''}</td>
            <td style="text-align: center;">${status === 'not_applicable' ? '<span class="status-na">-</span>' : ''}</td>
            <td style="font-size: 11px; color: #666;">${notes || '-'}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    });
    
    return html;
  };

  // Función para generar HTML de inspección de carrocería
  const generateBodyInspectionHTML = (inspection: InspectionForm) => {
    if (!inspection.bodyInspection) {
      return '';
    }

    let vehicleImage;
    if (inspection.bodyInspection.capturedImage) {
      vehicleImage = inspection.bodyInspection.capturedImage;
    } else {
      // Usar una imagen placeholder para el tipo de vehículo
      const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
      vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="150" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
          <text x="150" y="75" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
        </svg>
      `);
    }

    return `
      <div class="section-title">🚗 INSPECCIÓN DE CARROCERÍA</div>
      <div style="margin: 20px 0; background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #e0e0e0;">
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1;">
            <p><strong>Tipo de Vehículo:</strong> ${inspection.vehicleInfo.bodyType || 'No especificado'}</p>
            <p><strong>Puntos Inspeccionados:</strong> 
              <span style="background: #FF0000; color: white; padding: 4px 8px; border-radius: 12px; font-weight: bold;">
                ${inspection.bodyInspection.points.length}
              </span>
            </p>
          </div>
        </div>
        
        ${inspection.bodyInspection.points.length > 0 ? `
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; border: 2px solid #FF0000; border-radius: 8px; padding: 15px; background: white;">
              <img src="${vehicleImage}" 
                   style="width: 350px; height: 175px; border-radius: 6px;" 
                   alt="Vehículo ${inspection.vehicleInfo.bodyType || 'sedan'}" />
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: #666; font-style: italic;">
              <strong>Leyenda:</strong> Los números rojos indican los puntos de inspección donde se encontraron daños o condiciones que requieren atención.
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #FF0000, #cc0000);">
                <th style="padding: 15px; border: none; text-align: center; color: white; font-weight: bold;">Punto</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Descripción</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Observación</th>
              </tr>
            </thead>
            <tbody>
              ${inspection.bodyInspection.points.map((point: BodyInspectionPoint) => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold; background: #f8f9fa;">
                    <span style="background: #FF0000; color: white; padding: 6px 10px; border-radius: 50%; font-size: 14px;">
                      ${point.number}
                    </span>
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0;">
                    ${point.label || 'Sin descripción'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; color: #666;">
                    ${point.observation || 'Sin observación'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align: center; color: #666; font-style: italic;">No se realizaron puntos de inspección en la carrocería.</p>'}
      </div>
    `;
  };

  // Función para generar HTML de inspección de llantas
  const generateTireInspectionHTML = (inspection: InspectionForm) => {
    if (!inspection.tireInspection) {
      return '';
    }

    let vehicleImage;
    if (inspection.tireInspection.capturedImage) {
      vehicleImage = inspection.tireInspection.capturedImage;
    } else {
      // Usar una imagen placeholder para el tipo de vehículo
      const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
      vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="300" height="180" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
          <text x="150" y="90" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
        </svg>
      `);
    }

    return `
      <div class="section-title">🛞 INSPECCIÓN DE LLANTAS</div>
      <div style="margin: 20px 0; background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #e0e0e0;">
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1;">
            <p><strong>Tipo de Vehículo:</strong> ${inspection.vehicleInfo.bodyType || 'No especificado'}</p>
            <p><strong>Llantas Registradas:</strong> 
              <span style="background: #0066cc; color: white; padding: 4px 8px; border-radius: 12px; font-weight: bold;">
                ${inspection.tireInspection.measurements.length}
              </span>
            </p>
          </div>
        </div>
        
        ${inspection.tireInspection.measurements.length > 0 ? `
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; border: 2px solid #0066cc; border-radius: 8px; padding: 15px; background: white;">
              <img src="${vehicleImage}" 
                   style="width: 350px; height: 210px; border-radius: 6px;" 
                   alt="Vehículo ${inspection.vehicleInfo.bodyType || 'sedan'}" />
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: #666; font-style: italic;">
              <strong>Leyenda:</strong> Los círculos azules indican las posiciones de las llantas donde se registraron las mediciones.
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #0066cc, #0052a3);">
                <th style="padding: 15px; border: none; text-align: center; color: white; font-weight: bold;">Título</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Marca</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Modelo</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Tamaño</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Presión</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${inspection.tireInspection.measurements.map((measurement) => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold; background: #f8f9fa;">
                    ${measurement.title}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
                    ${measurement.brand}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
                    ${measurement.model || '-'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
                    ${measurement.size || '-'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
                    ${measurement.pressure || '-'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
                    ${measurement.condition || '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align: center; color: #666; font-style: italic;">No se realizaron mediciones de llantas.</p>'}
      </div>
    `;
  };

  return `
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 900px;
          margin: 30px auto;
          background: #fff;
          border: 2px solid #222;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.10;
          z-index: 0;
          width: 70%;
          max-width: 600px;
        }
        .header {
          display: flex;
          align-items: center;
          padding: 30px 30px 10px 30px;
          border-bottom: 2px solid #eee;
          position: relative;
        }
        .company-logo {
          height: 80px;
          width: auto;
          margin-right: 24px;
        }
        .company-info {
          font-size: 13px;
          color: #444;
        }
        .company-info h2 {
          font-size: 20px;
          margin: 0 0 2px 0;
          font-weight: 700;
        }
        .company-info p {
          margin: 0;
          font-size: 12px;
        }
        .report-title {
          text-align: center;
          font-size: 22px;
          font-weight: bold;
          margin: 30px 0 10px 0;
          letter-spacing: 1px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
        }
        .info-table th, .info-table td {
          border: 1px solid #bbb;
          padding: 7px 10px;
          font-size: 14px;
        }
        .info-table th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin: 18px 0 8px 0;
          color: #222;
        }
        .diagnostico-list {
          margin: 0 0 10px 0;
          padding: 0 0 0 18px;
        }
        .diagnostico-list li {
          font-size: 14px;
          margin-bottom: 4px;
        }
        .aprobado-btn, .noaprobado-btn {
          display: inline-block;
          padding: 8px 24px;
          border-radius: 18px;
          font-weight: bold;
          font-size: 15px;
          margin-right: 10px;
        }
        .aprobado-btn {
          background: #4CAF50;
          color: #fff;
        }
        .noaprobado-btn {
          background: #FF0000;
          color: #fff;
        }
        .page-break {
          page-break-before: always;
        }
        .inspection-items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .inspection-items-table th, .inspection-items-table td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
          font-size: 13px;
        }
        .inspection-items-table th {
          background: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        .status-good { background: #4CAF50; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .status-bad { background: #FF0000; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .status-attention { background: #FF9800; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .status-na { background: #9E9E9E; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
      </style>
    </head>
    <body>
      <!-- PRIMERA PÁGINA: Información básica y items de inspección -->
      <div class="container">
        ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : ''}
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo">` : ''}
          <div class="company-info">
            <h2>${settings.companyName || 'MTinspector'}</h2>
            ${settings.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
            ${settings.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
            ${settings.companyEmail ? `<p>${settings.companyEmail}</p>` : ''}
          </div>
        </div>
        <div class="report-title">REVISION TECNICA - INGRESO VEHICULAR</div>
        
        <!-- Información de Ingreso -->
        <div class="section-title">📅 INFORMACIÓN DE INGRESO</div>
        <table class="info-table">
          <tr>
            <th>Fecha Ingreso</th>
            <td>${inspection.fechaIngreso || ''}</td>
            <th>Hora Ingreso</th>
            <td>${inspection.horaIngreso || ''}</td>
          </tr>
        </table>

        <!-- Items de Inspección -->
        <div class="section-title">🔍 ITEMS DE INSPECCIÓN</div>
        ${generateInspectionItemsHTML(inspection)}
        
        <!-- Sugerencias de Diagnóstico -->
        <div class="section-title">💡 SUGERENCIAS DE DIAGNÓSTICO</div>
        <ul class="diagnostico-list">
          ${(inspection.sugerenciasDiagnostico && inspection.sugerenciasDiagnostico.length > 0)
            ? inspection.sugerenciasDiagnostico.map(s => `<li>${s}</li>`).join('')
            : '<li>No hay sugerencias registradas.</li>'}
        </ul>
        
        <!-- Precio Sugerido -->
        <div class="section-title">💲 PRECIO SUGERIDO</div>
        <p style="font-size: 16px; font-weight: bold; color: #222;">
          ${inspection.precioSugerido ? `$${inspection.precioSugerido}` : 'No ingresado'}
        </p>
        
        <!-- Resultado de Inspección -->
        <div class="section-title">✅ RESULTADO DE INSPECCIÓN</div>
        <div style="margin-bottom: 20px;">
          ${inspection.resultadoInspeccion === 'approved'
            ? '<span class="aprobado-btn">Aprobado</span>'
            : inspection.resultadoInspeccion === 'rejected'
              ? '<span class="noaprobado-btn">No Aprobado</span>'
              : '<span style="color:#888;">Sin resultado</span>'}
        </div>
      </div>

      <!-- SEGUNDA PÁGINA: Información del vehículo e inspección de carrocería -->
      <div class="container page-break">
        ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : ''}
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="Logo">` : ''}
          <div class="company-info">
            <h2>${settings.companyName || 'MTinspector'}</h2>
            ${settings.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
            ${settings.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
            ${settings.companyEmail ? `<p>${settings.companyEmail}</p>` : ''}
          </div>
        </div>
        <div class="report-title">INFORMACIÓN DEL VEHÍCULO</div>
        
        <!-- Información del Vehículo -->
        <div class="section-title">🚗 DATOS DEL VEHÍCULO</div>
        <table class="info-table">
          <tr>
            <th>Placa</th>
            <td>${inspection.vehicleInfo.plate || ''}</td>
            <th>Propietario</th>
            <td>${inspection.vehicleInfo.ownerName || ''}</td>
          </tr>
          <tr>
            <th>Marca</th>
            <td>${inspection.vehicleInfo.brand || ''}</td>
            <th>Modelo</th>
            <td>${inspection.vehicleInfo.model || ''}</td>
          </tr>
          <tr>
            <th>Color</th>
            <td>${inspection.vehicleInfo.color || ''}</td>
            <th>Año</th>
            <td>${inspection.vehicleInfo.year || ''}</td>
          </tr>
          <tr>
            <th>Teléfono</th>
            <td>${inspection.vehicleInfo.ownerPhone || ''}</td>
            <th>Tipo de Carrocería</th>
            <td>${inspection.vehicleInfo.bodyType === 'sedan' ? 'Sedán' : 
                 inspection.vehicleInfo.bodyType === 'suv' ? 'SUV' : 
                 inspection.vehicleInfo.bodyType === 'pickup' ? 'Pickup' : 'N/A'}</td>
          </tr>
        </table>

        <!-- Datos RUNT -->
        <div class="section-title">📋 DATOS RUNT</div>
        <table class="info-table">
          <tr>
            <th>Multas SIMIT</th>
            <td>${inspection.vehicleHistory?.simitFines || ''}</td>
            <th>Pignoración</th>
            <td>${inspection.vehicleHistory?.pignoracion || ''}</td>
          </tr>
          <tr>
            <th>Timbre</th>
            <td>${inspection.vehicleHistory?.timbreValue || ''}</td>
            <th>Imp. Gobernación</th>
            <td>${inspection.vehicleHistory?.governorTax?.status || ''}</td>
          </tr>
          <tr>
            <th>Imp. Movilidad</th>
            <td>${inspection.vehicleHistory?.mobilityTax?.status || ''}</td>
            <th>SOAT</th>
            <td>${inspection.vehicleHistory?.soatExpiry?.month || ''} ${inspection.vehicleHistory?.soatExpiry?.year || ''}</td>
          </tr>
          <tr>
            <th>Tecnomecánica</th>
            <td>${inspection.vehicleHistory?.technicalExpiry?.month || ''} ${inspection.vehicleHistory?.technicalExpiry?.year || ''}</td>
            <th>Cilindraje</th>
            <td>${inspection.vehicleHistory?.engineDisplacement || ''}</td>
          </tr>
          <tr>
            <th>Combustible</th>
            <td>${inspection.vehicleHistory?.fuelType || ''}</td>
            <th>Kilometraje</th>
            <td>${inspection.vehicleHistory?.mileage || ''}</td>
          </tr>
          <tr>
            <th>Matriculado en</th>
            <td>${inspection.vehicleHistory?.registrationCity || ''}</td>
            <th>Fasecolda</th>
            <td>${inspection.vehicleHistory?.fasecoldaReports || ''}</td>
          </tr>
        </table>

        <!-- Inspección de Carrocería -->
        ${generateBodyInspectionHTML(inspection)}
        
        <!-- Inspección de Llantas -->
        ${generateTireInspectionHTML(inspection)}
        
        <div class="footer">
          <p><strong>${settings.companyName || 'MTinspector'}</strong> - Sistema de Inspección Vehicular Profesional</p>
          <p>Este documento es generado automáticamente por el sistema de inspección vehicular.</p>
          <p>Fecha de generación: ${new Date().toLocaleDateString('es-CO')} - Documento válido por 30 días desde la fecha de inspección.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 