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

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    // Eliminar todos los caracteres no numéricos excepto punto y coma
    let numericValue = value.replace(/[^\d.,]/g, '');

    // Convertir comas a puntos para cálculos internos (si hubiera)
    const normalizedValue = numericValue.replace(/\./g, '').replace(',', '.');

    // Almacenar el valor numérico real en el formulario
    const numValue = normalizedValue ? parseFloat(normalizedValue) : null;

    if (numValue !== null && !isNaN(numValue)) {
      // Actualizar el valor del control
      this.control.control?.setValue(numValue, { emitEvent: false });

      // Formatear el valor para mostrar con separadores de miles
      // Creamos una función personalizada para garantizar que se muestren los separadores
      // para números de 4 o más dígitos
      const formattedValue = this.formatWithThousandSeparator(numValue);

      // Actualizar el valor mostrado en el input sin disparar eventos
      // para evitar un bucle infinito
      this.el.nativeElement.value = formattedValue;
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
