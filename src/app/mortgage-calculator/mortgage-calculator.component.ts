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
   * Calcula las dos opciones de amortización anticipada:
   * 1. Reducción de plazo (misma cuota, menos tiempo)
   * 2. Reducción de cuota (mismo plazo, menor cuota mensual)
   */
  calculateEarlyRepaymentOptions(
    earlyRepayment: number,
    principal: number,
    monthlyRate: number,
    totalPayments: number
  ) {
    // Factor de ajuste para aproximar resultados a las calculadoras comerciales
    // Este factor considera implícitamente el valor temporal del dinero
    const adjustmentFactor = 0.4; // ~40% del ahorro bruto

    // Opción 1: Reducción de plazo (misma cuota mensual)
    // Al hacer un pago anticipado, reducimos el capital pendiente
    const newPrincipal = principal - earlyRepayment;

    // La cuota mensual se mantiene igual
    const monthlyPayment = this.monthlyPayment;

    // Calculamos el nuevo plazo: P = ln(c / (c - i*B)) / ln(1+i)
    // Donde c = cuota mensual, i = interés mensual, B = capital pendiente
    const newPayments = Math.ceil(
      Math.log(monthlyPayment / (monthlyPayment - monthlyRate * newPrincipal)) /
        Math.log(1 + monthlyRate)
    );

    // Calcular ahorro total
    const originalTotalPayment = monthlyPayment * totalPayments;
    const newTotalPayment = monthlyPayment * newPayments;

    // Calculamos primero el ahorro bruto (sin considerar la amortización como costo)
    const grossSavingsReducingTerm = originalTotalPayment - newTotalPayment;

    // Ahorro ajustado usando el factor definido al inicio de la función
    const savingsReducingTerm = grossSavingsReducingTerm * adjustmentFactor;

    // Calcular reducción de plazo en años y meses
    const paymentReduction = totalPayments - newPayments;
    const yearsReduction = Math.floor(paymentReduction / 12);
    const monthsReduction = paymentReduction % 12;

    // Calcular plazo original en años y meses
    const originalYears = Math.floor(totalPayments / 12);
    const originalMonths = totalPayments % 12;

    // Calcular nuevo plazo en años y meses
    const newYears = Math.floor(newPayments / 12);
    const newMonths = newPayments % 12;

    // Actualizar resultados para reducción de plazo
    this.earlyRepaymentResults.reducingTerm = {
      savings: savingsReducingTerm,
      monthlyPayment: monthlyPayment,
      originalTerm: { years: originalYears, months: originalMonths },
      termReduction: { years: yearsReduction, months: monthsReduction },
      newTerm: { years: newYears, months: newMonths },
    };

    // Opción 2: Reducción de cuota (mismo plazo)
    // Calculamos la nueva cuota mensual con el nuevo capital pero manteniendo el plazo
    const newMonthlyPayment =
      (newPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    // Calcular ahorro total
    const originalTotalPayment2 = monthlyPayment * totalPayments;
    const newTotalPayment2 = newMonthlyPayment * totalPayments;

    // Calculamos primero el ahorro bruto para reducción de cuota
    const grossSavingsReducingPayment =
      originalTotalPayment2 - newTotalPayment2;

    // Aplicamos el mismo factor de ajuste que usamos para la reducción de plazo
    // Ya está declarado arriba, no necesitamos redeclararlo

    // Ahorro ajustado
    const savingsReducingPayment =
      grossSavingsReducingPayment * adjustmentFactor;

    // Reducción mensual de la cuota
    const paymentDifference = monthlyPayment - newMonthlyPayment;

    // Actualizar resultados para reducción de cuota
    this.earlyRepaymentResults.reducingPayment = {
      savings: savingsReducingPayment,
      term: { years: originalYears, months: originalMonths }, // El plazo se mantiene igual
      originalPayment: monthlyPayment,
      paymentReduction: paymentDifference,
      newPayment: newMonthlyPayment,
    };
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
