import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EuropeanNumberPipe } from './pipes/european-number.pipe';
import { EuropeanNumberInputDirective } from './directives/european-number-input.directive';

@NgModule({
  declarations: [EuropeanNumberPipe, EuropeanNumberInputDirective],
  imports: [CommonModule],
  exports: [EuropeanNumberPipe, EuropeanNumberInputDirective],
})
export class SharedModule {}
