import { Component, OnInit } from '@angular/core';
import {
  EuriborData,
  EuriborScrapingService,
} from './euribor-scraping.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  euriborScraping: EuriborData | null = null;
  loadingScrapingData = true;
  scrapingError: string | null = null;
  currentYear = new Date().getFullYear();

  // Obtener valor numérico del Euríbor para el calculador
  get euriborValue(): number | null {
    if (!this.euriborScraping?.value) return null;
    return this.euriborScraping.value;
  }

  constructor(private euriborScrapingService: EuriborScrapingService) {}

  ngOnInit() {
    // Cargar datos desde el scraping
    this.loadScrapingData();
  }

  /**
   * Carga los datos del Euríbor a través del servicio de scraping
   */
  loadScrapingData() {
    this.loadingScrapingData = true;
    this.scrapingError = null;

    this.euriborScrapingService.getEuriborData().subscribe({
      next: (data) => {
        this.euriborScraping = data;
        this.loadingScrapingData = false;
      },
      error: (err) => {
        console.error('Error obteniendo Euríbor desde scraping:', err);
        this.scrapingError =
          'Error al cargar los datos. Asegúrate de que el servidor de scraping esté en ejecución.';
        this.loadingScrapingData = false;
      },
    });
  }
}
