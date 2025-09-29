const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Variables para el sistema de caché
let euriborCache = null;
let lastFetchDate = null;

// Ruta al archivo de caché persistente
const CACHE_FILE_PATH = path.join(__dirname, 'euribor-cache.json');

// Habilitar CORS para permitir peticiones desde Angular
app.use(cors({
  // Configuración para desarrollo local y producción
  origin: ['http://localhost:4200', 'https://mortgage-simulate.netlify.app']
}));

// Función para realizar el scraping del Euríbor
async function scrapeEuribor() {
  try {
    console.log('Iniciando scraping de iAhorro...');
    
    // Realizar la petición HTTP a iAhorro
    const response = await axios.get('https://www.iahorro.com/euribor', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    });
    
    // Cargar el HTML con Cheerio
    const $ = cheerio.load(response.data);
    
    // Selector para el valor del Euríbor
    const selector = '#content > section > div.ia-layout.euribor-article__layout > div.ia-grid.euribor-article__wrapper > div.euribor-article__aside.is-desktop-4.is-laptop-4 > section.ia-aside-block.euribor-today.euribor-article__content > span.value';
    
    // Extraer el valor
    let euriborValue = $(selector).text().trim();
    
    // Si no se encuentra con el selector exacto, intentar un selector más genérico
    if (!euriborValue) {
      console.log('Selector exacto no encontró resultados, probando selector alternativo...');
      euriborValue = $('.euribor-today .value').text().trim();
    }
    
    // Verificar si se encontró algún valor
    if (!euriborValue) {
      throw new Error('No se pudo encontrar el valor del Euríbor en la página');
    }
    
    // Obtener la fecha actual
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // formato YYYY-MM-DD
    
    // Convertir el valor a número (eliminar el % si existe)
    const numericValue = parseFloat(euriborValue.replace('%', '').replace(',', '.'));
    
    console.log(`Valor del Euríbor obtenido: ${numericValue} (${date})`);
    
    // Devolver el resultado como objeto
    return {
      value: numericValue,
      date: date,
      rawValue: euriborValue
    };
    
  } catch (error) {
    console.error('Error durante el scraping:', error.message);
    throw error;
  }
}

// Función para cargar el caché desde el archivo si existe
async function loadCacheFromDisk() {
  try {
    const data = await fs.readFile(CACHE_FILE_PATH, 'utf8');
    const cacheData = JSON.parse(data);
    euriborCache = cacheData.cache;
    lastFetchDate = new Date(cacheData.timestamp);
    console.log('Caché cargado desde disco:', euriborCache);
  } catch (error) {
    console.log('No se encontró caché previo o error al cargar:', error.message);
    // Si no hay caché, inicializamos como null (se actualizará en la primera llamada)
    euriborCache = null;
    lastFetchDate = null;
  }
}

// Función para guardar el caché en el archivo
async function saveCacheToDisk() {
  try {
    const cacheData = {
      cache: euriborCache,
      timestamp: lastFetchDate
    };
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log('Caché guardado en disco con éxito');
  } catch (error) {
    console.error('Error al guardar caché en disco:', error.message);
  }
}

// Función para actualizar el caché del Euríbor si el valor ha cambiado
async function updateEuriborCache() {
  try {
    const newEuriborData = await scrapeEuribor();
    
    // Si es la primera vez o el valor ha cambiado, actualizamos el caché
    if (!euriborCache || newEuriborData.value !== euriborCache.value) {
      console.log(`Valor del Euríbor actualizado: ${euriborCache?.value || 'Sin valor previo'} → ${newEuriborData.value}`);
      euriborCache = newEuriborData;
      lastFetchDate = new Date();
      
      // Guardamos el nuevo caché en el archivo
      await saveCacheToDisk();
      
      return true; // Indica que hubo actualización
    } else {
      console.log(`El valor del Euríbor no ha cambiado (${newEuriborData.value}). No se actualiza el caché.`);
      
      // Actualizamos solo la fecha de comprobación
      lastFetchDate = new Date();
      await saveCacheToDisk();
      
      return false; // No hubo actualización
    }
  } catch (error) {
    console.error('Error al actualizar el caché del Euríbor:', error.message);
    throw error;
  }
}

// Ruta principal - Devuelve el valor cacheado
app.get('/', async (req, res) => {
  try {
    // Si no hay caché (primera ejecución o error previo), lo obtenemos
    if (!euriborCache) {
      await updateEuriborCache();
    }
    
    res.json({
      ...euriborCache,
      lastChecked: lastFetchDate
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener el valor del Euríbor',
      message: error.message
    });
  }
});


// Cargamos el caché desde disco al iniciar
loadCacheFromDisk().then(() => {
  // Programamos la tarea para que se ejecute todos los días a las 12:00 del mediodía
  cron.schedule('0 12 * * *', async () => {
    console.log('Ejecutando tarea programada para actualizar el valor del Euríbor...');
    try {
      const updated = await updateEuriborCache();
      console.log(updated ? 'Valor actualizado con éxito' : 'No fue necesario actualizar el valor');
    } catch (error) {
      console.error('Error en la tarea programada:', error.message);
    }
  }, {
    timezone: "Europe/Madrid" // Aseguramos que sea la hora de España
  });

  // Si no hay caché al iniciar, hacemos un primer scraping
  if (!euriborCache) {
    updateEuriborCache()
      .then(() => console.log('Caché inicial creado'))
      .catch(err => console.error('Error al crear caché inicial:', err.message));
  }

  // Iniciamos el servidor
  app.listen(PORT, () => {
    console.log(`Servidor de scraping ejecutándose en http://localhost:${PORT}`);
    console.log('Sistema de actualización programada: todos los días a las 12:00 PM (hora de Madrid)');
  });
});
