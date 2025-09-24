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

    // Formatear manualmente para garantizar separadores en números de 4 o más dígitos
    return this.formatWithThousandSeparator(numValue, decimals);
  }

  /**
   * Formatea un número con separadores de millar (punto) y separador decimal (coma)
   * Asegura que se muestren para números de 4 o más dígitos
   */
  private formatWithThousandSeparator(value: number, decimals: number): string {
    // Formateamos a string con la cantidad correcta de decimales
    const fixed = value.toFixed(decimals);
    const parts = fixed.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? ',' + parts[1] : '';

    // Aplicamos separadores de millar (punto) manualmente
    let formattedInteger = '';
    for (let i = 0; i < integerPart.length; i++) {
      // Agregamos un punto cada tres dígitos empezando desde el final
      if (i > 0 && (integerPart.length - i) % 3 === 0) {
        formattedInteger += '.';
      }
      formattedInteger += integerPart.charAt(i);
    }

    return formattedInteger + decimalPart;
  }
}
