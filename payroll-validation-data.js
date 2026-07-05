// Developer/test reference only. The app must calculate these values from tax rules,
// not use this dataset as hardcoded output.
window.PAYROLL_VALIDATION_DATA = {
  label: "FY 2025-26 Government Teacher Payroll Validation Dataset",
  yearKey: "fy2025",
  annualGrossSalary: 990603,
  totalIncomeTaxDeducted: 3906,
  finalAnnualTaxPayable: 3906.02,
  rows: [
    { month: "Jul-2025", grossSalary: 78611, monthlyTax: 287, annualTaxPayable: 3433.31, recoveredTillMonth: 287, remainingTax: 3147.21 },
    { month: "Aug-2025", grossSalary: 78611, monthlyTax: 287, annualTaxPayable: 3433.31, recoveredTillMonth: 574, remainingTax: 2860.3 },
    { month: "Sep-2025", grossSalary: 81467, monthlyTax: 315, annualTaxPayable: 3718.91, recoveredTillMonth: 889, remainingTax: 2830.41 },
    { month: "Oct-2025", grossSalary: 81467, monthlyTax: 315, annualTaxPayable: 3718.91, recoveredTillMonth: 1204, remainingTax: 2515.52 },
    { month: "Nov-2025", grossSalary: 81467, monthlyTax: 315, annualTaxPayable: 3718.91, recoveredTillMonth: 1519, remainingTax: 2200.59 },
    { month: "Dec-2025", grossSalary: 84140, monthlyTax: 341, annualTaxPayable: 3906.02, recoveredTillMonth: 1860, remainingTax: 2046 },
    { month: "Jan-2026", grossSalary: 84140, monthlyTax: 341, annualTaxPayable: 3906.02, recoveredTillMonth: 2201, remainingTax: 1705 },
    { month: "Feb-2026", grossSalary: 84140, monthlyTax: 341, annualTaxPayable: 3906.02, recoveredTillMonth: 2542, remainingTax: 1364 },
    { month: "Mar-2026", grossSalary: 84140, monthlyTax: 341, annualTaxPayable: 3906.02, recoveredTillMonth: 2883, remainingTax: 1023 },
    { month: "Apr-2026", grossSalary: 84140, monthlyTax: 341, annualTaxPayable: 3906.02, recoveredTillMonth: 3224, remainingTax: 682 },
    { month: "May-2026", grossSalary: 84140, monthlyTax: 341, annualTaxPayable: 3906.02, recoveredTillMonth: 3565, remainingTax: 341 },
    { month: "Jun-2026 Assumed", grossSalary: 84140, monthlyTax: 341, annualTaxPayable: 3906.02, recoveredTillMonth: 3906, remainingTax: 0 },
  ],
};
