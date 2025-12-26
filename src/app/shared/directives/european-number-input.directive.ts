import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appEuropeanNumberInput]',
})
export class EuropeanNumberInputDirective {
  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;

    const cursorPos = input.selectionStart || 0;
    const originalValue = input.value;

    let numericValue = originalValue.replace(/[^\d.,]/g, '');

    const strippedValue = numericValue.replace(/\./g, '');

    const valueBeforeCursor = originalValue.substring(0, cursorPos);
    const digitsBeforeCursor = valueBeforeCursor.replace(/\./g, '').length;

    const normalizedValue = strippedValue.replace(',', '.');
    const numValue = normalizedValue ? parseFloat(normalizedValue) : null;

    if (numValue !== null && !isNaN(numValue)) {
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
    }
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
