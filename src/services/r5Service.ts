// Servicio para conectar con el backend de R5 desde React Native
import { R5VehicleData, R5Response } from '../types';

const R5_API_BASE_URL = 'https://tu-backend-url.com'; // Cambia esto por tu URL del backend

class R5Service {
  private baseURL: string;

  constructor(baseURL = R5_API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Obtener historial vehicular de R5
  async getVehicleHistory(
    placa: string, 
    tipoDocumento: string, 
    numeroDocumento: string, 
    telefono: string
  ): Promise<R5Response> {
    try {
      const response = await fetch(`${this.baseURL}/api/r5/historial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placa,
          tipoDocumento,
          numeroDocumento,
          telefono
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener historial de R5:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Verificar si el servicio está funcionando
  async checkHealth(): Promise<R5Response> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al verificar salud del servicio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Procesar datos de R5 para usar en la app
  processR5Data(r5Data: R5VehicleData) {
    return {
      // Información básica del vehículo
      vehiculo: {
        marca: r5Data.vehiculo?.marca || '',
        modelo: r5Data.vehiculo?.modelo || '',
        anio: r5Data.vehiculo?.anio || '',
        placa: r5Data.vehiculo?.placa || '',
        vin: r5Data.vehiculo?.vin || '',
        color: r5Data.vehiculo?.color || '',
        cilindraje: r5Data.vehiculo?.cilindraje || '',
        combustible: r5Data.vehiculo?.combustible || '',
        antiguedad: r5Data.vehiculo?.antiguedad || '',
        autoridad: r5Data.vehiculo?.autoridad || ''
      },
      
      // Estados importantes
      estados: {
        soatVigente: r5Data.status?.soat?.some(poliza => poliza.estado === 'Vigente') || false,
        revisionTecnomecanica: r5Data.status?.revisionTecnomecanica || '',
        sinMultas: r5Data.status?.multas?.includes('No tiene multas') || false,
        sinAccidentes: r5Data.status?.accidentes?.includes('No hemos identificado') || false,
        limitacionesTraspaso: r5Data.status?.limitacionesTraspaso === 'fallido',
        sinMedidasCautelares: r5Data.status?.medidasCautelares?.every(medida => medida.estado === 'ok') || false
      },
      
      // Información de SOAT
      soat: r5Data.status?.soat?.map(poliza => ({
        estado: poliza.estado,
        vigencia: `${poliza.fechaInicio} - ${poliza.fechaFin}`,
        entidad: poliza.entidad,
        poliza: poliza.poliza
      })) || [],
      
      // Historial de solicitudes
      solicitudes: r5Data.historialSolicitudes?.map(solicitud => ({
        estado: solicitud.estado,
        fecha: solicitud.fecha,
        tipo: solicitud.tipo,
        entidad: solicitud.entidad,
        radicado: solicitud.radicado
      })) || [],
      
      // Recomendaciones
      recomendaciones: r5Data.recomendaciones || [],
      
      // Fecha de generación
      fechaGeneracion: r5Data.fechaGeneracion || '',
      idHistorial: r5Data.idHistorial || ''
    };
  }
}

// Instancia global del servicio
export const r5Service = new R5Service();

// Hook personalizado para usar R5 en componentes
export const useR5Service = () => {
  const getVehicleHistory = async (vehicleData: {
    placa: string;
    tipoDocumento: string;
    numeroDocumento: string;
    telefono: string;
  }) => {
    try {
      const result = await r5Service.getVehicleHistory(
        vehicleData.placa,
        vehicleData.tipoDocumento,
        vehicleData.numeroDocumento,
        vehicleData.telefono
      );

      if (result.success && result.data) {
        const processedData = r5Service.processR5Data(result.data);
        return {
          success: true,
          data: processedData
        };
      } else {
        return {
          success: false,
          error: result.error || 'Error al obtener datos de R5'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const checkServiceHealth = async () => {
    try {
      const result = await r5Service.checkHealth();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  return {
    getVehicleHistory,
    checkServiceHealth
  };
};

export default R5Service; 