const cheerio = require('cheerio');

// Función principal para extraer datos del HTML de R5
function extractR5Data(html) {
  const $ = cheerio.load(html);
  
  try {
    const data = {
      fechaGeneracion: extractFechaGeneracion($),
      idHistorial: extractIdHistorial($),
      vehiculo: extractVehiculoInfo($),
      status: extractStatus($),
      historialSolicitudes: extractHistorialSolicitudes($),
      recomendaciones: extractRecomendaciones($),
      disclaimer: extractDisclaimer($)
    };
    
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

// Extraer fecha de generación
function extractFechaGeneracion($) {
  const fechaElement = $('.sc-dacFVT .sc-jQbKEx p.htKcVj').first();
  return fechaElement.text().trim() || null;
}

// Extraer ID del historial
function extractIdHistorial($) {
  const idElement = $('.sc-dacFVT .sc-jQbKEx p.htKcVj').last();
  return idElement.text().trim() || null;
}

// Extraer información del vehículo
function extractVehiculoInfo($) {
  const vehiculo = {};
  
  // Información básica del vehículo
  const marcaModeloAnio = $('.sc-jHVeRl h3.fPesdF').text().trim();
  if (marcaModeloAnio) {
    const partes = marcaModeloAnio.split(' ');
    vehiculo.marca = partes[0]?.toUpperCase();
    vehiculo.modelo = partes[1]?.toUpperCase();
    vehiculo.anio = partes[2];
  }
  
  // Placa
  const placaElement = $('.sc-aelVe section p.kxgpSr').first();
  vehiculo.placa = placaElement.text().trim();
  
  // Antigüedad
  const antiguedadElement = $('.sc-aelVe section p.kxgpSr').last();
  vehiculo.antiguedad = antiguedadElement.text().trim();
  
  // Especificaciones técnicas
  const especificaciones = $('.sc-kIeSmD p');
  especificaciones.each((index, element) => {
    const text = $(element).text().trim();
    const nextElement = especificaciones.eq(index + 1);
    
    if (text && nextElement.length > 0) {
      const valor = nextElement.text().trim();
      
      switch (text) {
        case 'VIN':
          vehiculo.vin = valor;
          break;
        case 'Servicio':
          vehiculo.servicio = valor;
          break;
        case 'Número de motor':
          vehiculo.motor = valor;
          break;
        case 'Número de chasis':
          vehiculo.chasis = valor;
          break;
        case 'Clase':
          vehiculo.clase = valor;
          break;
        case 'Año':
          vehiculo.anio = valor;
          break;
        case 'Tipo de Combustible':
          vehiculo.combustible = valor;
          break;
        case 'Marca':
          vehiculo.marca = valor;
          break;
        case 'Autoridad':
          vehiculo.autoridad = valor;
          break;
        case 'Modelo':
          vehiculo.modelo = valor;
          break;
        case 'Color':
          vehiculo.color = valor;
          break;
        case 'Cilindraje':
          vehiculo.cilindraje = valor;
          break;
      }
    }
  });
  
  return vehiculo;
}

// Extraer estados/indicadores
function extractStatus($) {
  const status = {};
  
  // Limitaciones para traspaso
  const limitacionesElement = $('.sc-jONmMj .dzARXo.failed p');
  if (limitacionesElement.length > 0) {
    status.limitacionesTraspaso = 'fallido';
  }
  
  // Vehículo sin accidentes
  const sinAccidentesElement = $('.sc-jONmMj .dzARXo:not(.failed) p');
  if (sinAccidentesElement.length > 0) {
    status.vehiculoSinAccidentes = true;
  }
  
  // SOAT
  status.soat = extractSOAT($);
  
  // Revisión tecnomecánica
  status.revisionTecnomecanica = extractRevisionTecnomecanica($);
  
  // Multas
  status.multas = extractMultas($);
  
  // Impuestos
  status.impuestos = extractImpuestos($);
  
  // Medidas cautelares
  status.medidasCautelares = extractMedidasCautelares($);
  
  // Accidentes
  status.accidentes = extractAccidentes($);
  
  return status;
}

// Extraer información de SOAT
function extractSOAT($) {
  const soatSection = $('h3#SOAT').closest('li');
  const soatPolicies = [];
  
  soatSection.find('.sc-dkIYMQ').each((i, el) => {
    const $el = $(el);
    const estado = $el.find('.sc-emqRaN').text().trim();
    const fechaInicio = $el.find('p:contains("Fecha de inicio")').next().text().trim();
    const fechaFin = $el.find('p:contains("Fecha de fin")').next().text().trim();
    const poliza = $el.find('p:contains("N. de póliza")').next().text().trim();
    const entidad = $el.find('p:contains("Entidad")').next().text().trim();
    
    if (estado || fechaInicio || fechaFin || poliza || entidad) {
      soatPolicies.push({
        estado,
        fechaInicio,
        fechaFin,
        poliza,
        entidad
      });
    }
  });
  
  return soatPolicies;
}

// Extraer revisión tecnomecánica
function extractRevisionTecnomecanica($) {
  const revisionSection = $('h3#REVISION\\ TECNOMECANICA').closest('li');
  const mensaje = revisionSection.find('.sc-XhViZ p.iGKPDO').text().trim();
  return mensaje || 'No hay información disponible';
}

// Extraer multas
function extractMultas($) {
  const multasSection = $('h3#MULTAS').closest('li');
  const mensaje = multasSection.find('.sc-XhViZ p.iGKPDO').text().trim();
  return mensaje || 'No hay información disponible';
}

// Extraer impuestos
function extractImpuestos($) {
  const impuestosSection = $('h3#IMPUESTOS').closest('li');
  const mensaje = impuestosSection.find('.sc-XhViZ p.iGKPDO').text().trim();
  return mensaje || 'No hay información disponible';
}

// Extraer medidas cautelares
function extractMedidasCautelares($) {
  const medidasSection = $('h3#MEDIDAS\\ CAUTELARES').closest('li');
  const medidas = [];
  
  medidasSection.find('.sc-tYqQR:not(.title) ul.right li').each((i, el) => {
    const tipo = $(el).text().trim();
    const estadoElement = medidasSection.find('.sc-tYqQR:not(.title) ul.left li').eq(i);
    const estado = estadoElement.find('.sc-emqRaN').hasClass('erUzeQ') ? 'ok' : 'pendiente';
    
    if (tipo) {
      medidas.push({ tipo, estado });
    }
  });
  
  return medidas;
}

// Extraer accidentes
function extractAccidentes($) {
  const accidentesSection = $('h3#ACCIDENTES\\ REPORTADOS').closest('li');
  const mensaje = accidentesSection.find('.sc-XhViZ p.iGKPDO').text().trim();
  return mensaje || 'No hay información disponible';
}

// Extraer historial de solicitudes
function extractHistorialSolicitudes($) {
  const solicitudesSection = $('h3#HISTORIAL\\ DE\\ SOLICITUDES').closest('li');
  const solicitudes = [];
  
  solicitudesSection.find('.sc-dkIYMQ').each((i, el) => {
    const $el = $(el);
    const estado = $el.find('.sc-emqRaN').text().trim();
    const fecha = $el.find('p:contains("Fecha")').next().text().trim();
    const tipo = $el.find('p:contains("Tipo")').next().text().trim();
    const entidad = $el.find('p:contains("Entidad")').next().text().trim();
    const radicado = $el.find('p:contains("N. de radicado")').next().text().trim();
    
    if (estado || fecha || tipo || entidad || radicado) {
      solicitudes.push({
        estado,
        fecha,
        tipo,
        entidad,
        radicado
      });
    }
  });
  
  return solicitudes;
}

// Extraer recomendaciones
function extractRecomendaciones($) {
  const recomendaciones = [];
  
  $('.sc-GTUqm.helper .sc-Gqece p.kxgpSr').each((i, el) => {
    const texto = $(el).text().trim();
    if (texto && !texto.includes('©') && !texto.includes('Calle')) {
      recomendaciones.push(texto);
    }
  });
  
  return recomendaciones;
}

// Extraer disclaimer
function extractDisclaimer($) {
  const disclaimer = [];
  
  $('.sc-GTUqm.helper .sc-Gqece p.iGKPDO.title').each((i, el) => {
    const texto = $(el).text().trim();
    if (texto) {
      disclaimer.push(texto);
    }
  });
  
  return disclaimer;
}

// Ejemplo de uso
function exampleUsage() {
  // Aquí irías el HTML que obtienes de la página de R5
  const html = `<!-- Tu HTML aquí -->`;
  
  const result = extractR5Data(html);
  
  if (result.success) {
    console.log('Datos extraídos exitosamente:');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.error('Error al extraer datos:', result.error);
  }
}

// Exportar la función principal
module.exports = {
  extractR5Data,
  exampleUsage
};

// Si ejecutas este archivo directamente, muestra un ejemplo
if (require.main === module) {
  console.log('Ejemplo de uso del scraper de R5:');
  console.log('const { extractR5Data } = require("./r5-scraper-example.js");');
  console.log('const result = extractR5Data(html);');
} 