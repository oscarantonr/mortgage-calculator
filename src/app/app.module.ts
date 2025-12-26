import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { MortgageCalculatorComponent } from './mortgage-calculator/mortgage-calculator.component';
import { MortgageChartComponent } from './mortgage-chart/mortgage-chart.component';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    MortgageCalculatorComponent,
    MortgageChartComponent,
  ],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule, SharedModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
