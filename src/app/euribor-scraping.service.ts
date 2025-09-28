import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, retry, throwError } from 'rxjs';

export interface EuriborData {
  value: number;
  date: string;
  rawValue: string;
}

@Injectable({
  providedIn: 'root',
})
export class EuriborScrapingService {
  // URL para desarrollo local
  private apiUrl = 'https://mortgage-calculator-bxqz.onrender.com';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el valor actual del Euríbor mediante scraping
   * @returns Observable con los datos del Euríbor
   */
  getEuriborData(): Observable<EuriborData> {
    return this.http
      .get<EuriborData>(this.apiUrl)
      .pipe(retry(1), catchError(this.handleError));
  }

  /**
   * Maneja los errores de las peticiones HTTP
   */
  private handleError(error: any) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }

    console.error('Error en el servicio de scraping de Euríbor:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
