const express = require('express');
const puppeteer = require('puppeteer');
const { extractR5Data } = require('./r5-scraper-example.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configuración de CORS para permitir peticiones desde tu app React Native
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Variable global para mantener la instancia del navegador
let browser = null;

// Inicializar el navegador
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }
  return browser;
}

// Función para obtener datos de R5
async function getR5Data(placa, tipoDocumento, numeroDocumento, telefono) {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  try {
    // Configurar el user agent para parecer un navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Ir a la página de R5
    await page.goto('https://autolink.grupor5.com/historial/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Esperar a que el formulario esté disponible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Llenar el formulario
    await page.type('input[name="placa"]', placa);
    await page.type('input[name="tipoDocumento"]', tipoDocumento);
    await page.type('input[name="numeroDocumento"]', numeroDocumento);
    await page.type('input[name="telefono"]', telefono);
    
    // Enviar el formulario
    await page.click('button[type="submit"]');
    
    // Esperar a que se cargue la página de resultados
    await page.waitForSelector('.sc-fbNYsL', { timeout: 30000 });
    
    // Obtener el HTML de la página de resultados
    const html = await page.content();
    
    // Extraer los datos usando nuestro scraper
    const result = extractR5Data(html);
    
    return result;
    
  } catch (error) {
    console.error('Error al obtener datos de R5:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  } finally {
    await page.close();
  }
}

// Endpoint principal para obtener datos de R5
app.post('/api/r5/historial', async (req, res) => {
  try {
    const { placa, tipoDocumento, numeroDocumento, telefono } = req.body;
    
    // Validar los datos de entrada
    if (!placa || !tipoDocumento || !numeroDocumento || !telefono) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos: placa, tipoDocumento, numeroDocumento, telefono'
      });
    }
    
    console.log(`Solicitando historial para placa: ${placa}`);
    
    // Obtener los datos de R5
    const result = await getR5Data(placa, tipoDocumento, numeroDocumento, telefono);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Error al obtener datos de R5'
      });
    }
    
  } catch (error) {
    console.error('Error en el endpoint /api/r5/historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Endpoint de salud para verificar que el servicio esté funcionando
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servicio R5 funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para obtener información sobre el servicio
app.get('/api/info', (req, res) => {
  res.json({
    name: 'R5 Vehicle History Service',
    version: '1.0.0',
    description: 'Servicio para obtener historial vehicular de R5',
    endpoints: {
      'POST /api/r5/historial': 'Obtener historial vehicular',
      'GET /api/health': 'Verificar estado del servicio',
      'GET /api/info': 'Información del servicio'
    }
  });
});

// Manejar el cierre del servidor
process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servicio R5 ejecutándose en el puerto ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 