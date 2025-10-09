import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-mortgage-calculator',
  templateUrl: './mortgage-calculator.component.html',
  styleUrls: ['./mortgage-calculator.component.css'],
})
export class MortgageCalculatorComponent implements OnInit {
  @Input() currentEuribor: number | null = null;

  mortgageForm: FormGroup;
  showResults = false;
  monthlyPayment = 0;
  totalInterest = 0;
  totalAmount = 0;
  amortizationSchedule: any[] = [];

  // Variable para el input de fecha formateado
  displayDate = '';

  // Variable para controlar cuándo mostrar resultados de amortización anticipada
  showEarlyRepaymentResults = false;

  // Variables para los resultados de amortización anticipada
  earlyRepaymentResults = {
    reducingTerm: {
      savings: 0,
      savingsPercentage: 0, // Nuevo campo para porcentaje de ahorro
      monthlyPayment: 0,
      originalTerm: { years: 0, months: 0 },
      termReduction: { years: 0, months: 0 },
      newTerm: { years: 0, months: 0 },
    },
    reducingPayment: {
      savings: 0,
      savingsPercentage: 0, // Nuevo campo para porcentaje de ahorro
      term: { years: 0, months: 0 },
      originalPayment: 0,
      paymentReduction: 0,
      newPayment: 0,
    },
  };

  interestTypes = [
    { value: 'fixed', label: 'Fijo' },
    { value: 'variable', label: 'Variable (Euríbor + Diferencial)' },
  ];

  termTypes = [
    { value: 'years', label: 'Años' },
    { value: 'months', label: 'Meses' },
    { value: 'endDate', label: 'Fecha fin' },
  ];

  constructor(private fb: FormBuilder) {
    this.mortgageForm = this.fb.group({
      loanAmount: ['150.000', [Validators.required, Validators.min(1)]],
      earlyRepayment: [''], // Nuevo campo para amortización anticipada (opcional)
      interestType: ['fixed', Validators.required],
      interestRate: ['3', [Validators.required, Validators.min(0.1)]],
      differential: ['1', [Validators.required, Validators.min(0.1)]],
      term: [
        '30',
        [Validators.required, Validators.min(1), Validators.max(480)],
      ],
      termType: ['years', Validators.required],
      endDate: [''], // Nuevo campo para fecha de finalización
      paymentFrequency: ['monthly', Validators.required],
    });
  }

  /**
   * Formatea años sin decimales innecesarios
   * Ejemplo: 13.0 años -> "13", 13.5 años -> "13.5"
   */

  /**
   * Formatea el plazo completo con años y meses
   * Ejemplo: 156 meses -> "13 años", 162 meses -> "13 años y 6 meses"
   */
  formatLoanTerm(totalMonths: number): string {
    const wholeYears = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    if (remainingMonths === 0) {
      // Solo años completos: "13 años"
      return `${wholeYears} año${wholeYears !== 1 ? 's' : ''}`;
    } else if (wholeYears === 0) {
      // Solo meses: "6 meses"
      return `${remainingMonths} mes${remainingMonths !== 1 ? 'es' : ''}`;
    } else {
      // Años y meses: "13 años y 6 meses"
      return `${wholeYears} año${
        wholeYears !== 1 ? 's' : ''
      } y ${remainingMonths} mes${remainingMonths !== 1 ? 'es' : ''}`;
    }
  }

  /**
   * Calcula el plazo desde una fecha de finalización
   */
  calculateTermFromEndDate(endDate: string): {
    years: number;
    months: number;
    totalMonths: number;
  } {
    const today = new Date();
    const end = new Date(endDate);

    // Calcular diferencia en meses
    let months = (end.getFullYear() - today.getFullYear()) * 12;
    months += end.getMonth() - today.getMonth();

    // Ajustar por días si es necesario
    if (end.getDate() < today.getDate()) {
      months--;
    }

    // Asegurar que no sea negativo
    months = Math.max(0, months);

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return {
      years,
      months: remainingMonths,
      totalMonths: months,
    };
  }

  /**
   * Obtiene el plazo calculado desde la fecha de finalización formateado
   */
  getCalculatedTermFromDate(): string {
    const endDate = this.mortgageForm.get('endDate')?.value;
    if (!endDate) return '';

    const calc = this.calculateTermFromEndDate(endDate);
    return this.formatLoanTerm(calc.totalMonths);
  }

  /**
   * Obtiene solo el número de meses calculado desde la fecha de finalización
   */
  getCalculatedMonthsFromDate(): number {
    const endDate = this.mortgageForm.get('endDate')?.value;
    if (!endDate) return 0;

    const calc = this.calculateTermFromEndDate(endDate);
    return calc.totalMonths;
  }

