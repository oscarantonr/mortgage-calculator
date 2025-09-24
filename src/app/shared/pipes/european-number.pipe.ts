import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatear números en formato europeo
 * Utiliza punto como separador de miles y coma como separador decimal
 * Ejemplo: 1234.56 -> 1.234,56
 */
@Pipe({
  name: 'europeanNumber',
})
export class EuropeanNumberPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    decimals: number = 2
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Convertir a número si es string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // Evitar NaN
    if (isNaN(numValue)) {
      return '';
    }

    // Formatear con Intl usando locale 'es-ES' para formato europeo
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  }
}
