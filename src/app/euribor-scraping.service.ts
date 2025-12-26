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
  private apiUrl = 'https://mortgage-calculator-bxqz.onrender.com';

  constructor(private http: HttpClient) {}

  getEuriborData(): Observable<EuriborData> {
    return this.http
      .get<EuriborData>(this.apiUrl)
      .pipe(retry(1), catchError(this.handleError));
  }

  private handleError(error: any) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }

    console.error('Error en el servicio de scraping de Euríbor:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
