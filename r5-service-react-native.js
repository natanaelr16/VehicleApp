// Servicio para conectar con el backend de R5 desde React Native

const R5_API_BASE_URL = 'https://tu-backend-url.com'; // Cambia esto por tu URL del backend

class R5Service {
  constructor(baseURL = R5_API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Obtener historial vehicular de R5
  async getVehicleHistory(placa, tipoDocumento, numeroDocumento, telefono) {
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
      throw error;
    }
  }

  // Verificar si el servicio está funcionando
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al verificar salud del servicio:', error);
      throw error;
    }
  }

  // Obtener información del servicio
  async getServiceInfo() {
    try {
      const response = await fetch(`${this.baseURL}/api/info`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener información del servicio:', error);
      throw error;
    }
  }
}

// Ejemplo de uso en un componente React Native
export const useR5Service = () => {
  const r5Service = new R5Service();

  const getVehicleHistory = async (vehicleData) => {
    try {
      const result = await r5Service.getVehicleHistory(
        vehicleData.placa,
        vehicleData.tipoDocumento,
        vehicleData.numeroDocumento,
        vehicleData.telefono
      );

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
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
        error: error.message
      };
    }
  };

  return {
    getVehicleHistory,
    checkServiceHealth
  };
};

// Ejemplo de componente React Native que usa el servicio
export const R5HistoryComponent = () => {
  const [loading, setLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [error, setError] = useState(null);
  const { getVehicleHistory } = useR5Service();

  const handleGetHistory = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getVehicleHistory(formData);

      if (result.success) {
        setVehicleData(result.data);
        // Aquí puedes procesar los datos como necesites
        console.log('Datos del vehículo:', result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error al conectar con el servicio');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    vehicleData,
    error,
    handleGetHistory
  };
};

// Ejemplo de cómo usar los datos en tu app
export const processR5Data = (r5Data) => {
  if (!r5Data || !r5Data.success) {
    return null;
  }

  const data = r5Data.data;
  
  // Procesar los datos para tu app
  const processedData = {
    // Información básica del vehículo
    vehiculo: {
      marca: data.vehiculo?.marca,
      modelo: data.vehiculo?.modelo,
      anio: data.vehiculo?.anio,
      placa: data.vehiculo?.placa,
      vin: data.vehiculo?.vin,
      color: data.vehiculo?.color,
      cilindraje: data.vehiculo?.cilindraje,
      combustible: data.vehiculo?.combustible
    },
    
    // Estados importantes
    estados: {
      soatVigente: data.status?.soat?.some(poliza => poliza.estado === 'Vigente'),
      revisionTecnomecanica: data.status?.revisionTecnomecanica,
      sinMultas: data.status?.multas?.includes('No tiene multas'),
      sinAccidentes: data.status?.accidentes?.includes('No hemos identificado'),
      limitacionesTraspaso: data.status?.limitacionesTraspaso === 'fallido'
    },
    
    // Información de SOAT
    soat: data.status?.soat?.map(poliza => ({
      estado: poliza.estado,
      vigencia: `${poliza.fechaInicio} - ${poliza.fechaFin}`,
      entidad: poliza.entidad,
      poliza: poliza.poliza
    })),
    
    // Historial de solicitudes
    solicitudes: data.historialSolicitudes?.map(solicitud => ({
      estado: solicitud.estado,
      fecha: solicitud.fecha,
      tipo: solicitud.tipo,
      entidad: solicitud.entidad
    })),
    
    // Recomendaciones
    recomendaciones: data.recomendaciones,
    
    // Fecha de generación
    fechaGeneracion: data.fechaGeneracion
  };

  return processedData;
};

export default R5Service; 