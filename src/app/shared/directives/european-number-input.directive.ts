import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directiva para formatear números en formato europeo en inputs
 * Muestra puntos como separadores de miles y permite sólo números
 */
@Directive({
  selector: '[appEuropeanNumberInput]',
})
export class EuropeanNumberInputDirective {
  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    // Obtener el input element
    const input = this.el.nativeElement as HTMLInputElement;

    // Guardar la posición actual del cursor y el valor actual
    const cursorPos = input.selectionStart || 0;
    const originalValue = input.value;

    // Eliminar todos los caracteres no numéricos excepto punto y coma
    let numericValue = originalValue.replace(/[^\d.,]/g, '');

    // Eliminar todos los separadores de miles (puntos) para trabajar con el número puro
    // pero conservando las comas decimales
    const strippedValue = numericValue.replace(/\./g, '');

    // Contar cuántos dígitos (sin separadores) hay antes de la posición del cursor
    const valueBeforeCursor = originalValue.substring(0, cursorPos);
    const digitsBeforeCursor = valueBeforeCursor.replace(/\./g, '').length;

    // Convertir a número para el modelo (normalizado con punto decimal)
    const normalizedValue = strippedValue.replace(',', '.');
    const numValue = normalizedValue ? parseFloat(normalizedValue) : null;

    if (numValue !== null && !isNaN(numValue)) {
      // Actualizar el valor del control
      this.control.control?.setValue(numValue, { emitEvent: false });

      // Formatear el valor para mostrar con separadores de miles
      const formattedValue = this.formatWithThousandSeparator(numValue);

      // Establecer el valor formateado en el input
      input.value = formattedValue;

      // Calcular nueva posición del cursor
      let newCursorPos = 0;
      let digitCount = 0;

      // Recorrer el nuevo valor formateado hasta encontrar la misma cantidad de dígitos
      for (let i = 0; i <= formattedValue.length; i++) {
        if (i === formattedValue.length || formattedValue[i] !== '.') {
          if (digitCount === digitsBeforeCursor) {
            newCursorPos = i;
            break;
          }
          if (i < formattedValue.length) digitCount++;
        }
      }

      // Posicionar el cursor
      setTimeout(() => {
        input.setSelectionRange(newCursorPos, newCursorPos);
      });
    }
  }

  @HostListener('blur')
  onBlur() {
    const value = this.control.value;
    if (value !== null && value !== undefined) {
      // Al perder el foco, asegurarse de que el formato es correcto
      const formattedValue = this.formatWithThousandSeparator(value);
      this.el.nativeElement.value = formattedValue;

      // No es necesario posicionar el cursor aquí porque el elemento ya no tiene el foco
    }
  }

  @HostListener('focus')
  onFocus() {
    // Si queremos mostrar el valor sin formato al enfocar
    // const value = this.control.value;
    // if (value !== null && value !== undefined) {
    //   this.el.nativeElement.value = value;
    // }
  }

  /**
   * Formatea un número con separadores de millar (punto)
   * Asegura que se muestren para números de 4 o más dígitos
   */
  private formatWithThousandSeparator(value: number): string {
    const valueString = value.toString();
    const parts = valueString.split('.');
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
