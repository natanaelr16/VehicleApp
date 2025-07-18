import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Platform, PermissionsAndroid } from 'react-native';
import { InspectionForm, AppSettings, BodyInspectionPoint, VehicleHistory, TireInspection } from '../types';
import { imageToBase64, validateImage, optimizeImageForPDF, getImageMimeType } from './imageUtils';
import { formatDateForDisplay } from './dateUtils';

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
  let vehiclePhotoBase64 = '';
  
  // El logo de marca de agua se usa tanto para el encabezado (full color) como para marca de agua (sutil)
  if (settings.watermarkLogo && validateImage(settings.watermarkLogo)) {
    try {
      // Usar el logo de marca de agua para el encabezado (full color) - optimizado
      logoBase64 = await optimizeImageForPDF(settings.watermarkLogo, 0.9, 400, 200);
      
      // Usar el mismo logo de marca de agua para la marca de agua (sutil) - más comprimido
      watermarkBase64 = await optimizeImageForPDF(settings.watermarkLogo, 0.7, 600, 400);
    } catch (error) {
      console.error('Error optimizando logo de marca de agua:', error);
    }
  }
  
  // También intentar usar companyLogo si watermarkLogo no está disponible
  if (!logoBase64 && settings.companyLogo && validateImage(settings.companyLogo)) {
    try {
      logoBase64 = await optimizeImageForPDF(settings.companyLogo, 0.9, 400, 200);
    } catch (error) {
      console.error('Error optimizando company logo:', error);
    }
  }
  
  // Obtener tipos MIME para los logos
  const logoMimeType = settings.watermarkLogo ? getImageMimeType(settings.watermarkLogo) : 
                      (settings.companyLogo ? getImageMimeType(settings.companyLogo) : 'image/jpeg');
  const watermarkMimeType = settings.watermarkLogo ? getImageMimeType(settings.watermarkLogo) : 'image/jpeg';

  // Convertir foto del vehículo a base64 si existe
  if (inspection.vehicleInfo.vehiclePhoto) {
    try {
      vehiclePhotoBase64 = await optimizeImageForPDF(inspection.vehicleInfo.vehiclePhoto, 0.85, 800, 600);
    } catch (error) {
      console.error('Error optimizando foto del vehículo:', error);
      vehiclePhotoBase64 = '';
    }
  }
  
  // El logo de empresa NO se usa en el PDF, solo en la página principal de la app
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
      // Si la imagen no es base64, conviértela
      if (inspection.bodyInspection.capturedImage.startsWith('data:image')) {
        vehicleImage = inspection.bodyInspection.capturedImage;
      } else {
        try {
          vehicleImage = await imageToBase64(inspection.bodyInspection.capturedImage);
        } catch (e) {
          vehicleImage = '';
        }
      }
      console.log('Usando imagen capturada para inspección de carrocería');
    } else {
      // Usar una imagen placeholder para el tipo de vehículo
      const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
      vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="150" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
          <text x="150" y="75" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
        </svg>
      `);
      console.log('Usando imagen placeholder para inspección de carrocería');
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
              <img src="data:image/jpeg;base64,${vehicleImage}" 
                   style="width: 350px; height: 175px; border-radius: 6px;" 
                   alt="Vehículo ${inspection.vehicleInfo.bodyType || 'sedan'}" />
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: #666; font-style: italic;">
              <strong>Leyenda:</strong> Los números rojos indican los puntos de inspección donde se encontraron daños o condiciones que requieren atención.
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: rgba(255,255,255,0.8); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, rgba(255,0,0,0.7), rgba(204,0,0,0.7));">
                <th style="padding: 15px; border: none; text-align: center; color: white; font-weight: bold;">Punto</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Descripción</th>
                <th style="padding: 15px; border: none; color: white; font-weight: bold;">Observación</th>
              </tr>
            </thead>
            <tbody>
              ${inspection.bodyInspection.points.map((point: BodyInspectionPoint) => `
                <tr>
                  <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.8); text-align: center; font-weight: bold; background: rgba(248,249,250,0.6);">
                    <span style="background: #FF0000; color: white; padding: 6px 10px; border-radius: 50%; font-size: 14px;">
                      ${point.number}
                    </span>
                  </td>
                  <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.8); background: rgba(255,255,255,0.6);">
                    ${point.label || 'Sin descripción'}
                  </td>
                  <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.8); color: #666; background: rgba(255,255,255,0.6);">
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
  const generateInspectionItemsHTML = (inspection: InspectionForm, groupTitle?: string) => {
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

    // Si se especifica un grupo, filtrar solo ese grupo
    const groupsToShow = groupTitle 
      ? inspectionGroups.filter(group => group.title === groupTitle)
      : inspectionGroups;

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
    
    groupsToShow.forEach((group, groupIndex) => {
      html += `
        <div style="margin: 20px 0; background: transparent; border-radius: 8px; padding: 15px; border-left: 4px solid ${group.title === 'Luces y Exterior' ? '#FF0000' : group.title === 'Motor y Soportes' ? '#FF0000' : '#007bff'};">
          <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: bold;">${group.title}</h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; background: transparent;">
            <thead>
              <tr style="background: transparent;">
                <th style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: left; font-size: 12px; background: transparent;">Item</th>
                <th style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">Bueno</th>
                <th style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">Regular</th>
                <th style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">Malo</th>
                <th style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">N/A</th>
                <th style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: left; font-size: 12px; background: transparent;">Observaciones</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      group.items.forEach(itemName => {
        const status = getItemStatus(itemName);
        const notes = getItemNotes(itemName);
        
        html += `
          <tr>
            <td style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); font-size: 12px; background: transparent;">${itemName}</td>
            <td style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">${status === 'good' ? '✓' : ''}</td>
            <td style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">${status === 'needs_attention' ? '⚠' : ''}</td>
            <td style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">${status === 'bad' ? '✗' : ''}</td>
            <td style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); text-align: center; font-size: 12px; background: transparent;">${status === 'not_applicable' ? '❌' : ''}</td>
            <td style="padding: 8px; border: 1px solid rgba(222,226,230,0.4); font-size: 11px; color: #666; background: transparent;">${notes || '-'}</td>
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
  const generateBodyInspectionHTML = async (inspection: InspectionForm, compact = false) => {
    if (!inspection.bodyInspection) {
      return '';
    }
    
    let vehicleImage;
    if (inspection.bodyInspection.capturedImage) {
      // Verificar si la imagen es base64 o una ruta de archivo
      if (inspection.bodyInspection.capturedImage.startsWith('data:image')) {
        // Ya es base64
        vehicleImage = inspection.bodyInspection.capturedImage;
      } else if (inspection.bodyInspection.capturedImage.startsWith('file://')) {
        // Es una ruta de archivo, intentar convertir a base64
        try {
          vehicleImage = await imageToBase64(inspection.bodyInspection.capturedImage);
        } catch (error) {
          console.error('BodyInspection - Error convirtiendo imagen de archivo:', error);
          // Usar placeholder si falla la conversión
          const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
          vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
              <rect width="300" height="150" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
              <text x="150" y="75" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
            </svg>
          `);
        }
      } else {
        // Otro formato, intentar convertir
        try {
          vehicleImage = await imageToBase64(inspection.bodyInspection.capturedImage);
        } catch (error) {
          console.error('BodyInspection - Error convirtiendo imagen:', error);
          // Usar placeholder si falla la conversión
          const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
          vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
              <rect width="300" height="150" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
              <text x="150" y="75" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
            </svg>
          `);
        }
      }
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

    const html = `
      <div class="section-title" style="font-size: 18px; margin-bottom: 20px;">🚗 INSPECCIÓN DE CARROCERÍA</div>
      <div style="margin: 20px 0; background: transparent; border-radius: 12px; padding: 25px; border: 1px solid #e0e0e0;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${vehicleImage}" style="width: 500px; height: 250px; border-radius: 8px; border: 2px solid #ddd;" alt="Vehículo" />
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-top: 20px; background: transparent;">
          <thead>
            <tr style="background: transparent;">
              <th style="padding: 15px; border: 1px solid rgba(224,224,224,0.4); text-align: center; color: #333; font-weight: bold; font-size: 16px; background: transparent;">Punto</th>
              <th style="padding: 15px; border: 1px solid rgba(224,224,224,0.4); color: #333; font-weight: bold; font-size: 16px; background: transparent;">Descripción</th>
              <th style="padding: 15px; border: 1px solid rgba(224,224,224,0.4); color: #333; font-weight: bold; font-size: 16px; background: transparent;">Observación</th>
            </tr>
          </thead>
          <tbody>
            ${inspection.bodyInspection.points.map((point: BodyInspectionPoint) => `
              <tr>
                <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.4); text-align: center; font-weight: bold; background: transparent;">
                  <span style="background: #FF0000; color: white; padding: 6px 10px; border-radius: 50%; font-size: 16px; font-weight: bold;">
                    ${point.number}
                  </span>
                </td>
                <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.4); background: transparent; font-size: 15px;">
                  ${point.label || 'Sin descripción'}
                </td>
                <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.4); color: #333; background: transparent; font-size: 14px;">
                  ${point.observation || 'Sin observación'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    return html;
  };

  // Función para generar HTML de inspección de llantas
  const generateTireInspectionHTML = async (inspection: InspectionForm, compact = false) => {
    if (!inspection.tireInspection) return '';

    let vehicleImage;
    if (inspection.tireInspection.capturedImage) {
      // Verificar si la imagen es base64 o una ruta de archivo
      if (inspection.tireInspection.capturedImage.startsWith('data:image')) {
        // Ya es base64
        vehicleImage = inspection.tireInspection.capturedImage;
      } else if (inspection.tireInspection.capturedImage.startsWith('file://')) {
        // Es una ruta de archivo, intentar convertir a base64
        try {
          vehicleImage = await imageToBase64(inspection.tireInspection.capturedImage);
        } catch (error) {
          console.error('TireInspection - Error convirtiendo imagen de archivo:', error);
          // Usar placeholder si falla la conversión
          const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
          vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="180" xmlns="http://www.w3.org/2000/svg">
              <rect width="300" height="180" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
              <text x="150" y="90" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
            </svg>
          `);
        }
      } else {
        // Otro formato, intentar convertir
        try {
          vehicleImage = await imageToBase64(inspection.tireInspection.capturedImage);
        } catch (error) {
          console.error('TireInspection - Error convirtiendo imagen:', error);
          // Usar placeholder si falla la conversión
          const bodyType = inspection.vehicleInfo.bodyType || 'sedan';
          vehicleImage = 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="180" xmlns="http://www.w3.org/2000/svg">
              <rect width="300" height="180" fill="#f8f9fa" stroke="#ddd" stroke-width="2"/>
              <text x="150" y="90" text-anchor="middle" fill="#666" font-size="14">${bodyType.toUpperCase()}</text>
            </svg>
          `);
        }
      }
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

    // Determinar el tipo MIME y el src correcto para la imagen
    let imageSrc: string;
    let imageMimeType: string;
    
    if (vehicleImage.startsWith('data:image')) {
      // Ya es una URI completa de data:image
      imageSrc = vehicleImage;
      imageMimeType = getImageMimeType(vehicleImage);
    } else {
      // Es base64 puro, agregar el prefijo
      imageMimeType = 'image/jpeg'; // Por defecto
      imageSrc = `data:${imageMimeType};base64,${vehicleImage}`;
    }

    return `
      <div class="section-title" style="font-size: 18px; margin-bottom: 20px;">🛞 INSPECCIÓN DE LLANTAS</div>
      <div style="margin: 20px 0; background: transparent; border-radius: 12px; padding: 25px; border: 1px solid #e0e0e0;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${imageSrc}" style="width: 500px; height: 300px; border-radius: 8px; border: 2px solid #ddd;" alt="Vehículo" />
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-top: 20px; background: transparent;">
          <thead>
            <tr style="background: transparent;">
              <th style="padding: 15px; border: 1px solid rgba(224,224,224,0.4); text-align: center; color: #333; font-weight: bold; font-size: 16px; background: transparent;">Llanta</th>
              <th style="padding: 15px; border: 1px solid rgba(224,224,224,0.4); color: #333; font-weight: bold; font-size: 16px; background: transparent;">Valor (mm)</th>
            </tr>
          </thead>
          <tbody>
            ${inspection.tireInspection.measurements.map((measurement) => `
              <tr>
                <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.4); text-align: center; font-weight: bold; background: transparent; font-size: 15px;">
                  ${measurement.title}
                </td>
                <td style="padding: 12px; border: 1px solid rgba(224,224,224,0.4); text-align: center; font-weight: bold; color: #222; background: transparent; font-size: 15px;">
                  ${typeof measurement.value === 'number' ? measurement.value.toFixed(2) : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const generateBatteryAndBrakeHTML = (inspection: InspectionForm) => {
    if (!inspection.tireInspection) return '';
    let html = '';
    
    if (inspection.tireInspection.batteryStatus || inspection.tireInspection.brakeFluidLevel) {
      html += `
        <div style="margin: 15px 0 10px 0; background: transparent; border-radius: 8px; padding: 15px; border: 1px solid #e0e0e0;">
          <div class="section-title" style="font-size: 16px; margin-bottom: 15px;">🔋 ESTADO DE BATERÍA Y LÍQUIDO DE FRENOS</div>
          <div style="display: flex; gap: 15px;">
      `;
      
      if (inspection.tireInspection.batteryStatus) {
        html += `
          <div style="flex: 1; background: transparent; border-radius: 6px; padding: 12px; border: 1px solid #4CAF50;">
            <h3 style="margin: 0 0 10px 0; color: #4CAF50; font-size: 14px; font-weight: bold;">🔋 Estado de Batería</h3>
            <div style="font-size: 14px; margin-bottom: 8px;">
              <strong>Porcentaje:</strong> <span style="color: #4CAF50; font-weight: bold;">${inspection.tireInspection.batteryStatus.percentage}%</span>
            </div>
            ${inspection.tireInspection.batteryStatus.observations ? 
              `<div style="font-size: 12px; color: #666; margin-top: 8px;">
                <strong>Observaciones:</strong><br/>
                ${inspection.tireInspection.batteryStatus.observations}
              </div>` : ''
            }
          </div>
        `;
      }
      
      if (inspection.tireInspection.brakeFluidLevel) {
        html += `
          <div style="flex: 1; background: transparent; border-radius: 6px; padding: 12px; border: 1px solid #FF9800;">
            <h3 style="margin: 0 0 10px 0; color: #FF9800; font-size: 14px; font-weight: bold;">🛑 Estado de Líquido de Frenos</h3>
            <div style="font-size: 14px; margin-bottom: 8px;">
              <strong>Nivel:</strong> <span style="color: #FF9800; font-weight: bold;">${inspection.tireInspection.brakeFluidLevel.level}</span>
            </div>
            ${inspection.tireInspection.brakeFluidLevel.observations ? 
              `<div style="font-size: 12px; color: #666; margin-top: 8px;">
                <strong>Observaciones:</strong><br/>
                ${inspection.tireInspection.brakeFluidLevel.observations}
              </div>` : ''
            }
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    return html;
  };

  // Función para generar HTML de inspección fotográfica
  const generatePhotoInspectionHTML = async (inspection: InspectionForm) => {
    if (!inspection.inspectionPhotos || inspection.inspectionPhotos.length === 0) {
      return '';
    }

    // Agrupar fotos en pares (máximo 2 por hoja)
    const photoPairs = [];
    for (let i = 0; i < inspection.inspectionPhotos.length; i += 2) {
      photoPairs.push(inspection.inspectionPhotos.slice(i, i + 2));
    }

    let html = '';
    for (let pairIndex = 0; pairIndex < photoPairs.length; pairIndex++) {
      const pair = photoPairs[pairIndex];
      
      html += `
        <div class="container page-break" style="position: relative;">
          ${watermarkBase64 ? `<img src="data:${watermarkMimeType};base64,${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : ''}
          <div class="section-title">📸 INSPECCIÓN FOTOGRÁFICA - Página ${pairIndex + 1}</div>
          <div style="display: flex; gap: 20px; margin-top: 20px;">
      `;
      
      for (let photoIndex = 0; photoIndex < pair.length; photoIndex++) {
        const photo = pair[photoIndex];
        
        try {
          // Convertir la foto a base64
          const photoBase64 = await imageToBase64(photo.uri);
          const photoMimeType = getImageMimeType(photo.uri);
          
          html += `
            <div style="flex: 1; background: transparent; border-radius: 12px; padding: 15px; border: 1px solid #e0e0e0;">
              <div style="text-align: center; margin-bottom: 15px;">
                <img src="data:${photoMimeType};base64,${photoBase64}" 
                     style="width: 100%; max-width: 330px; height: 220px; border-radius: 8px; object-fit: cover;" 
                     alt="Foto ${photo.label}" />
              </div>
              <div style="text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #FF0000; font-size: 16px;">Foto #${photo.label}</h4>
                ${photo.observations ? `<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${photo.observations}</p>` : ''}
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                  ${formatDateForDisplay(photo.timestamp)}
                </p>
              </div>
            </div>
          `;
        } catch (error) {
          console.error('Error convirtiendo foto de inspección:', error);
          // Mostrar placeholder si hay error
          html += `
            <div style="flex: 1; background: transparent; border-radius: 12px; padding: 15px; border: 1px solid #e0e0e0;">
              <div style="text-align: center; margin-bottom: 15px;">
                <div style="width: 100%; max-width: 330px; height: 220px; border-radius: 8px; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; border: 2px dashed #dee2e6;">
                  <span style="font-size: 14px; color: #666;">Error cargando imagen</span>
                </div>
              </div>
              <div style="text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #FF0000; font-size: 16px;">Foto #${photo.label}</h4>
                ${photo.observations ? `<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${photo.observations}</p>` : ''}
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                  ${formatDateForDisplay(photo.timestamp)}
                </p>
              </div>
            </div>
          `;
        }
      }

      // Si solo hay una foto en el par, agregar espacio vacío
      if (pair.length === 1) {
        html += `<div style="flex: 1;"></div>`;
      }

      html += `
          </div>
        </div>
      `;
    }

    return html;
  };



  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Inspección Vehicular</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
    .container { width: 95%; margin: 0 auto; padding: 16px 0; }
    .header { display: flex; align-items: center; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 15px; }
    .company-logo { height: 50px; margin-right: 20px; }
    .company-info { flex: 1; }
    .company-info h2 { margin: 0 0 3px 0; font-size: 20px; }
    .company-info p { margin: 0; font-size: 12px; color: #444; }
    .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0 10px 0; letter-spacing: 1px; }
    .section-title { background: transparent; padding: 6px 10px; font-size: 15px; font-weight: bold; margin: 18px 0 6px 0; border-radius: 4px; border-left: 3px solid #FF0000; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; background: transparent; }
    .info-table th, .info-table td { border: 1px solid rgba(221, 221, 221, 0.4); padding: 6px 8px; font-size: 12px; background: transparent; }
    .info-table th { background: transparent; font-weight: bold; color: #333; }
    .diagnostico-list { margin: 0 0 10px 15px; font-size: 13px; }
    .aprobado-btn, .noaprobado-btn { display: inline-block; padding: 6px 20px; border-radius: 16px; font-weight: bold; font-size: 14px; margin-right: 8px; }
    .aprobado-btn { background: #4CAF50; color: #fff; }
    .noaprobado-btn { background: #FF0000; color: #fff; }
    .page-break { page-break-before: always; }
    .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #888; }
    .page-footer { 
      position: fixed; 
      bottom: 10px; 
      left: 0; 
      right: 0; 
      text-align: center; 
      font-size: 10px; 
      color: #666; 
      background: rgba(255, 255, 255, 0.9); 
      padding: 5px; 
      border-top: 1px solid #e0e0e0;
    }
    .legal-disclaimer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      padding: 8px 15px;
      border-top: 1px solid #e0e0e0;
      font-size: 8px;
      color: #666;
      line-height: 1.2;
      text-align: center;
      z-index: 1000;
    }
    .watermark { 
      position: absolute; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      opacity: 0.2; 
      z-index: -1; 
      max-width: 400px; 
      max-height: 300px; 
      pointer-events: none; 
      width: auto;
      height: auto;
    }
  </style>
</head>
<body>
  <!-- HOJA 1: Datos de empresa, información de ingreso, datos del vehículo, valor sugerido, RUNT completo, sugerencias de diagnóstico -->
  <div class="container" style="position: relative;">
    ${watermarkBase64 ? `<img src="data:${watermarkMimeType};base64,${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : '<!-- No hay marca de agua disponible -->'}
    <div class="header">
      ${logoBase64 ? `<img src="data:${logoMimeType};base64,${logoBase64}" class="company-logo" alt="Logo">` : '<!-- No hay logo disponible -->'}
      <div class="company-info">
        <h2>${settings.companyName || 'MTinspector'}</h2>
        ${settings.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
        ${settings.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
        ${settings.companyEmail ? `<p>${settings.companyEmail}</p>` : ''}
      </div>
    </div>
    <div class="report-title">REVISION TECNICA INGRESO VEHICULAR</div>
    
    <div style="display: flex; gap: 20px; margin-bottom: 15px;">
      <div style="flex: 1;">
        <div class="section-title">📅 INFORMACIÓN DE INGRESO</div>
        <table class="info-table">
          <tr><th>Fecha Ingreso</th><td>${inspection.fechaIngreso || ''}</td><th>Hora Ingreso</th><td>${inspection.horaIngreso || ''}</td></tr>
          <tr><th>Propietario</th><td>${inspection.vehicleInfo.ownerName || ''}</td><th>Teléfono</th><td>${inspection.vehicleInfo.ownerPhone || ''}</td></tr>
        </table>
        
        <div class="section-title">🚗 DATOS DEL VEHÍCULO</div>
        <table class="info-table">
          <tr><th>Placa</th><td>${inspection.vehicleInfo.plate || ''}</td><th>Marca</th><td>${inspection.vehicleInfo.brand || ''}</td></tr>
          <tr><th>Modelo</th><td>${inspection.vehicleInfo.model || ''}</td><th>Color</th><td>${inspection.vehicleInfo.color || ''}</td></tr>
          <tr><th>Año</th><td>${inspection.vehicleInfo.year || ''}</td><th>Tipo de Carrocería</th><td>${inspection.vehicleInfo.bodyType === 'sedan' ? 'Sedán' : inspection.vehicleInfo.bodyType === 'suv' ? 'SUV' : inspection.vehicleInfo.bodyType === 'pickup' ? 'Pickup' : 'N/A'}</td></tr>
        </table>
      </div>
      
      <div style="flex: 0 0 250px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        ${(() => {
          console.log('Generando HTML para foto del vehículo, base64 disponible:', !!vehiclePhotoBase64);
          if (vehiclePhotoBase64) {
            console.log('Longitud del base64 en HTML:', vehiclePhotoBase64.length);
            const mimeType = getImageMimeType(inspection.vehicleInfo.vehiclePhoto || '');
            console.log('Tipo MIME para foto del vehículo:', mimeType);
            return `<img src="data:${mimeType};base64,${vehiclePhotoBase64}" 
                 style="width: 250px; height: 180px; object-fit: cover; border-radius: 8px; border: 2px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
                 alt="Foto del Vehículo" />`;
          } else {
            console.log('Mostrando NO PHOTO en HTML');
            return `<div style="width: 250px; height: 180px; border: 2px solid #e0e0e0; border-radius: 8px; display: flex; align-items: center; justify-content: center; background-color: #f8f9fa;">
              <span style="font-size: 16px; color: #666; font-weight: bold;">NO PHOTO</span>
            </div>`;
          }
        })()}
      </div>
    </div>
    
    <div class="section-title">💲 PRECIO SUGERIDO</div>
    <p style="font-size: 15px; font-weight: bold; color: #222; margin: 8px 0;">${inspection.precioSugerido ? `$${inspection.precioSugerido}` : 'No ingresado'}</p>
    
    <div class="section-title">📋 DATOS RUNT COMPLETOS</div>
    <table class="info-table">
      <tr><th>Multas SIMIT</th><td>${inspection.vehicleHistory?.simitFines || ''}</td><th>Pignoración</th><td>${inspection.vehicleHistory?.pignoracion || ''}</td></tr>
      <tr><th>Timbre</th><td>${inspection.vehicleHistory?.timbreValue || ''}</td><th>Imp. Gobernación</th><td>${inspection.vehicleHistory?.governorTax?.status || ''} ${inspection.vehicleHistory?.governorTax?.status === 'DEBE' && inspection.vehicleHistory?.governorTax?.amount ? `- $${inspection.vehicleHistory.governorTax.amount}` : ''}</td></tr>
      <tr><th>Imp. Movilidad</th><td>${inspection.vehicleHistory?.mobilityTax?.status || ''} ${inspection.vehicleHistory?.mobilityTax?.status === 'DEBE' && inspection.vehicleHistory?.mobilityTax?.amount ? `- $${inspection.vehicleHistory.mobilityTax.amount}` : ''}</td><th>SOAT</th><td>${inspection.vehicleHistory?.soatExpiry?.month || ''} ${inspection.vehicleHistory?.soatExpiry?.year || ''}</td></tr>
      <tr><th>Tecnomecánica</th><td>${inspection.vehicleHistory?.technicalExpiry?.applies === 'No' ? 'No aplica' : (inspection.vehicleHistory?.technicalExpiry?.month && inspection.vehicleHistory?.technicalExpiry?.year ? `${inspection.vehicleHistory.technicalExpiry.month} ${inspection.vehicleHistory.technicalExpiry.year}` : 'N/A')}</td><th>Cilindraje</th><td>${inspection.vehicleHistory?.engineDisplacement || ''}</td></tr>
      <tr><th>Combustible</th><td>${inspection.vehicleHistory?.fuelType || ''} ${inspection.vehicleHistory?.fuelType === 'Otro' && inspection.vehicleHistory?.otherFuelType ? `(${inspection.vehicleHistory.otherFuelType})` : ''}</td><th>Kilometraje</th><td>${inspection.vehicleHistory?.mileage || ''}</td></tr>
      <tr><th>Matriculado en</th><td>${inspection.vehicleHistory?.registrationCity || ''}</td><th>Fasecolda</th><td>${inspection.vehicleHistory?.fasecoldaReports || ''}</td></tr>
    </table>
    
    <div class="section-title">💡 SUGERENCIAS DE DIAGNÓSTICO</div>
    <ul class="diagnostico-list">
      ${(inspection.sugerenciasDiagnostico && inspection.sugerenciasDiagnostico.length > 0)
        ? inspection.sugerenciasDiagnostico.map(s => `<li>${s}</li>`).join('')
        : '<li>No hay sugerencias registradas.</li>'}
    </ul>
    
    <div style="margin: 15px 0 0 0; text-align: center;">
      ${(() => {
        const res = inspection.resultadoInspeccion;
        if (res === 'approved') {
          return `<div style=\"display:inline-block;background:rgba(76,175,80,0.15);border:2px solid #4CAF50;color:#4CAF50;padding:12px 24px;border-radius:12px;font-size:18px;font-weight:bold;box-shadow:0 2px 6px rgba(76,175,80,0.08);margin-bottom:8px;\">✔️ Aprobado</div>`;
        } else if (res === 'rejected') {
          return `<div style=\"display:inline-block;background:rgba(255,0,0,0.12);border:2px solid #FF0000;color:#FF0000;padding:12px 24px;border-radius:12px;font-size:18px;font-weight:bold;box-shadow:0 2px 6px rgba(255,0,0,0.08);margin-bottom:8px;\">❌ No Aprobado</div>`;
        } else if (res === 'conditional') {
          return `<div style=\"display:inline-block;background:rgba(255,152,0,0.12);border:2px solid #FF9800;color:#FF9800;padding:12px 24px;border-radius:12px;font-size:18px;font-weight:bold;box-shadow:0 2px 6px rgba(255,152,0,0.08);margin-bottom:8px;\">⚠️ Condicional</div>`;
        } else {
          return `<div style=\"display:inline-block;background:rgba(136,136,136,0.10);border:2px solid #888;color:#888;padding:12px 24px;border-radius:12px;font-size:18px;font-weight:bold;box-shadow:0 2px 6px rgba(136,136,136,0.08);margin-bottom:8px;\">N/A</div>`;
        }
      })()}
    </div>

  </div>

  <!-- HOJA 2: Items de inspección - Luces y Exterior -->
  <div class="container page-break" style="position: relative;">
    ${watermarkBase64 ? `<img src="data:${watermarkMimeType};base64,${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : '<!-- No hay marca de agua disponible -->'}
    <div class="section-title">🔍 ITEMS DE INSPECCIÓN - LUCES Y EXTERIOR</div>
    ${generateInspectionItemsHTML(inspection, 'Luces y Exterior')}
  </div>

  <!-- HOJA 3: Items de inspección - Motor y Soportes, Interior del Vehículo -->
  <div class="container page-break" style="position: relative;">
    ${watermarkBase64 ? `<img src="data:${watermarkMimeType};base64,${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : '<!-- No hay marca de agua disponible -->'}
    <div class="section-title">🔧 ITEMS DE INSPECCIÓN - MOTOR Y SOPORTES</div>
    ${generateInspectionItemsHTML(inspection, 'Motor y Soportes')}
    
    <div class="section-title">🚪 ITEMS DE INSPECCIÓN - INTERIOR DEL VEHÍCULO</div>
    ${generateInspectionItemsHTML(inspection, 'Interior del Vehículo')}
  </div>

  <!-- HOJA 4: Inspección de Carrocería -->
  ${inspection.bodyInspection ? `
  <div class="container page-break" style="position: relative;">
    ${watermarkBase64 ? `<img src="data:${watermarkMimeType};base64,${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : '<!-- No hay marca de agua disponible -->'}
    ${await generateBodyInspectionHTML(inspection, false)}
  </div>
  ` : ''}

  <!-- HOJA 5: Inspección de Llantas y Estado de Batería/Frenos -->
  ${inspection.tireInspection ? `
  <div class="container page-break" style="position: relative;">
    ${watermarkBase64 ? `<img src="data:${watermarkMimeType};base64,${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : '<!-- No hay marca de agua disponible -->'}
    ${await generateTireInspectionHTML(inspection, false)}
    ${generateBatteryAndBrakeHTML(inspection)}
  </div>
  ` : ''}

  <!-- HOJA 5+: Inspección Fotográfica (máximo 2 fotos por hoja) -->
  ${await generatePhotoInspectionHTML(inspection)}

  <div class="footer" style="position: relative;">
    ${watermarkBase64 ? `<img src="data:${watermarkMimeType};base64,${watermarkBase64}" class="watermark" alt="Marca de Agua" />` : '<!-- No hay marca de agua disponible -->'}
    <p style="margin: 5px 0;"><strong>${settings.companyName || 'MTinspector'}</strong> - Sistema de Inspección Vehicular Profesional</p>
    <p style="margin: 5px 0; font-size: 10px;">Este documento es generado automáticamente por el sistema de inspección vehicular.</p>
    <p style="margin: 5px 0; font-size: 10px;">Fecha de generación: ${new Date().toLocaleDateString('es-CO')} - Documento válido por 30 días desde la fecha de inspección.</p>
  </div>
  

 
 <!-- Disclaimer legal en pie de página de cada página -->
 <div class="legal-disclaimer">
   <strong>El presente formato de revisión vehicular corresponde meramente a historial de MT AUTOS y no constituye un peritaje certificado según las disposiciones legales colombianas.</strong><br>
   Este documento no es válido para la compra o reclamaciones futuras por revisiones efectuadas al vehículo después de su emisión.
 </div>
</body>
</html>
`;
}; 