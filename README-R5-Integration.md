# Integración de R5 en Vehicle Inspection App

Este documento explica cómo integrar el servicio de historial vehicular de R5 en tu aplicación de inspección de vehículos.

## 📋 Contenido

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Uso del Servicio](#uso-del-servicio)
5. [Estructura de Datos](#estructura-de-datos)
6. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
7. [Solución de Problemas](#solución-de-problemas)

## 🎯 Descripción General

El servicio de R5 permite obtener información detallada del historial vehicular incluyendo:
- Información técnica del vehículo
- Estado del SOAT
- Revisión tecnomecánica
- Multas y limitaciones
- Historial de solicitudes
- Medidas cautelares

## 🏗️ Arquitectura

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐    Web Scraping    ┌─────────────┐
│   React Native  │ ──────────────► │   Backend R5    │ ─────────────────► │   R5 Web    │
│      App        │                 │    Service      │                    │   Service   │
└─────────────────┘                 └─────────────────┘                    └─────────────┘
```

### Componentes:

1. **Backend Service** (`r5-backend-service.js`)
   - Servidor Express con Puppeteer
   - Maneja el web scraping de R5
   - Expone API REST

2. **Scraper** (`r5-scraper-example.js`)
   - Extrae datos del HTML de R5
   - Usa Cheerio para parsing
   - Estructura los datos en JSON

3. **React Native Service** (`r5-service-react-native.js`)
   - Cliente para conectar con el backend
   - Hooks y utilidades para React Native

## 🚀 Instalación y Configuración

### 1. Configurar el Backend

```bash
# Crear directorio para el backend
mkdir r5-backend
cd r5-backend

# Instalar dependencias
npm install express puppeteer cheerio

# Copiar los archivos del backend
cp r5-backend-service.js .
cp r5-scraper-example.js .
cp package.json .
```

### 2. Configurar Variables de Entorno

Crear archivo `.env`:

```env
PORT=3000
NODE_ENV=production
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox
```

### 3. Desplegar el Backend

#### Opción A: Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init
railway up
```

#### Opción B: Render
```bash
# Conectar repositorio a Render
# Configurar build command: npm install
# Configurar start command: npm start
```

#### Opción C: Fly.io
```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### 4. Configurar React Native

```javascript
// En tu app React Native, importar el servicio
import { useR5Service, processR5Data } from './r5-service-react-native';

// Configurar la URL del backend
const R5_API_BASE_URL = 'https://tu-backend-url.com';
```

## 📱 Uso del Servicio

### 1. Hook Básico

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useR5Service } from './r5-service-react-native';

const R5HistoryScreen = () => {
  const [placa, setPlaca] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  
  const { getVehicleHistory } = useR5Service();

  const handleGetHistory = async () => {
    try {
      const result = await getVehicleHistory({
        placa,
        tipoDocumento,
        numeroDocumento,
        telefono
      });

      if (result.success) {
        const processedData = processR5Data(result);
        // Usar los datos procesados
        console.log('Datos del vehículo:', processedData);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servicio');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Placa"
        value={placa}
        onChangeText={setPlaca}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Tipo de Documento"
        value={tipoDocumento}
        onChangeText={setTipoDocumento}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Número de Documento"
        value={numeroDocumento}
        onChangeText={setNumeroDocumento}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <TouchableOpacity onPress={handleGetHistory}>
        <Text>Obtener Historial</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. Integración con tu App Existente

```javascript
// En tu app de inspección, agregar una nueva pantalla
import { R5HistoryComponent } from './r5-service-react-native';

const InspectionFormScreen = () => {
  const { loading, vehicleData, error, handleGetHistory } = R5HistoryComponent();

  // Integrar con tu formulario existente
  const handleInspectionComplete = async (inspectionData) => {
    // Obtener datos de R5 si es necesario
    if (inspectionData.placa) {
      await handleGetHistory({
        placa: inspectionData.placa,
        tipoDocumento: 'CC',
        numeroDocumento: inspectionData.numeroDocumento,
        telefono: inspectionData.telefono
      });
    }
    
    // Continuar con tu lógica de inspección
  };

  return (
    <View>
      {/* Tu UI existente */}
      
      {/* Mostrar datos de R5 si están disponibles */}
      {vehicleData && (
        <View>
          <Text>SOAT Vigente: {vehicleData.estados.soatVigente ? 'Sí' : 'No'}</Text>
          <Text>Sin Multas: {vehicleData.estados.sinMultas ? 'Sí' : 'No'}</Text>
          <Text>Sin Accidentes: {vehicleData.estados.sinAccidentes ? 'Sí' : 'No'}</Text>
        </View>
      )}
    </View>
  );
};
```

## 📊 Estructura de Datos

### Respuesta del Servicio

```json
{
  "success": true,
  "data": {
    "fechaGeneracion": "12 jul 2025 01:44 PM",
    "idHistorial": "58323ac5-3089-4c6c-9432-ba95dbd43817",
    "vehiculo": {
      "marca": "CHEVROLET",
      "modelo": "ONIX",
      "anio": "2021",
      "placa": "MXT897",
      "vin": "3G1M95E26ML119039",
      "color": "PLATINO METALIZADO",
      "cilindraje": "1000",
      "combustible": "Gasolina"
    },
    "status": {
      "limitacionesTraspaso": "fallido",
      "vehiculoSinAccidentes": true,
      "soat": [
        {
          "estado": "Vigente",
          "fechaInicio": "9 ago 2024",
          "fechaFin": "8 ago 2025",
          "poliza": "890111614250100",
          "entidad": "seguros comerciales bolivar sa"
        }
      ],
      "revisionTecnomecanica": "No necesita Revisión Tecnicomecánica aún.",
      "multas": "No tiene multas registradas",
      "impuestos": "¡Uy, en este momento no tenemos información de impuestos para tu ciudad!",
      "medidasCautelares": [
        { "tipo": "Embargo", "estado": "ok" }
      ],
      "accidentes": "No hemos identificado registros de accidentes."
    },
    "historialSolicitudes": [
      {
        "estado": "Aprobada",
        "fecha": "15 dic 2022",
        "tipo": "tramite certificado tradicion",
        "entidad": "instituto municipal de transito y transporte de clemencia bolivar",
        "radicado": "200895420"
      }
    ],
    "recomendaciones": [
      "¡Aprende a identificar el vehículo!",
      "¡Recomendaciones importantes!"
    ],
    "disclaimer": [
      "Este informe es una herramienta adicional, no un consejo de inversión..."
    ]
  }
}
```

## 🔒 Consideraciones de Seguridad

### 1. Rate Limiting
```javascript
// Agregar rate limiting al backend
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
});

app.use('/api/r5/', limiter);
```

### 2. Validación de Datos
```javascript
// Validar datos de entrada
const validateVehicleData = (data) => {
  const { placa, tipoDocumento, numeroDocumento, telefono } = data;
  
  if (!placa || placa.length < 5) {
    throw new Error('Placa inválida');
  }
  
  if (!['CC', 'CE', 'TI', 'PP'].includes(tipoDocumento)) {
    throw new Error('Tipo de documento inválido');
  }
  
  if (!numeroDocumento || numeroDocumento.length < 8) {
    throw new Error('Número de documento inválido');
  }
  
  if (!telefono || telefono.length < 10) {
    throw new Error('Teléfono inválido');
  }
};
```

### 3. Manejo de Errores
```javascript
// En el backend
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// En React Native
const handleError = (error) => {
  if (error.message.includes('network')) {
    Alert.alert('Error de Conexión', 'Verifica tu conexión a internet');
  } else if (error.message.includes('timeout')) {
    Alert.alert('Tiempo de Espera', 'El servicio está tardando en responder');
  } else {
    Alert.alert('Error', 'Ocurrió un error inesperado');
  }
};
```

## 🛠️ Solución de Problemas

### Problemas Comunes

1. **Error de Puppeteer en servidor**
   ```bash
   # Agregar argumentos adicionales
   --disable-dev-shm-usage
   --disable-gpu
   --no-sandbox
   ```

2. **Timeout en scraping**
   ```javascript
   // Aumentar timeout
   await page.waitForSelector('.sc-fbNYsL', { timeout: 60000 });
   ```

3. **CORS errors**
   ```javascript
   // Configurar CORS correctamente
   app.use(cors({
     origin: ['http://localhost:3000', 'https://tu-app.com'],
     credentials: true
   }));
   ```

4. **Datos no encontrados**
   ```javascript
   // Verificar si los selectores siguen siendo válidos
   // Los sitios web pueden cambiar su estructura
   ```

### Logs y Debugging

```javascript
// Habilitar logs detallados
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('HTML obtenido:', html.substring(0, 500));
  console.log('Datos extraídos:', JSON.stringify(result, null, 2));
}
```

## 📈 Monitoreo y Mantenimiento

### 1. Health Checks
```javascript
// Verificar salud del servicio regularmente
setInterval(async () => {
  try {
    const health = await r5Service.checkHealth();
    if (!health.success) {
      console.error('Servicio R5 no está funcionando');
      // Enviar alerta
    }
  } catch (error) {
    console.error('Error en health check:', error);
  }
}, 5 * 60 * 1000); // Cada 5 minutos
```

### 2. Métricas
```javascript
// Agregar métricas básicas
const metrics = {
  requests: 0,
  errors: 0,
  avgResponseTime: 0
};

app.use('/api/r5/*', (req, res, next) => {
  const start = Date.now();
  metrics.requests++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.avgResponseTime = (metrics.avgResponseTime + duration) / 2;
    
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
  });
  
  next();
});
```

## 🎯 Próximos Pasos

1. **Desplegar el backend** en un servicio como Railway, Render o Fly.io
2. **Configurar la URL** del backend en tu app React Native
3. **Integrar el servicio** en tu flujo de inspección existente
4. **Agregar validaciones** y manejo de errores
5. **Implementar cache** para evitar requests repetidos
6. **Agregar métricas** y monitoreo

## 📞 Soporte

Si tienes problemas con la integración:

1. Verifica que el backend esté funcionando: `GET /api/health`
2. Revisa los logs del servidor
3. Verifica que los selectores del scraper sigan siendo válidos
4. Asegúrate de que R5 no haya cambiado su estructura HTML

---

**Nota**: Este servicio depende del scraping de un sitio web externo. Los cambios en el sitio de R5 pueden requerir actualizaciones en el scraper. 