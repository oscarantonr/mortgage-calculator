# Simulador de Hipoteca

Calculadora de hipotecas con opciones avanzadas de simulación, incluyendo amortizaciones anticipadas. Realiza cálculos precisos para mostrar la cuota mensual, intereses totales y planificación de pagos.

Características principales:

- Configuración de interés fijo o variable (Euríbor + diferencial)
- Soporte para diferentes plazos en años o meses
- Cálculo de amortizaciones anticipadas con dos opciones: reducción de cuota o reducción de plazo
- Visualización de tabla de amortización del primer año
- Formato europeo para números (separador de miles)
- Obtención automática del Euríbor actualizado

## Mejoras Futuras Planificadas

### UI/UX

- **Modo oscuro/nocturno**: Implementación de un tema oscuro para reducir la fatiga visual en entornos con poca luz
- **Mejorar manejo del focus en inputs**: Corregir el comportamiento del cursor al editar números con formato europeo para que mantenga la posición correcta del cursor cuando:
  - Se borre un dígito en medio del número
  - Se añadan caracteres al principio o en medio del número

### Funcionalidades

- Comparativa de diferentes hipotecas en paralelo
- Opción para descargar tabla de amortización completa en PDF
- Calculadora de gastos asociados a la hipoteca (notaría, registro, etc.)
- Gráficos visuales de evolución de la deuda e intereses
- Soporte para simular carencias parciales o totales

### Técnicas

- Mejora del rendimiento y optimización de cálculos
- Añadir tests unitarios y e2e
- Soporte para PWA (Progressive Web App)
- Internacionalización para otros países/idiomas

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Deployed Version

The application is deployed and available online:

- Frontend: [https://mortgage-simulate.netlify.app/](https://mortgage-simulate.netlify.app/)
- Backend (Euribor API): [https://mortgage-calculator-bxqz.onrender.com](https://mortgage-calculator-bxqz.onrender.com)
