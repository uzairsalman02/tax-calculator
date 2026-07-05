# Pakistan Salary Tax Calculator

A clean, responsive salary tax calculator for salaried persons in Pakistan.

## Features

- Financial year selector for FY 2026-27, FY 2025-26, and FY 2024-25
- Salary to tax calculator
- Reverse tax calculator
- Teacher / Researcher rebate rules
- Salary changed during year calculation
- Applicable tax slab and formula preview
- Printable tax certificate
- Copy, print, and save-as-PDF support
- Light and dark mode
- Fully static app with no backend, login, or database

## How It Works

Tax is calculated on annual gross taxable salary. The app finds the matching salaried income tax slab for the selected financial year, applies the slab formula, and then applies any eligible teacher/researcher rebate.

Reverse tax uses the same tax logic and estimates the annual gross salary that would produce the entered annual tax amount.

## Run Locally

Open `index.html` directly in a browser, or run a local server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## GitHub Pages

To publish the app:

1. Go to repository `Settings`
2. Open `Pages`
3. Select `Deploy from a branch`
4. Choose branch `main`
5. Choose folder `/root`
6. Save

## Files

- `index.html` - app structure
- `styles.css` - responsive UI and print styles
- `app.js` - calculator logic and UI behavior
- `tax-config.js` - tax slabs and rebate configuration
- `payroll-validation-data.js` - developer validation data

## Disclaimer

This calculator is for estimation and personal reference only. Actual tax deduction may vary due to payroll rules, rounding, allowances, rebates, credits, arrears, or official changes in tax law.
