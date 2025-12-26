import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface AmortizationChartData {
  month: number;
  year: number;
  remainingBalance: number;
  monthlyInterest: number;
  monthlyPrincipal: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  monthlyPayment: number;
}

@Component({
  selector: 'app-mortgage-chart',
  template: `
    <div class="chart-container" *ngIf="amortizationData.length > 0">
      <h3 class="chart-title">Análisis Visual de tu Hipoteca</h3>

      <div class="chart-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'balance'"
          (click)="switchTab('balance')"
        >
          Saldo Pendiente
        </button>

        <button
          class="tab-btn"
          [class.active]="activeTab === 'cumulative'"
          (click)="switchTab('cumulative')"
        >
          Intereses Acumulados
        </button>
        <button
          *ngIf="earlyRepaymentData && earlyRepaymentData.length > 0"
          class="tab-btn"
          [class.active]="activeTab === 'comparison'"
          (click)="switchTab('comparison')"
        >
          Comparativa
        </button>
      </div>

      <div class="chart-wrapper">
        <canvas #chartCanvas></canvas>
      </div>

      <div class="chart-info" *ngIf="activeTab === 'balance'">
        <p>
          <i class="info-icon">ℹ️</i> Este gráfico muestra cómo disminuye el
          saldo pendiente de tu hipoteca a lo largo del tiempo.
        </p>
      </div>

      <div class="chart-info" *ngIf="activeTab === 'cumulative'">
        <p>
          <i class="info-icon">ℹ️</i> Muestra el total de intereses pagados
          acumulados mes a mes.
        </p>
      </div>
      <div class="chart-info" *ngIf="activeTab === 'comparison'">
        <p>
          <i class="info-icon">ℹ️</i> Compara tu hipoteca con y sin amortización
          anticipada.
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./mortgage-chart.component.css'],
})
export class MortgageChartComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  @ViewChild('chartCanvas', { static: false })
  chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() amortizationData: AmortizationChartData[] = [];
  @Input() earlyRepaymentData?: AmortizationChartData[];
  @Input() monthlyPayment: number = 0;

  activeTab = 'balance';
  chart: Chart | null = null;

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['amortizationData'] || changes['earlyRepaymentData']) {
      if (this.chart && this.amortizationData.length > 0) {
        setTimeout(() => {
          this.updateChart();
        }, 50);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.amortizationData.length > 0) {
      setTimeout(() => {
        this.createChart();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.updateChart();
  }

  private createChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, this.getChartConfig());
  }

  private updateChart(): void {
    if (!this.chart) {
      this.createChart();
      return;
    }

    const config = this.getChartConfig();
    this.chart.data = config.data;
    this.chart.options = config.options;
    this.chart.update();
  }

  private getChartConfig(): any {
    switch (this.activeTab) {
      case 'balance':
        return this.getBalanceChartConfig();
      case 'cumulative':
        return this.getCumulativeChartConfig();
      case 'comparison':
        return this.getComparisonChartConfig();
      default:
        return this.getBalanceChartConfig();
    }
  }

  private getBalanceChartConfig(): any {
    const labels = this.amortizationData.map(
      (item) => `Año ${Math.ceil(item.month / 12)}`
    );
    const data = this.amortizationData.map((item) => item.remainingBalance);

    return {
      type: 'line',
      data: {
        labels: this.getYearlyLabels(),
        datasets: [
          {
            label: 'Saldo Pendiente (€)',
            data: this.getYearlyData('remainingBalance'),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          tooltip: {
            callbacks: {
              label: (context: any) =>
                `Saldo: ${this.formatCurrency(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tiempo',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Saldo Pendiente (€)',
            },
            ticks: {
              callback: (value: any) => this.formatCurrency(value),
            },
          },
        },
      },
    };
  }

  private getPaymentsChartConfig(): any {
    return {
      type: 'bar',
      data: {
        labels: this.getYearlyLabels(),
        datasets: [
          {
            label: 'Capital (€)',
            data: this.getYearlyData('monthlyPrincipal'),
            backgroundColor: '#16a34a',
            borderColor: '#15803d',
            borderWidth: 1,
          },
          {
            label: 'Intereses (€)',
            data: this.getYearlyData('monthlyInterest'),
            backgroundColor: '#dc2626',
            borderColor: '#b91c1c',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          tooltip: {
            callbacks: {
              label: (context: any) =>
                `${context.dataset.label}: ${this.formatCurrency(
                  context.parsed.y
                )}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tiempo',
            },
            stacked: true,
          },
          y: {
            title: {
              display: true,
              text: 'Pago Mensual (€)',
            },
            stacked: true,
            ticks: {
              callback: (value: any) => this.formatCurrency(value),
            },
          },
        },
      },
    };
  }

  private getCumulativeChartConfig(): any {
    return {
      type: 'line',
      data: {
        labels: this.getYearlyLabels(),
        datasets: [
          {
            label: 'Intereses Acumulados (€)',
            data: this.getYearlyData('cumulativeInterest'),
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Capital Amortizado (€)',
            data: this.getYearlyData('cumulativePrincipal'),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          tooltip: {
            callbacks: {
              label: (context: any) =>
                `${context.dataset.label}: ${this.formatCurrency(
                  context.parsed.y
                )}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tiempo',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad Acumulada (€)',
            },
            ticks: {
              callback: (value: any) => this.formatCurrency(value),
            },
          },
        },
      },
    };
  }

  private getComparisonChartConfig(): any {
    if (!this.earlyRepaymentData || this.earlyRepaymentData.length === 0) {
      return this.getBalanceChartConfig();
    }

    return {
      type: 'line',
      data: {
        labels: this.getYearlyLabels(),
        datasets: [
          {
            label: 'Sin Amortización Anticipada (€)',
            data: this.getYearlyData('remainingBalance'),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 3,
            tension: 0.4,
          },
          {
            label: 'Con Amortización Anticipada (€)',
            data: this.getYearlyDataFromEarlyRepayment('remainingBalance'),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            borderWidth: 3,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          tooltip: {
            callbacks: {
              label: (context: any) =>
                `${context.dataset.label}: ${this.formatCurrency(
                  context.parsed.y
                )}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Tiempo',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Saldo Pendiente (€)',
            },
            ticks: {
              callback: (value: any) => this.formatCurrency(value),
            },
          },
        },
      },
    };
  }

  private getYearlyLabels(): string[] {
    const totalMonths = this.amortizationData.length;
    const currentYear = new Date().getFullYear();

    const yearsOfLoan = Math.ceil(totalMonths / 12);
    const startYear = currentYear + 1;

    return Array.from({ length: yearsOfLoan }, (_, i) => `${startYear + i}`);
  }

  private getYearlyData(property: keyof AmortizationChartData): number[] {
    const yearlyData: number[] = [];
    const totalMonths = this.amortizationData.length;
    const yearsOfLoan = Math.ceil(totalMonths / 12);

    for (let year = 0; year < yearsOfLoan; year++) {
      const startMonth = year * 12;
      const endMonth = Math.min(startMonth + 12, totalMonths);
      const yearData = this.amortizationData.slice(startMonth, endMonth);

      if (yearData.length === 0) {
        yearlyData.push(0);
        continue;
      }
      if (property === 'remainingBalance') {
        yearlyData.push(yearData[yearData.length - 1]?.[property] || 0);
      } else if (
        property === 'cumulativeInterest' ||
        property === 'cumulativePrincipal'
      ) {
        yearlyData.push(yearData[yearData.length - 1]?.[property] || 0);
      } else {
        yearlyData.push(yearData[yearData.length - 1]?.[property] || 0);
      }
    }
    return yearlyData;
  }

  private getYearlyDataFromEarlyRepayment(
    property: keyof AmortizationChartData
  ): number[] {
    if (!this.earlyRepaymentData) return [];

    const yearlyData: number[] = [];
    const totalMonths = this.earlyRepaymentData.length;
    const yearsOfLoan = Math.ceil(totalMonths / 12);

    for (let year = 0; year < yearsOfLoan; year++) {
      const startMonth = year * 12;
      const endMonth = Math.min(startMonth + 12, totalMonths);
      const yearData = this.earlyRepaymentData.slice(startMonth, endMonth);

      if (yearData.length === 0) {
        yearlyData.push(0);
        continue;
      }
      if (property === 'remainingBalance') {
        yearlyData.push(yearData[yearData.length - 1]?.[property] || 0);
      } else if (
        property === 'cumulativeInterest' ||
        property === 'cumulativePrincipal'
      ) {
        yearlyData.push(yearData[yearData.length - 1]?.[property] || 0);
      } else {
        yearlyData.push(yearData[yearData.length - 1]?.[property] || 0);
      }
    }
    return yearlyData;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
