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
      const formattedValue = new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);

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
      const formattedValue = new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

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
}
