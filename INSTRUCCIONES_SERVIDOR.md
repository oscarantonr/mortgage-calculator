# Instrucciones para iniciar el servidor de scraping

Para obtener los datos actualizados del Euríbor desde iAhorro, necesitas iniciar el servidor de scraping:

1. Abre una terminal/cmd
2. Navega a la carpeta "backend":

   ```
   cd c:\Users\Usuario\Desktop\Proyectos\simulador-hipoteca\backend
   ```

3. Instala las dependencias (solo la primera vez):

   ```
   npm install
   ```

4. Inicia el servidor:

   ```
   npm start
   ```

5. El servidor se iniciará en http://localhost:3000

Una vez que el servidor esté funcionando, podrás ver los datos actualizados del Euríbor en la aplicación Angular.

## Endpoints disponibles

- `http://localhost:3000/` - Obtiene el valor actual del Euríbor
