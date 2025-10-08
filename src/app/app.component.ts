import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  EuriborData,
  EuriborScrapingService,
} from './euribor-scraping.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  euriborScraping: EuriborData | null = null;
  loadingScrapingData = true;
  scrapingError: string | null = null;
  currentYear = new Date().getFullYear();

  // Propiedades para los mensajes rotativos
  currentLoadingMessage = '';
  private loadingMessageIndex = 0;
  private loadingInterval: any = null;

  // Array de mensajes de carga
  private loadingMessages = [
    'Cargando datos del Euríbor...',
    'Conectando con iAhorro...',
    'Obteniendo valor actualizado...',
    'Procesando información...',
    'Verificando datos...',
    'Casi listo...',
  ];

  // Obtener valor numérico del Euríbor para el calculador
  get euriborValue(): number | null {
    if (!this.euriborScraping?.value) return null;
    return this.euriborScraping.value;
  }

  constructor(private euriborScrapingService: EuriborScrapingService) {
    this.currentLoadingMessage = this.loadingMessages[0];
  }

  ngOnInit() {
    // Cargar datos desde el scraping
    this.loadScrapingData();
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando se destruye el componente
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }
  }

  /**
   * Carga los datos del Euríbor a través del servicio de scraping
   */
  loadScrapingData() {
    this.loadingScrapingData = true;
    this.scrapingError = null;
    this.loadingMessageIndex = 0;
    this.currentLoadingMessage = this.loadingMessages[0];

    // Iniciar la rotación de mensajes cada 2 segundos
    this.startLoadingMessageRotation();

    this.euriborScrapingService.getEuriborData().subscribe({
      next: (data) => {
        this.euriborScraping = data;
        this.loadingScrapingData = false;
        this.stopLoadingMessageRotation();
      },
      error: (err) => {
        console.error('Error obteniendo Euríbor desde scraping:', err);
        this.scrapingError =
          'Error al cargar los datos. Asegúrate de que el servidor de scraping esté en ejecución.';
        this.loadingScrapingData = false;
        this.stopLoadingMessageRotation();
      },
    });
  }

  private startLoadingMessageRotation() {
    this.loadingInterval = setInterval(() => {
      this.loadingMessageIndex =
        (this.loadingMessageIndex + 1) % this.loadingMessages.length;
      this.currentLoadingMessage =
        this.loadingMessages[this.loadingMessageIndex];
    }, 2000); // Cambiar mensaje cada 2 segundos
  }

  private stopLoadingMessageRotation() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
  }
}
