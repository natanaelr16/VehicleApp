import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid } from 'react-native';
import { InspectionForm, AppSettings, BodyInspectionPoint, VehicleHistory, TireInspection } from '../types';
import { imageToBase64, validateImage, debugImageInfo, safeImageToBase64 } from './imageUtils';
import { formatDateForDisplay } from './dateUtils';
import { VEHICLE_IMAGES_BASE64 } from './vehicleImagesBase64';

export const generateInspectionPDF = async (
  inspection: InspectionForm,
  settings: AppSettings
): Promise<string | null> => {
  try {
    // Solicitar permisos en Android
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      
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
  let vehiclePhotoBase64 = '';
  
  if (settings.companyLogo && validateImage(settings.companyLogo)) {
    try {
      logoBase64 = await safeImageToBase64(settings.companyLogo, 'CompanyLogo');
    } catch (error) {
      console.error('Error convirtiendo logo a base64:', error);
    }
  }
  
  if (settings.watermarkLogo && validateImage(settings.watermarkLogo)) {
    try {
      watermarkBase64 = await safeImageToBase64(settings.watermarkLogo, 'WatermarkLogo');
    } catch (error) {
      console.error('Error convirtiendo marca de agua a base64:', error);
    }
  }

  // Convertir foto del vehículo a base64 si existe
  if (inspection.vehicleInfo.vehiclePhoto) {
    try {
      vehiclePhotoBase64 = await safeImageToBase64(inspection.vehicleInfo.vehiclePhoto, 'VehiclePhoto');
    } catch (error) {
      console.error('Error convirtiendo foto del vehículo a base64:', error);
      vehiclePhotoBase64 = '';
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
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
          ${item.status === 'not_applicable' ? '<span style="background: #9E9E9E; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">N/A</span>' : ''}
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: left; font-size: 12px; color: #666;">
          ${item.notes || ''}
        </td>
      </tr>
    `;
  }).join('');

  // Obtener imagen del vehículo según el tipo
  const getVehicleImage = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sedan':
        return VEHICLE_IMAGES_BASE64.sedan;
      case 'suv':
        return VEHICLE_IMAGES_BASE64.suv;
      case 'pickup':
        return VEHICLE_IMAGES_BASE64.pickup;
      default:
        return VEHICLE_IMAGES_BASE64.skeleton;
    }
  };

  const vehicleImage = getVehicleImage(inspection.vehicleInfo.type || 'skeleton');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Inspección - ${inspection.vehicleInfo.plate || 'Vehículo'}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml;base64,${watermarkBase64}') center/contain no-repeat;
          opacity: 0.1;
          pointer-events: none;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 300;
          position: relative;
          z-index: 1;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        .logo {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .logo img {
          max-width: 60px;
          max-height: 60px;
        }
        .content {
          padding: 30px;
        }
        .section {
          margin-bottom: 30px;
          background: #fafafa;
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid #667eea;
        }
        .section h2 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 20px;
          font-weight: 600;
        }
        .vehicle-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }
        .info-label {
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 16px;
          color: #333;
          font-weight: 500;
        }
        .vehicle-photo {
          text-align: center;
          margin: 20px 0;
        }
        .vehicle-photo img {
          max-width: 300px;
          max-height: 200px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .stat-item {
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        .good { color: #4CAF50; }
        .attention { color: #FF9800; }
        .bad { color: #FF0000; }
        .na { color: #9E9E9E; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th {
          background: #667eea;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .history-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }
        .footer {
          background: #333;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 12px;
        }
        .overall-status {
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, ${getOverallStatusColor(inspection.overallStatus)} 0%, ${getOverallStatusColor(inspection.overallStatus)}dd 100%);
          color: white;
          border-radius: 8px;
          margin: 20px 0;
        }
        .overall-status h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 300;
        }
        .overall-status p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoBase64 ? `<div class="logo"><img src="${logoBase64}" alt="Logo"></div>` : ''}
          <h1>🔍 Reporte de Inspección Vehicular</h1>
          <p>Generado el ${formatDate(inspection.inspectionDate)}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>🚗 Información del Vehículo</h2>
            <div class="vehicle-info">
              <div class="info-item">
                <div class="info-label">Placa</div>
                <div class="info-value">${inspection.vehicleInfo.plate || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Marca</div>
                <div class="info-value">${inspection.vehicleInfo.brand || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Modelo</div>
                <div class="info-value">${inspection.vehicleInfo.model || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Año</div>
                <div class="info-value">${inspection.vehicleInfo.year || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Color</div>
                <div class="info-value">${inspection.vehicleInfo.color || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tipo</div>
                <div class="info-value">${inspection.vehicleInfo.type || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">VIN</div>
                <div class="info-value">${inspection.vehicleInfo.vin || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Motor</div>
                <div class="info-value">${inspection.vehicleInfo.engineNumber || 'N/A'}</div>
              </div>
            </div>
            
            ${vehiclePhotoBase64 ? `
              <div class="vehicle-photo">
                <img src="${vehiclePhotoBase64}" alt="Foto del vehículo">
              </div>
            ` : `
              <div class="vehicle-photo">
                <img src="data:image/png;base64,${vehicleImage}" alt="Imagen del vehículo">
              </div>
            `}
          </div>

          ${inspection.vehicleHistory ? formatVehicleHistory(inspection.vehicleHistory) : ''}

          <div class="section">
            <h2>📊 Estadísticas de la Inspección</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number good">${goodItems}</div>
                <div class="stat-label">Buenos</div>
              </div>
              <div class="stat-item">
                <div class="stat-number attention">${attentionItems}</div>
                <div class="stat-label">Atención</div>
              </div>
              <div class="stat-item">
                <div class="stat-number bad">${badItems}</div>
                <div class="stat-label">Malos</div>
              </div>
              <div class="stat-item">
                <div class="stat-number na">${naItems}</div>
                <div class="stat-label">N/A</div>
              </div>
            </div>
          </div>

          <div class="overall-status">
            <h2>Estado General: ${getStatusText(inspection.overallStatus)}</h2>
            <p>${inspection.overallNotes || 'Sin observaciones adicionales'}</p>
          </div>

          <div class="section">
            <h2>🔍 Detalle de la Inspección</h2>
            <table>
              <thead>
                <tr>
                  <th>Elemento</th>
                  <th>Bueno</th>
                  <th>Atención</th>
                  <th>Malo</th>
                  <th>N/A</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
          </div>

          ${inspection.bodyInspection ? `
            <div class="section">
              <h2>🔧 Inspección de Carrocería</h2>
              <div class="vehicle-info">
                ${inspection.bodyInspection.points.map(point => `
                  <div class="info-item">
                    <div class="info-label">${point.name}</div>
                    <div class="info-value">${getStatusText(point.status)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${inspection.tireInspection ? `
            <div class="section">
              <h2>🛞 Inspección de Neumáticos</h2>
              <div class="vehicle-info">
                ${inspection.tireInspection.tires.map(tire => `
                  <div class="info-item">
                    <div class="info-label">${tire.position}</div>
                    <div class="info-value">${tire.brand} - ${tire.condition}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} MT Inspector - Sistema de Inspección Vehicular</p>
          <p>Reporte generado automáticamente el ${formatDate(inspection.inspectionDate)}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 