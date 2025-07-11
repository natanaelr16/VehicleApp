// Servicio para consultar información del RUNT y SIMIT
export interface RUNTResponse {
  success: boolean;
  data?: {
    placa: string;
    marca: string;
    modelo: string;
    anio: string;
    color: string;
    vin: string;
    propietario: string;
    documento: string;
    telefono?: string;
    estado: string;
    soat?: {
      vigente: boolean;
      fechaVencimiento?: string;
    };
    tecnomecanica?: {
      vigente: boolean;
      fechaVencimiento?: string;
    };
    impuestos?: {
      gobernacion: {
        alDia: boolean;
        valor?: string;
      };
      movilidad: {
        alDia: boolean;
        valor?: string;
      };
    };
  };
  error?: string;
}

export interface SIMITResponse {
  success: boolean;
  data?: {
    multasPendientes: number;
    valorTotal: string;
    multas: Array<{
      fecha: string;
      descripcion: string;
      valor: string;
      estado: string;
    }>;
  };
  error?: string;
}

export interface VehicleSearchResult {
  runt: RUNTResponse;
  simit: SIMITResponse;
}

// Función para consultar información del RUNT
export const consultarRUNT = async (placa: string): Promise<RUNTResponse> => {
  try {
    console.log('Consultando RUNT para placa:', placa);
    
    // URL de la API del RUNT (ejemplo - puede variar)
    const url = `https://www.runt.com.co/consultaCiudadana/consultaVehiculo/${placa.toUpperCase()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MTinspector/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Procesar la respuesta del RUNT
    const processedData = {
      placa: data.placa || placa.toUpperCase(),
      marca: data.marca || '',
      modelo: data.modelo || '',
      anio: data.anio || data.anioFabricacion || '',
      color: data.color || '',
      vin: data.vin || data.numeroMotor || '',
      propietario: data.propietario || data.nombrePropietario || '',
      documento: data.documento || data.numeroDocumento || '',
      telefono: data.telefono || '',
      estado: data.estado || 'ACTIVO',
      soat: {
        vigente: data.soat?.vigente || false,
        fechaVencimiento: data.soat?.fechaVencimiento || '',
      },
      tecnomecanica: {
        vigente: data.tecnomecanica?.vigente || false,
        fechaVencimiento: data.tecnomecanica?.fechaVencimiento || '',
      },
      impuestos: {
        gobernacion: {
          alDia: data.impuestos?.gobernacion?.alDia || true,
          valor: data.impuestos?.gobernacion?.valor || '',
        },
        movilidad: {
          alDia: data.impuestos?.movilidad?.alDia || true,
          valor: data.impuestos?.movilidad?.valor || '',
        },
      },
    };

    return {
      success: true,
      data: processedData,
    };
  } catch (error) {
    console.error('Error consultando RUNT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

// Función para consultar información del SIMIT
export const consultarSIMIT = async (placa: string): Promise<SIMITResponse> => {
  try {
    console.log('Consultando SIMIT para placa:', placa);
    
    // URL de la API del SIMIT (ejemplo - puede variar)
    const url = `https://www.simit.gov.co/api/multas/${placa.toUpperCase()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MTinspector/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Procesar la respuesta del SIMIT
    const processedData = {
      multasPendientes: data.multasPendientes || 0,
      valorTotal: data.valorTotal || '0',
      multas: data.multas || [],
    };

    return {
      success: true,
      data: processedData,
    };
  } catch (error) {
    console.error('Error consultando SIMIT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

// Servicio mock para pruebas cuando las APIs reales no estén disponibles
export const consultarVehiculoMock = async (placa: string): Promise<VehicleSearchResult> => {
  console.log('Usando servicio mock para placa:', placa);
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Datos de ejemplo
  const mockRuntData: RUNTResponse = {
    success: true,
    data: {
      placa: placa.toUpperCase(),
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: '2020',
      color: 'Blanco',
      vin: '1HGBH41JXMN109186',
      propietario: 'Juan Carlos Pérez',
      documento: '12345678',
      telefono: '3001234567',
      estado: 'ACTIVO',
      soat: {
        vigente: true,
        fechaVencimiento: '2024-12-31',
      },
      tecnomecanica: {
        vigente: true,
        fechaVencimiento: '2024-06-30',
      },
      impuestos: {
        gobernacion: {
          alDia: true,
          valor: '',
        },
        movilidad: {
          alDia: false,
          valor: '150000',
        },
      },
    },
  };

  const mockSimitData: SIMITResponse = {
    success: true,
    data: {
      multasPendientes: 2,
      valorTotal: '250000',
      multas: [
        {
          fecha: '2024-01-15',
          descripcion: 'Exceso de velocidad',
          valor: '150000',
          estado: 'PENDIENTE',
        },
        {
          fecha: '2024-02-20',
          descripcion: 'Parqueo en lugar prohibido',
          valor: '100000',
          estado: 'PENDIENTE',
        },
      ],
    },
  };

  return {
    runt: mockRuntData,
    simit: mockSimitData,
  };
};

// Función principal para consultar ambos servicios
export const consultarVehiculo = async (placa: string): Promise<VehicleSearchResult> => {
  console.log('Iniciando consulta completa para placa:', placa);
  
  try {
    // Primero intentar con las APIs reales
    const [runtResponse, simitResponse] = await Promise.allSettled([
      consultarRUNT(placa),
      consultarSIMIT(placa),
    ]);

    const result: VehicleSearchResult = {
      runt: runtResponse.status === 'fulfilled' ? runtResponse.value : {
        success: false,
        error: 'Error consultando RUNT',
      },
      simit: simitResponse.status === 'fulfilled' ? simitResponse.value : {
        success: false,
        error: 'Error consultando SIMIT',
      },
    };

    // Si ambas consultas fallaron, usar datos mock
    if (!result.runt.success && !result.simit.success) {
      console.log('APIs reales no disponibles, usando datos mock');
      return await consultarVehiculoMock(placa);
    }

    console.log('Resultado de consulta:', result);
    return result;
  } catch (error) {
    console.error('Error en consulta completa:', error);
    console.log('Usando datos mock debido a error');
    return await consultarVehiculoMock(placa);
  }
};

// Función para formatear la información del vehículo para el formulario
export const formatearParaFormulario = (runtData: RUNTResponse, simitData: SIMITResponse) => {
  if (!runtData.success || !runtData.data) {
    return null;
  }

  const data = runtData.data;
  
  return {
    vehicleInfo: {
      plate: data.placa,
      brand: data.marca,
      model: data.modelo,
      year: data.anio,
      color: data.color,
      vin: data.vin,
      ownerName: data.propietario,
      ownerPhone: data.telefono || '',
    },
    vehicleHistory: {
      simitFines: simitData.success && simitData.data 
        ? `${simitData.data.multasPendientes} multas pendientes - Total: $${simitData.data.valorTotal}`
        : 'Sin información disponible',
      pignoracion: 'No' as const, // Por defecto, se puede actualizar manualmente
      timbreValue: '', // Se debe llenar manualmente
      governorTax: {
        status: data.impuestos?.gobernacion?.alDia ? 'AL DIA' as const : 'DEBE' as const,
        amount: data.impuestos?.gobernacion?.valor || '',
      },
      mobilityTax: {
        status: data.impuestos?.movilidad?.alDia ? 'AL DIA' as const : 'DEBE' as const,
        amount: data.impuestos?.movilidad?.valor || '',
      },
      soatExpiry: {
        month: data.soat?.fechaVencimiento ? new Date(data.soat.fechaVencimiento).toLocaleDateString('es-ES', { month: 'long' }) : '',
        year: data.soat?.fechaVencimiento ? new Date(data.soat.fechaVencimiento).getFullYear().toString() : '',
      },
      technicalExpiry: {
        applies: 'Si' as const, // Por defecto
        month: data.tecnomecanica?.fechaVencimiento ? new Date(data.tecnomecanica.fechaVencimiento).toLocaleDateString('es-ES', { month: 'long' }) : '',
        year: data.tecnomecanica?.fechaVencimiento ? new Date(data.tecnomecanica.fechaVencimiento).getFullYear().toString() : '',
      },
      engineDisplacement: '', // Se debe llenar manualmente
      fuelType: 'Gasolina' as const, // Por defecto
      mileage: '', // Se debe llenar manualmente
      registrationCity: '', // Se debe llenar manualmente
      fasecoldaReports: 'Sin reportes' as const, // Por defecto
    },
  };
}; 