import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid } from 'react-native';
import { InspectionForm, AppSettings, BodyInspectionPoint, VehicleHistory } from '../types';
import { getVehicleImageWithPoints } from './imageUtils';

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
      vehicleImage = await getVehicleImageWithPoints(
        inspection.vehicleInfo.bodyType || 'sedan',
        inspection.bodyInspection.points
      );
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reporte de Inspección - MTinspector</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', Arial, sans-serif;
          margin: 0;
          padding: 40px;
          color: #2c3e50;
          line-height: 1.6;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          position: relative;
        }
        
        /* Marca de agua */
        body::before {
          content: 'MTinspector';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          color: rgba(255, 0, 0, 0.03);
          z-index: -1;
          pointer-events: none;
          font-weight: 700;
          font-family: 'Inter', Arial, sans-serif;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #000000 0%, #333333 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
        }
        
        .header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #FF0000, #cc0000);
        }
        
        .company-logo {
          max-width: 120px;
          max-height: 60px;
          margin-bottom: 20px;
          border-radius: 8px;
        }
        
        .company-info h2 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
          color: white;
        }
        
        .company-info p {
          margin: 5px 0;
          color: #e0e0e0;
          font-size: 14px;
        }
        
        .report-title {
          font-size: 32px;
          font-weight: 700;
          color: #000;
          margin: 40px 0 20px 0;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .report-subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 40px;
          font-size: 16px;
          font-style: italic;
        }
        
        .content {
          padding: 40px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .section {
          margin: 40px 0;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        
        .section h3 {
          color: #000;
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          border-bottom: 2px solid #FF0000;
          padding-bottom: 10px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .info-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .info-label {
          font-weight: 600;
          color: #000;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .info-value {
          color: #2c3e50;
          font-size: 16px;
        }

        .vehicle-history-section {
          margin: 30px 0;
          page-break-inside: avoid;
        }

        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .history-item {
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-size: 14px;
        }

        .history-item strong {
          color: #2c3e50;
          margin-right: 8px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        
        th {
          background: linear-gradient(135deg, #FF0000 0%, #cc0000 100%);
          color: white;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        td {
          padding: 12px;
          border: 1px solid #e0e0e0;
          font-size: 14px;
        }
        
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .signature-section {
          margin: 60px 0 40px 0;
          display: flex;
          justify-content: space-between;
          gap: 40px;
        }
        
        .signature-box {
          flex: 1;
          text-align: center;
          background: white;
          padding: 30px;
          border-radius: 12px;
          border: 2px solid #e0e0e0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        }
        
        .signature-line {
          border-top: 2px solid #000;
          margin-top: 60px;
          padding-top: 15px;
        }
        
        .signature-line strong {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .footer {
          background: linear-gradient(135deg, #000000 0%, #333333 100%);
          color: white;
          text-align: center;
          padding: 30px;
          margin-top: 40px;
          border-radius: 0 0 16px 16px;
        }
        
        .footer p {
          margin: 5px 0;
          font-size: 12px;
          color: #e0e0e0;
        }
        
        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #FF0000, #cc0000);
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 20px;
            background: white;
          }
          .container {
            box-shadow: none;
            border-radius: 0;
          }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${settings.companyLogo ? `<img src="${settings.companyLogo}" class="company-logo" alt="Logo">` : ''}
          <div class="company-info">
            <h2>${settings.companyName || 'MTinspector'}</h2>
            ${settings.companyAddress ? `<p>📍 ${settings.companyAddress}</p>` : ''}
            ${settings.companyPhone ? `<p>📞 ${settings.companyPhone}</p>` : ''}
            ${settings.companyEmail ? `<p>✉️ ${settings.companyEmail}</p>` : ''}
          </div>
        </div>

        <div class="content">
          <div class="report-title">
            ${settings.reportTemplate === 'colombia' 
              ? 'INSPECCIÓN TÉCNICO MECÁNICA VEHICULAR'
              : 'REPORTE DE INSPECCIÓN VEHICULAR'
            }
          </div>
          <p class="report-subtitle">
            Certificado de Revisión Técnico Mecánica
          </p>

          <!-- Estadísticas de la inspección -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number" style="color: #4CAF50;">${goodItems}</div>
              <div class="stat-label">Buenos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #FF9800;">${attentionItems}</div>
              <div class="stat-label">Atención</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #FF0000;">${badItems}</div>
              <div class="stat-label">Malos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #9E9E9E;">${totalItems}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>

          <!-- Estado general -->
          <div style="text-align: center; margin: 30px 0;">
            <span class="status-badge" style="background: ${getOverallStatusColor(inspection.overallStatus)}; color: white; font-size: 18px; padding: 12px 24px;">
              Estado General: ${getStatusText(inspection.overallStatus)}
            </span>
          </div>

          <!-- Página 1: Información del Vehículo y Estado General -->
          <div class="section">
            <h3>🚗 Información del Vehículo</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Placa</div>
                <div class="info-value">${inspection.vehicleInfo.plate || 'No especificada'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Marca</div>
                <div class="info-value">${inspection.vehicleInfo.brand || 'No especificada'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Modelo</div>
                <div class="info-value">${inspection.vehicleInfo.model || 'No especificado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Año</div>
                <div class="info-value">${inspection.vehicleInfo.year || 'No especificado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Color</div>
                <div class="info-value">${inspection.vehicleInfo.color || 'No especificado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">VIN</div>
                <div class="info-value">${inspection.vehicleInfo.vin || 'No especificado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Propietario</div>
                <div class="info-value">${inspection.vehicleInfo.ownerName || 'No especificado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Teléfono</div>
                <div class="info-value">${inspection.vehicleInfo.ownerPhone || 'No especificado'}</div>
              </div>
            </div>
          </div>

          <!-- Estado General e Historial del Vehículo en la misma página -->
          ${formatVehicleHistory(inspection.vehicleHistory)}

          <div class="section">
            <h3>📋 Información de la Inspección</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Fecha de Inspección</div>
                <div class="info-value">${formatDate(inspection.inspectionDate)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Inspector</div>
                <div class="info-value">${inspection.inspectorName || settings.inspectorName || 'No especificado'}</div>
              </div>
            </div>
          </div>

          ${bodyInspectionHTML}

          <div class="section">
            <h3>🔧 Partes y Accesorios</h3>
            ${inspection.items.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Bueno</th>
                    <th style="text-align: center;">Atención</th>
                    <th style="text-align: center;">Malo</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: #666; font-style: italic;">No hay partes y accesorios registrados.</p>'}
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <strong>Firma del Inspector</strong><br>
                ${inspection.inspectorName || settings.inspectorName || 'Inspector'}
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <strong>Firma del Propietario</strong><br>
                ${inspection.vehicleInfo.ownerName || 'Propietario'}
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>MTinspector</strong> - Sistema de Inspección Vehicular Profesional</p>
          <p>Este documento es generado automáticamente por el sistema de inspección vehicular.</p>
          <p>Fecha de generación: ${new Date().toLocaleDateString('es-CO')} - Documento válido por 30 días desde la fecha de inspección.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 