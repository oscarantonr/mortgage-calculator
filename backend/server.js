const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Variables para el sistema de caché
let euriborCache = null;
let lastFetchDate = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

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

// Función para verificar si necesitamos actualizar el caché
function shouldUpdateCache() {
  // Si no hay caché, debemos actualizar
  if (!euriborCache || !lastFetchDate) {
    return true;
  }
  
  const now = new Date();
  const elapsedTime = now - lastFetchDate;
  
  // Comparamos también si cambió la fecha (para actualizaciones a medianoche)
  const currentDate = now.toISOString().split('T')[0];
  const cachedDate = lastFetchDate.toISOString().split('T')[0];
  
  return elapsedTime > CACHE_DURATION_MS || currentDate !== cachedDate;
}

// Ruta principal - Devuelve el valor cacheado o realiza un nuevo scraping si es necesario
app.get('/', async (req, res) => {
  try {
    // Comprobamos si necesitamos actualizar el caché
    if (shouldUpdateCache()) {
      console.log('Caché expirado o no existente, realizando nuevo scraping...');
      euriborCache = await scrapeEuribor();
      lastFetchDate = new Date();
      console.log(`Caché actualizado: ${JSON.stringify(euriborCache)}`);
    } else {
      console.log(`Sirviendo valor desde caché: ${JSON.stringify(euriborCache)}`);
    }
    
    res.json(euriborCache);
  } catch (error) {
    // Si hay un error en el scraping pero tenemos caché, devolvemos el valor cacheado
    if (euriborCache) {
      console.log('Error al obtener nuevo valor, sirviendo desde caché...');
      res.json(euriborCache);
    } else {
      res.status(500).json({
        error: 'Error al obtener el valor del Euríbor',
        message: error.message
      });
    }
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de scraping ejecutándose en http://localhost:${PORT}`);
  console.log('Sistema de caché implementado: el valor del Euríbor se actualizará una vez al día');
});
