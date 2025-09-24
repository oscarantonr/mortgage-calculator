const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Habilitar CORS para permitir peticiones desde Angular
app.use(cors({
  origin: 'https://mortgage-simulate.netlify.app/'
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

// Ruta principal - Devuelve directamente los datos del Euríbor
app.get('/', async (req, res) => {
  try {
    const euriborData = await scrapeEuribor();
    res.json(euriborData);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener el valor del Euríbor',
      message: error.message
    });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de scraping ejecutándose en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log('- GET / - Obtiene el valor actual del Euríbor (ruta principal)');
});