  /**
   * Formatea la fecha del formulario al formato dd/mm/yyyy
   */
  getFormattedDate(): string {
    const endDate = this.mortgageForm.get('endDate')?.value;
    if (!endDate) return '';

    const date = new Date(endDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /**
   * Maneja el cambio de fecha del datepicker nativo
   */
  onDatePickerChange(event: any): void {
    const dateValue = event.target.value;
    this.mortgageForm.patchValue({ endDate: dateValue });

    // Actualizar el display con formato dd/mm/yyyy
    if (dateValue) {
      const date = new Date(dateValue);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      this.displayDate = `${day}/${month}/${year}`;
    } else {
      this.displayDate = '';
    }
  }

  /**
   * Maneja la entrada manual de fecha en formato dd/mm/yyyy
   */
  onManualDateInput(event: any): void {
    const value = event.target.value;
    // Permitir solo números y barras
    const cleaned = value.replace(/[^\d/]/g, '');

    // Formatear automáticamente mientras escribe
    let formatted = cleaned;
    if (cleaned.length >= 2 && cleaned.charAt(2) !== '/') {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length >= 5 && cleaned.charAt(5) !== '/') {
      formatted = formatted.substring(0, 5) + '/' + formatted.substring(5);
    }

    // Limitar a 10 caracteres (dd/mm/yyyy)
    if (formatted.length > 10) {
      formatted = formatted.substring(0, 10);
    }

    event.target.value = formatted;
  }

  /**
   * Valida y convierte la fecha manual cuando el usuario termina de editarla
   */
  onDateBlur(event: any): void {
    const value = event.target.value;
    if (!value) {
      this.mortgageForm.patchValue({ endDate: '' });
      this.displayDate = '';
      return;
    }

    // Validar formato dd/mm/yyyy
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = value.match(dateRegex);

    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);

      // Validar rangos
      if (
        day >= 1 &&
        day <= 31 &&
        month >= 1 &&
        month <= 12 &&
        year >= 2000 &&
        year <= 2100
      ) {
        // Convertir a formato ISO para el formulario
        const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day
          .toString()
          .padStart(2, '0')}`;
        this.mortgageForm.patchValue({ endDate: isoDate });

        // Actualizar el display con formato correcto
        this.displayDate = `${day.toString().padStart(2, '0')}/${month
          .toString()
          .padStart(2, '0')}/${year}`;

        // Actualizar también el input oculto
        const hiddenInput = document.querySelector(
          '.date-input-hidden'
        ) as HTMLInputElement;
        if (hiddenInput) {
          hiddenInput.value = isoDate;
        }
      } else {
        // Fecha inválida, limpiar
        this.displayDate = '';
        this.mortgageForm.patchValue({ endDate: '' });
      }
    } else {
      // Formato inválido, limpiar
      this.displayDate = '';
      this.mortgageForm.patchValue({ endDate: '' });
    }
  }

  /**
   * Abre el datepicker haciendo click en el input oculto
   */
  openDatePicker(): void {
    const dateInput = document.querySelector(
      '.date-input-hidden'
    ) as HTMLInputElement;
    if (dateInput) {
      // Primero intentar showPicker si está disponible (navegadores modernos)
      if (
        'showPicker' in dateInput &&
        typeof (dateInput as any).showPicker === 'function'
      ) {
        try {
          (dateInput as any).showPicker();
        } catch (error) {
          // Si falla, usar el método alternativo
          dateInput.focus();
          dateInput.click();
        }
      } else {
        // Método alternativo para navegadores que no soportan showPicker
        dateInput.focus();
        dateInput.click();
      }
    }
  }

  ngOnInit(): void {
    // Si cambia el tipo de interés, actualizamos campos relacionados
    this.mortgageForm.get('interestType')?.valueChanges.subscribe((type) => {
      if (type === 'variable' && this.currentEuribor) {
        const differential = parseFloat(
          this.mortgageForm.get('differential')?.value || '1'
        );
        const totalRate = this.currentEuribor + differential;
        this.mortgageForm.get('interestRate')?.setValue(totalRate.toFixed(2));
      }
    });

    // También actualizamos cuando cambia el diferencial en modo variable
    this.mortgageForm.get('differential')?.valueChanges.subscribe((diff) => {
      if (
        this.mortgageForm.get('interestType')?.value === 'variable' &&
        this.currentEuribor
      ) {
        const diffValue = parseFloat(diff || '1');
        const totalRate = this.currentEuribor + diffValue;
        this.mortgageForm.get('interestRate')?.setValue(totalRate.toFixed(2));
      }
    });

    // Si tenemos el Euribor, actualizar el valor inicial
    if (
      this.currentEuribor &&
      this.mortgageForm.get('interestType')?.value === 'variable'
    ) {
      const differential = parseFloat(
        this.mortgageForm.get('differential')?.value || '1'
      );
      const totalRate = this.currentEuribor + differential;
      this.mortgageForm.get('interestRate')?.setValue(totalRate.toFixed(2));
    }

    // Sincronizar displayDate cuando cambie la fecha en el formulario
    this.mortgageForm.get('endDate')?.valueChanges.subscribe((dateValue) => {
      if (dateValue) {
        const date = new Date(dateValue);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        this.displayDate = `${day}/${month}/${year}`;
      } else {
        this.displayDate = '';
      }
    });

    // Cambiar validadores según el tipo de plazo
    this.mortgageForm.get('termType')?.valueChanges.subscribe((termType) => {
      const termControl = this.mortgageForm.get('term');
      const endDateControl = this.mortgageForm.get('endDate');

      if (termControl && endDateControl) {
        const currentValue = termControl.value;

        // Resetear validadores
        termControl.clearValidators();
        endDateControl.clearValidators();

        if (termType === 'endDate') {
          // Para fecha de finalización: solo la fecha es requerida
          endDateControl.setValidators([Validators.required]);
          termControl.setValidators([]); // No requerido
        } else {
          // Para años/meses: el término es requerido, fecha no
          endDateControl.setValidators([]); // No requerido

          if (termType === 'years') {
            // Para años: de 1 a 40 años
            termControl.setValidators([
              Validators.required,
              Validators.min(1),
              Validators.max(40),
            ]);

            // Si estaba en meses y el valor es > 40, lo ajustamos a 40 años
            if (currentValue > 40) {
              termControl.setValue(40);
            }
          } else {
            // Para meses: de 1 a 480 meses (40 años * 12)
            termControl.setValidators([
              Validators.required,
              Validators.min(1),
              Validators.max(480),
            ]);

            // Si estaba en años, lo convertimos a meses
            if (
              this.mortgageForm.get('termType')?.value !== termType &&
              currentValue <= 40
            ) {
              termControl.setValue(currentValue * 12);
            }
          }
        }

        termControl.updateValueAndValidity();
        endDateControl.updateValueAndValidity();
      }
    });
  }

  calculateMortgage() {
    if (this.mortgageForm.valid) {
      // Reiniciar resultados de amortización anticipada antes de calcular
      this.showEarlyRepaymentResults = false;
      this.earlyRepaymentResults = {
        reducingTerm: {
          savings: 0,
          savingsPercentage: 0,
          monthlyPayment: 0,
          originalTerm: { years: 0, months: 0 },
          termReduction: { years: 0, months: 0 },
          newTerm: { years: 0, months: 0 },
        },
        reducingPayment: {
          savings: 0,
          savingsPercentage: 0,
          term: { years: 0, months: 0 },
          originalPayment: 0,
          paymentReduction: 0,
          newPayment: 0,
        },
      };

      const formValue = this.mortgageForm.getRawValue();
      const data = {
        ...formValue,
        loanAmount: parseFloat(
          formValue.loanAmount?.toString().replace(/\./g, '').replace(',', '.')
        ),
        earlyRepayment: formValue.earlyRepayment
          ? parseFloat(
              formValue.earlyRepayment
                .toString()
                .replace(/\./g, '')
                .replace(',', '.')
            )
          : 0,
        interestRate: parseFloat(
          formValue.interestRate?.toString().replace(',', '.')
        ),
        differential: parseFloat(
          formValue.differential?.toString().replace(',', '.')
        ),
        term: parseFloat(
          formValue.term?.toString().replace(/\./g, '').replace(',', '.')
        ),
      };

      const principal = data.loanAmount;
      const interestRate = data.interestRate / 100 / 12; // Tasa mensual

      // Calcular número total de pagos según el tipo de plazo
      let payments: number;
      if (data.termType === 'endDate') {
        // Calcular plazo desde fecha de finalización
        const endDateCalc = this.calculateTermFromEndDate(data.endDate);
        payments = endDateCalc.totalMonths;
      } else if (data.termType === 'years') {
        payments = data.term * 12; // Convertir años a meses
      } else {
        payments = data.term; // Ya está en meses
      }

      // Calcular cuota mensual: P = principal * r * (1+r)^n / ((1+r)^n - 1)
      this.monthlyPayment =
        (principal * interestRate * Math.pow(1 + interestRate, payments)) /
        (Math.pow(1 + interestRate, payments) - 1);

      // Calcular amortización
      this.calculateAmortizationSchedule(principal, interestRate, payments);

      this.totalAmount = this.monthlyPayment * payments;
      this.totalInterest = this.totalAmount - principal;

      // Calcular opciones de amortización anticipada si hay un valor
      if (data.earlyRepayment > 0) {
        this.calculateEarlyRepaymentOptions(
          data.earlyRepayment,
          principal,
          interestRate,
          payments
        );
        // Activar la visualización de resultados de amortización anticipada
        this.showEarlyRepaymentResults = true;
      }

      this.showResults = true;
    }
  }

  calculateAmortizationSchedule(
    principal: number,
    monthlyRate: number,
    totalPayments: number
  ) {
    let balance = principal;
    let totalInterest = 0;
    this.amortizationSchedule = [];

    for (let month = 1; month <= Math.min(totalPayments, 360); month++) {
      // Calcular interés para este mes
      const monthlyInterest = balance * monthlyRate;
      // Parte de la cuota que va a principal
      const principalPayment = this.monthlyPayment - monthlyInterest;
      // Actualizar saldo restante
      balance -= principalPayment;
      // Acumular interés pagado
      totalInterest += monthlyInterest;

      // Solo guardamos 1 año de amortización (12 meses) para no sobrecargar la UI
      if (month <= 12) {
        this.amortizationSchedule.push({
          month,
          payment: this.monthlyPayment,
          principalPayment,
          interest: monthlyInterest,
          totalInterest,
          balance: Math.max(0, balance),
        });
      }
    }
  }

  /**
   * Calcula las dos opciones de amortización anticipada usando tabla de amortización completa:
   * 1. Reducción de plazo (misma cuota, menos tiempo)
   * 2. Reducción de cuota (mismo plazo, menor cuota mensual)
   *
   * Ejemplo práctico:
   * - Hipoteca de 200.000€ a 30 años al 3% de interés
   * - Amortización anticipada de 10.000€ tras 12 meses
   * - Ahorro reduciendo plazo: ~17.856€ (6,20% del total de intereses)
   * - Ahorro reduciendo cuota: ~15.432€ (5,36% del total de intereses)
   */
  calculateEarlyRepaymentOptions(
    earlyRepayment: number,
    principal: number,
    monthlyRate: number,
    totalPayments: number
  ) {
    // 1. Calcular cuota mensual original
    const monthlyPayment = this.monthlyPayment;

    // 2. Generar tabla de amortización original (sin amortización anticipada)
    const originalTable = this.generateAmortizationTable(
      principal,
      monthlyRate,
      totalPayments,
      monthlyPayment
    );
    const originalInterestTotal = originalTable.totalInterest;

    // 3. Determinar el momento de amortización (asumimos después de 12 meses)
    const amortizationPoint = 12;
    const remainingPrincipal =
      originalTable.schedule[amortizationPoint - 1].remainingPrincipal;

    // 4. Nuevo capital tras amortización anticipada
    const newPrincipal = remainingPrincipal - earlyRepayment;

    // 5. Escenario A: Reducción de cuota (mismo plazo)
    const remainingMonths = totalPayments - amortizationPoint;
    const newMonthlyPayment = this.calculateMonthlyPayment(
      newPrincipal,
      monthlyRate,
      remainingMonths
    );
    const reducingPaymentTable = this.generateAmortizationTable(
      newPrincipal,
      monthlyRate,
      remainingMonths,
      newMonthlyPayment
    );

    // 6. Escenario B: Reducción de plazo (misma cuota)
    const newTotalPayments = this.calculateNewTerm(
      newPrincipal,
      monthlyRate,
      monthlyPayment
    );
    const reducingTermTable = this.generateAmortizationTable(
      newPrincipal,
      monthlyRate,
      newTotalPayments,
      monthlyPayment
    );

    // 7. Calcular intereses pagados en los primeros meses (antes de amortización)
    const interestPaidBefore = originalTable.schedule
      .slice(0, amortizationPoint)
      .reduce((sum, month) => sum + month.interest, 0);

    // 8. Calcular ahorro en intereses
    const totalInterestReducingPayment =
      interestPaidBefore + reducingPaymentTable.totalInterest;
    const totalInterestReducingTerm =
      interestPaidBefore + reducingTermTable.totalInterest;

    // 9. Ahorro en cada escenario
    const savingsReducingPayment =
      originalInterestTotal - totalInterestReducingPayment;
    const savingsReducingTerm =
      originalInterestTotal - totalInterestReducingTerm;

    // 10. Calcular plazos para mostrar
    const paymentReduction =
      totalPayments - (amortizationPoint + newTotalPayments);
    const yearsReduction = Math.floor(paymentReduction / 12);
    const monthsReduction = paymentReduction % 12;

    const originalYears = Math.floor(totalPayments / 12);
    const originalMonths = totalPayments % 12;

    const newYears = Math.floor((amortizationPoint + newTotalPayments) / 12);
    const newMonths = (amortizationPoint + newTotalPayments) % 12;

    // 11. Reducción mensual de la cuota
    const paymentDifference = monthlyPayment - newMonthlyPayment;

    // 12. Calcular porcentajes de ahorro
    const savingsPercentageReducingTerm =
      originalInterestTotal > 0
        ? (savingsReducingTerm / originalInterestTotal) * 100
        : 0;
    const savingsPercentageReducingPayment =
      originalInterestTotal > 0
        ? (savingsReducingPayment / originalInterestTotal) * 100
        : 0;

    // 13. Actualizar resultados
    this.earlyRepaymentResults.reducingTerm = {
      savings: savingsReducingTerm,
      savingsPercentage: savingsPercentageReducingTerm,
      monthlyPayment: monthlyPayment,
      originalTerm: { years: originalYears, months: originalMonths },
      termReduction: { years: yearsReduction, months: monthsReduction },
      newTerm: { years: newYears, months: newMonths },
    };

    this.earlyRepaymentResults.reducingPayment = {
      savings: savingsReducingPayment,
      savingsPercentage: savingsPercentageReducingPayment,
      term: { years: originalYears, months: originalMonths },
      originalPayment: monthlyPayment,
      paymentReduction: paymentDifference,
      newPayment: newMonthlyPayment,
    };
  }

  /**
   * Genera la tabla de amortización completa para calcular intereses totales
   */
  private generateAmortizationTable(
    principal: number,
    monthlyRate: number,
    totalPayments: number,
    monthlyPayment: number
  ) {
    let remainingPrincipal = principal;
    let totalInterest = 0;
    const schedule = [];

    for (let month = 1; month <= totalPayments; month++) {
      // Calcular interés del mes
      const interest = remainingPrincipal * monthlyRate;

      // Calcular amortización de capital
      const principalPayment = monthlyPayment - interest;

      // Actualizar capital pendiente
      remainingPrincipal -= principalPayment;

      // Acumular intereses totales
      totalInterest += interest;

      // Guardar registro en la tabla
      schedule.push({
        month,
        payment: monthlyPayment,
        interest,
        principalPayment,
        remainingPrincipal: Math.max(0, remainingPrincipal),
      });

      // Si ya se ha pagado todo el principal, terminar
      if (remainingPrincipal <= 0) {
        break;
      }
    }

    return {
      schedule,
      totalInterest,
    };
  }

  /**
   * Calcula el nuevo plazo con reducción de cuota
   */
  private calculateNewTerm(
    principal: number,
    monthlyRate: number,
    monthlyPayment: number
  ): number {
    // Usando la fórmula logarítmica para calcular el plazo
    return Math.ceil(
      Math.log(monthlyPayment / (monthlyPayment - principal * monthlyRate)) /
        Math.log(1 + monthlyRate)
    );
  }

  /**
   * Calcula cuota mensual
   */
  private calculateMonthlyPayment(
    principal: number,
    monthlyRate: number,
    totalPayments: number
  ): number {
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    );
  }

  resetCalculator() {
    this.mortgageForm.reset({
      loanAmount: '150.000',
      earlyRepayment: '', // Añadimos el campo de amortización anticipada
      interestType: 'fixed',
      interestRate: '3',
      differential: '1',
      term: '30',
      termType: 'years',
      paymentFrequency: 'monthly',
    });
    this.showResults = false;
    this.showEarlyRepaymentResults = false;
    this.amortizationSchedule = [];
    // Reiniciamos los resultados de amortización anticipada
    this.earlyRepaymentResults = {
      reducingTerm: {
        savings: 0,
        savingsPercentage: 0,
        monthlyPayment: 0,
        originalTerm: { years: 0, months: 0 },
        termReduction: { years: 0, months: 0 },
        newTerm: { years: 0, months: 0 },
      },
      reducingPayment: {
        savings: 0,
        savingsPercentage: 0,
        term: { years: 0, months: 0 },
        originalPayment: 0,
        paymentReduction: 0,
        newPayment: 0,
      },
    };
  }
}
