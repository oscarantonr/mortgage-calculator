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
  results: any = null;
  showResults = false;
  monthlyPayment = 0;
  totalInterest = 0;
  totalAmount = 0;
  amortizationSchedule: any[] = [];

  // Variables para los resultados de amortización anticipada
  earlyRepaymentResults = {
    reducingTerm: {
      savings: 0,
      monthlyPayment: 0,
      originalTerm: { years: 0, months: 0 },
      termReduction: { years: 0, months: 0 },
      newTerm: { years: 0, months: 0 },
    },
    reducingPayment: {
      savings: 0,
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
      paymentFrequency: ['monthly', Validators.required],
    });
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

    // Cambiar validadores según el tipo de plazo
    this.mortgageForm.get('termType')?.valueChanges.subscribe((termType) => {
      const termControl = this.mortgageForm.get('term');
      if (termControl) {
        const currentValue = termControl.value;

        // Resetear validadores
        termControl.clearValidators();

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

        termControl.updateValueAndValidity();
      }
    });
  }

  calculateMortgage() {
    if (this.mortgageForm.valid) {
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

      // Calcular número total de pagos según el tipo de plazo (años o meses)
      let payments: number;
      if (data.termType === 'years') {
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

    // 12. Actualizar resultados
    this.earlyRepaymentResults.reducingTerm = {
      savings: savingsReducingTerm,
      monthlyPayment: monthlyPayment,
      originalTerm: { years: originalYears, months: originalMonths },
      termReduction: { years: yearsReduction, months: monthsReduction },
      newTerm: { years: newYears, months: newMonths },
    };

    this.earlyRepaymentResults.reducingPayment = {
      savings: savingsReducingPayment,
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
    this.amortizationSchedule = [];
    this.results = null;
    // Reiniciamos los resultados de amortización anticipada
    this.earlyRepaymentResults = {
      reducingTerm: {
        savings: 0,
        monthlyPayment: 0,
        originalTerm: { years: 0, months: 0 },
        termReduction: { years: 0, months: 0 },
        newTerm: { years: 0, months: 0 },
      },
      reducingPayment: {
        savings: 0,
        term: { years: 0, months: 0 },
        originalPayment: 0,
        paymentReduction: 0,
        newPayment: 0,
      },
    };
  }
}
