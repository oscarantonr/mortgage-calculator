# Backend de Scraping de Euríbor

Este servidor Node.js realiza web scraping para obtener el valor actual del Euríbor desde iAhorro.

## Instalación

1. Asegúrate de tener Node.js instalado
2. Ejecuta `npm install` para instalar las dependencias
3. Ejecuta `npm start` para iniciar el servidor

## Endpoints

- GET `/` - Devuelve el valor actual del Euríbor

## Respuesta

```json
{
  "value": 3.67,
  "date": "2023-09-17",
  "rawValue": "3,67%"
}
```
