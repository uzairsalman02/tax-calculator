const CONFIG = window.TAX_CONFIG;
const TAX_YEARS = CONFIG.years;
const MONTHS = CONFIG.months;

const PKR = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const PKR_DECIMAL = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENT = new Intl.NumberFormat("en-PK", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const state = {
  activeYear: "fy2026",
  userType: "standard",
  salaryPeriod: "monthly",
  salaryChanged: false,
  salaryPeriods: [
    { from: 0, to: 11, amount: "" },
  ],
};

const $ = (id) => document.getElementById(id);

function parseMoney(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}

function formatMoney(value, decimals = false) {
  const formatter = decimals ? PKR_DECIMAL : PKR;
  return formatter.format(value).replace("PKR", "Rs.");
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function fiscalMonthCount(from, to) {
  if (to < from) return 0;
  return to - from + 1;
}

function findSlab(annualSalary, year = TAX_YEARS[state.activeYear]) {
  return year.slabs.find((slab) => annualSalary >= slab.min && annualSalary <= slab.max) || year.slabs.at(-1);
}

function baseTaxForSlab(annualSalary, slab) {
  return slab.fixed + Math.max(0, annualSalary - slab.min) * slab.rate;
}

function calculateTax(annualSalary, yearKey = state.activeYear, userType = state.userType) {
  const year = TAX_YEARS[yearKey];
  const slab = findSlab(annualSalary, year);
  const slabTax = baseTaxForSlab(annualSalary, slab);
  const surcharge = annualSalary > year.surchargeThreshold ? slabTax * year.surchargeRate : 0;
  const taxBeforeRebate = Math.max(0, slabTax + surcharge);
  const rebateRule = year.teacherResearcherRebate;
  const canApplyTeacherRebate = userType === "teacher" && rebateRule.available;
  const teacherRebate = canApplyTeacherRebate ? taxBeforeRebate * rebateRule.rate : 0;
  const finalTax = Math.max(0, taxBeforeRebate - teacherRebate);
  const netAnnual = Math.max(0, annualSalary - finalTax);

  return {
    annualSalary,
    taxBeforeRebate,
    surcharge,
    teacherRebate,
    taxSaved: teacherRebate,
    finalTax,
    monthlyTax: finalTax / 12,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: annualSalary > 0 ? finalTax / annualSalary : 0,
    slab,
    slabTax,
    slabLabel: describeSlab(slab),
    slabFormula: describeSlabFormula(slab),
    formula: describeFormula(slab, surcharge, year, teacherRebate),
    rebateMessage: userType === "teacher" ? rebateRule.message : "",
    howCalculated: buildHowCalculated(annualSalary, slab, taxBeforeRebate, teacherRebate, finalTax),
  };
}

function reverseTax(targetTax, yearKey = state.activeYear, userType = state.userType) {
  const maxSalary = Math.max(50000000, targetTax * 8 + 10000000);
  let low = 0;
  let high = maxSalary;

  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    if (calculateTax(mid, yearKey, userType).finalTax < targetTax) low = mid;
    else high = mid;
  }

  return calculateTax(high, yearKey, userType);
}

function describeSlab(slab) {
  if (slab.rate === 0) return `Up to ${formatMoney(slab.max)} - exempt`;
  const lower = formatMoney(slab.min + 1);
  const upper = Number.isFinite(slab.max) ? ` to ${formatMoney(slab.max)}` : " and above";
  return `${lower}${upper}`;
}

function describeSlabFormula(slab) {
  if (slab.rate === 0) return "No tax in this slab";
  const fixed = slab.fixed > 0 ? `${formatMoney(slab.fixed)} + ` : "";
  return `${fixed}${formatRate(slab.rate)} of amount exceeding ${formatMoney(slab.min)}`;
}

function describeFormula(slab, surcharge, year, teacherRebate) {
  const base = describeSlabFormula(slab);
  const surchargeText = surcharge > 0 ? `, plus ${formatRate(year.surchargeRate)} surcharge on calculated tax` : "";
  const rebateText = teacherRebate > 0 ? ", less teacher/researcher rebate" : "";
  return `${base}${surchargeText}${rebateText}`;
}

function formatRate(rate) {
  return `${Number((rate * 100).toFixed(2))}%`;
}

function buildHowCalculated(annualSalary, slab, taxBeforeRebate, teacherRebate, finalTax) {
  const taxableAmount = Math.max(0, annualSalary - slab.min);
  const formula =
    slab.rate === 0
      ? "Annual salary is within the exempt slab"
      : `${slab.fixed > 0 ? `${formatMoney(slab.fixed)} + ` : ""}(${formatMoney(annualSalary)} - ${formatMoney(slab.min)}) x ${formatRate(slab.rate)}`;

  return [
    ["Annual Gross Salary", formatMoney(annualSalary)],
    ["Exempt / Slab Base", formatMoney(slab.min)],
    ["Taxable Amount in Slab", formatMoney(taxableAmount)],
    ["Rate", formatRate(slab.rate)],
    ["Tax Before Rebate", formatMoney(taxBeforeRebate, true)],
    ["Teacher / Researcher Rebate", formatMoney(teacherRebate, true)],
    ["Final Tax Payable", formatMoney(finalTax, true)],
    ["Formula", formula],
  ];
}

function renderHowCalculated(id, rows) {
  $(id).innerHTML = rows.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join("");
}

function validateSalaryPeriods(periods) {
  const errors = [];
  const usedMonths = new Array(MONTHS.length).fill(false);

  periods.forEach((period, index) => {
    const rowNumber = index + 1;
    const amount = parseMoney(period.amount);
    if (period.to < period.from) errors.push(`Row ${rowNumber}: To month must be after From month.`);
    if (amount === null || !Number.isFinite(amount) || amount < 0) errors.push(`Row ${rowNumber}: Enter a valid gross salary.`);

    for (let month = period.from; month <= period.to; month += 1) {
      if (usedMonths[month]) errors.push(`Row ${rowNumber}: Month range overlaps another row.`);
      usedMonths[month] = true;
    }
  });

  return errors;
}

function annualSalaryFromPeriods() {
  return state.salaryPeriods.reduce((total, period) => {
    const amount = parseMoney(period.amount);
    if (!Number.isFinite(amount)) return total;
    return total + amount * fiscalMonthCount(period.from, period.to);
  }, 0);
}

function getSalaryInput() {
  if (state.salaryChanged) {
    const errors = validateSalaryPeriods(state.salaryPeriods);
    if (errors.length > 0) return { error: errors[0] };
    return { annualSalary: annualSalaryFromPeriods() };
  }

  const input = parseMoney($("salaryInput").value);
  if (input === null) return { empty: true };
  if (!Number.isFinite(input) || input < 0) return { error: "Please enter a valid positive amount." };
  return { annualSalary: state.salaryPeriod === "monthly" ? input * 12 : input };
}

function updateSalaryResult() {
  const input = getSalaryInput();
  const help = state.salaryChanged ? $("periodHelp") : $("salaryHelp");

  if (input.empty) {
    if (help) {
      help.textContent = "Enter gross salary in Pakistani Rupees.";
      help.classList.remove("error");
    }
    $("salaryEmpty").classList.remove("hidden");
    $("salaryResults").classList.add("hidden");
    return;
  }

  if (input.error) {
    help.textContent = input.error;
    help.classList.add("error");
    $("salaryEmpty").classList.remove("hidden");
    $("salaryResults").classList.add("hidden");
    return;
  }

  const result = calculateTax(input.annualSalary);
  help.textContent = `Using ${TAX_YEARS[state.activeYear].label} slabs on annual gross salary.`;
  help.classList.remove("error");

  setText("annualTax", formatMoney(result.finalTax, true));
  setText("grossAnnual", formatMoney(result.annualSalary));
  setText("taxBeforeRebate", formatMoney(result.taxBeforeRebate, true));
  setText("teacherRebate", formatMoney(result.teacherRebate, true));
  setText("taxSaved", formatMoney(result.taxSaved, true));
  setText("monthlyTax", formatMoney(result.monthlyTax, true));
  setText("netAnnual", formatMoney(result.netAnnual, true));
  setText("netMonthly", formatMoney(result.netMonthly, true));
  setText("effectiveRate", PERCENT.format(result.effectiveRate));
  setText("salarySlab", result.slabLabel);
  setText("salaryFormula", result.slabFormula);
  renderHowCalculated("salaryHowCalculated", result.howCalculated);
  renderRebateMessage("salaryRebateMessage", result.rebateMessage);

  $("salaryEmpty").classList.add("hidden");
  $("salaryResults").classList.remove("hidden");
}

function updateReverseResult() {
  const input = parseMoney($("taxInput").value);
  const help = $("reverseHelp");

  if (input === null) {
    help.textContent = "This is an estimated reverse calculation based on tax slabs.";
    help.classList.remove("error");
    $("reverseEmpty").classList.remove("hidden");
    $("reverseResults").classList.add("hidden");
    return;
  }

  if (!Number.isFinite(input) || input < 0) {
    help.textContent = "Please enter a valid positive annual tax amount.";
    help.classList.add("error");
    $("reverseEmpty").classList.remove("hidden");
    $("reverseResults").classList.add("hidden");
    return;
  }

  const result = reverseTax(input);
  help.textContent = "This is an estimated reverse calculation based on tax slabs.";
  help.classList.remove("error");

  setText("estimatedAnnual", formatMoney(result.annualSalary));
  setText("estimatedMonthly", formatMoney(result.annualSalary / 12));
  setText("reverseTaxBeforeRebate", formatMoney(result.taxBeforeRebate, true));
  setText("reverseTeacherRebate", formatMoney(result.teacherRebate, true));
  setText("reverseTax", formatMoney(result.finalTax, true));
  setText("reverseRate", PERCENT.format(result.effectiveRate));
  setText("reverseSlab", result.slabLabel);
  setText("reverseFormula", result.slabFormula);
  renderHowCalculated("reverseHowCalculated", result.howCalculated);
  renderRebateMessage("reverseRebateMessage", result.rebateMessage);

  $("reverseEmpty").classList.add("hidden");
  $("reverseResults").classList.remove("hidden");
}

function renderRebateMessage(id, message) {
  const element = $(id);
  if (!message) {
    element.classList.add("hidden");
    element.textContent = "";
    return;
  }
  element.textContent = message;
  element.classList.remove("hidden");
}

function resultText(type) {
  const year = TAX_YEARS[state.activeYear].label;
  if (type === "salary") {
    return [
      `Pakistan Salary Tax Calculator - ${year}`,
      `User Type: ${$("userTypeSelect").selectedOptions[0].textContent}`,
      `Annual Gross Salary: ${$("grossAnnual").textContent}`,
      `Tax Before Rebate: ${$("taxBeforeRebate").textContent}`,
      `Teacher / Researcher Rebate: ${$("teacherRebate").textContent}`,
      `Final Tax Payable: ${$("annualTax").textContent}`,
      `Monthly Tax: ${$("monthlyTax").textContent}`,
      `Effective Tax Rate: ${$("effectiveRate").textContent}`,
      `Applicable Slab: ${$("salarySlab").textContent}`,
      `Formula: ${$("salaryFormula").textContent}`,
    ].join("\n");
  }

  if (type === "reverse") {
    return [
      `Pakistan Reverse Salary Tax Calculator - ${year}`,
      "This is an estimated reverse calculation based on tax slabs.",
      `User Type: ${$("userTypeSelect").selectedOptions[0].textContent}`,
      `Estimated Annual Gross Salary: ${$("estimatedAnnual").textContent}`,
      `Estimated Monthly Gross Salary: ${$("estimatedMonthly").textContent}`,
      `Tax Before Rebate: ${$("reverseTaxBeforeRebate").textContent}`,
      `Teacher / Researcher Rebate: ${$("reverseTeacherRebate").textContent}`,
      `Final Tax Payable: ${$("reverseTax").textContent}`,
      `Applicable Slab: ${$("reverseSlab").textContent}`,
      `Formula: ${$("reverseFormula").textContent}`,
    ].join("\n");
  }

  return "";
}

async function copyResult(type) {
  const visibleMap = {
    salary: !$("salaryResults").classList.contains("hidden"),
    reverse: !$("reverseResults").classList.contains("hidden"),
  };

  if (!visibleMap[type]) {
    setText("copyStatus", "Nothing to copy yet.");
    return;
  }

  await navigator.clipboard.writeText(resultText(type));
  setText("copyStatus", "Result copied.");
  window.setTimeout(() => setText("copyStatus", ""), 2200);
}

function printResult() {
  window.print();
}

function printTaxCertificate() {
  const fallbackTax = parseMoney($("taxInput").value);
  const certificateTax = parseMoney($("certificateTax").value);
  const annualTax = certificateTax ?? fallbackTax;
  const help = $("certificateHelp");

  if (annualTax === null || !Number.isFinite(annualTax) || annualTax < 0) {
    help.textContent = "Please enter a valid annual tax paid amount.";
    help.classList.add("error");
    return;
  }

  const taxpayerName = $("certificateName").value.trim() || "Taxpayer";
  const userType = $("userTypeSelect").selectedOptions[0].textContent;
  const result = reverseTax(annualTax);
  const generatedDate = new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  setText("certificatePrintName", taxpayerName);
  setText("certificatePrintYear", TAX_YEARS[state.activeYear].label);
  setText("certificatePrintUserType", userType);
  setText("certificatePrintIncome", formatMoney(result.annualSalary));
  setText("certificatePrintBeforeRebate", formatMoney(result.taxBeforeRebate, true));
  setText("certificatePrintRebate", formatMoney(result.teacherRebate, true));
  setText("certificatePrintTax", formatMoney(annualTax, true));
  setText("certificatePrintRate", PERCENT.format(result.effectiveRate));
  setText("certificatePrintSlab", result.slabLabel);
  setText("certificatePrintDate", generatedDate);

  help.textContent = "Certificate ready for printing.";
  help.classList.remove("error");
  document.body.classList.add("certificate-print-mode");
  window.print();
  window.setTimeout(() => document.body.classList.remove("certificate-print-mode"), 250);
}

function renderPeriodRows() {
  $("periodRows").innerHTML = state.salaryPeriods
    .map((period, index) => {
      const monthOptions = MONTHS.map((month, monthIndex) => `<option value="${monthIndex}">${month.shortLabel}</option>`).join("");
      return `
        <div class="period-row" data-index="${index}">
          <label>
            <span>From</span>
            <select class="period-from">${monthOptions}</select>
          </label>
          <label>
            <span>To</span>
            <select class="period-to">${monthOptions}</select>
          </label>
          <label>
            <span>Monthly Gross</span>
            <input class="period-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="e.g. 95,000" value="${period.amount}" />
          </label>
          <button class="soft-button remove-period" type="button" ${state.salaryPeriods.length === 1 ? "disabled" : ""}>Remove</button>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".period-row").forEach((row) => {
    const index = Number(row.dataset.index);
    row.querySelector(".period-from").value = String(state.salaryPeriods[index].from);
    row.querySelector(".period-to").value = String(state.salaryPeriods[index].to);
  });
}

function syncPeriodFromDom() {
  document.querySelectorAll(".period-row").forEach((row) => {
    const index = Number(row.dataset.index);
    state.salaryPeriods[index] = {
      from: Number(row.querySelector(".period-from").value),
      to: Number(row.querySelector(".period-to").value),
      amount: row.querySelector(".period-amount").value,
    };
  });
}

function bindEvents() {
  $("yearSelect").addEventListener("change", (event) => {
    state.activeYear = event.target.value;
    updateSalaryResult();
    updateReverseResult();
  });

  $("userTypeSelect").addEventListener("change", (event) => {
    state.userType = event.target.value;
    updateSalaryResult();
    updateReverseResult();
  });

  $("salaryInput").addEventListener("input", updateSalaryResult);
  $("taxInput").addEventListener("input", updateReverseResult);

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      state.salaryPeriod = button.dataset.period;
      document.querySelectorAll(".segment").forEach((item) => item.classList.toggle("active", item === button));
      setText("salaryInputLabel", state.salaryPeriod === "monthly" ? "Monthly Gross Salary" : "Annual Gross Salary");
      updateSalaryResult();
    });
  });

  document.querySelectorAll(".change-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      state.salaryChanged = button.dataset.changed === "yes";
      document.querySelectorAll(".change-toggle").forEach((item) => item.classList.toggle("active", item === button));
      $("singleSalaryFields").classList.toggle("hidden", state.salaryChanged);
      $("periodSalaryFields").classList.toggle("hidden", !state.salaryChanged);
      updateSalaryResult();
    });
  });

  $("periodRows").addEventListener("input", () => {
    syncPeriodFromDom();
    updateSalaryResult();
  });

  $("periodRows").addEventListener("change", () => {
    syncPeriodFromDom();
    updateSalaryResult();
  });

  $("periodRows").addEventListener("click", (event) => {
    if (!event.target.classList.contains("remove-period")) return;
    syncPeriodFromDom();
    const index = Number(event.target.closest(".period-row").dataset.index);
    state.salaryPeriods.splice(index, 1);
    renderPeriodRows();
    updateSalaryResult();
  });

  $("addPeriodRow").addEventListener("click", () => {
    syncPeriodFromDom();
    state.salaryPeriods.push({ from: 0, to: 0, amount: "" });
    renderPeriodRows();
    updateSalaryResult();
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;
      document.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("active", item === button));
      $("salaryPanel").classList.toggle("active", target === "salary");
      $("reversePanel").classList.toggle("active", target === "reverse");
    });
  });

  $("themeToggle").addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  });

  $("copySalaryResult").addEventListener("click", () => copyResult("salary"));
  $("copyReverseResult").addEventListener("click", () => copyResult("reverse"));
  $("printSalaryResult").addEventListener("click", printResult);
  $("printReverseResult").addEventListener("click", printResult);
  $("pdfSalaryResult").addEventListener("click", printResult);
  $("pdfReverseResult").addEventListener("click", printResult);
  $("printCertificate").addEventListener("click", printTaxCertificate);
}

function validatePayrollDataset() {
  const data = window.PAYROLL_VALIDATION_DATA;
  if (!data) return null;
  const result = calculateTax(data.annualGrossSalary, data.yearKey, "standard");
  return {
    expectedAnnualGrossSalary: data.annualGrossSalary,
    calculatedFinalTax: result.finalTax,
    referenceFinalTax: data.finalAnnualTaxPayable,
    matchesReference: Math.abs(result.finalTax - data.finalAnnualTaxPayable) < 0.05,
  };
}

if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

renderPeriodRows();
bindEvents();
updateSalaryResult();
updateReverseResult();
window.validatePayrollDataset = validatePayrollDataset;
