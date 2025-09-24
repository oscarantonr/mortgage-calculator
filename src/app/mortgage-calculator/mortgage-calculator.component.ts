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

  resetCalculator() {
    this.mortgageForm.reset({
      loanAmount: '150.000',
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
  }
}
