# GeoViz

A lightweight, client-side toolkit for visualizing and analyzing VLF and Resistivity survey profiles.

## Features

- **Dual Survey Modes** — Seamlessly switch between Resistivity and VLF plotting.
- **Automatic ρₐ Calculation** — Computes Apparent Resistivity (ρₐ = K · R) if the input column is missing. Calculated points are visually distinguished on the plot.
- **Array Flexibility** — Supports Wenner, Schlumberger, and Dipole-Dipole arrays for correct Geometric Factor (K) derivation.
- **VLF Filtering** — Applies the Karous-Hjelt numerical derivative filter to In-Phase data.
- **Interactive Design** — Customizable curve colors and exportable PNG/JPG charts.
- **Robust Data Input** — Accepts direct pasting of CSV/TXT data (tabs, commas, or spaces).

## Getting Started

GeoViz runs entirely in the browser with no server required.

```bash
# Clone the repository using your GitHub username:
git clone https://github.com/oddbrushstudio/geoviz.git
cd geoviz
open index.html
```

## Data Formats

Data can be pasted directly into the text box. The app accepts tabs, commas, or spaces as delimiters.

### A. Resistivity Survey

Select your Array Type in the UI. Input requires 6-7 columns:

| Column | Description | Required? | Example Value |
|--------|-------------|-----------|---------------|
| `P1, P2, P3, P4` | Electrode Positions (Distance) | Yes | `0, 10, 20, 30` |
| `K` | Geometric Factor | Optional (calculated if missing) | `62.83` |
| `R` | Measured Resistance | Yes | `8.1` |
| `Apparent_Rho` | Apparent Resistivity (ρₐ) | Optional | `508.92` |

> **Note:** ρₐ is calculated as K · R if the last column is omitted.

### B. VLF Survey

Input requires 3 columns:

| Column | Description | Example Value |
|--------|-------------|---------------|
| `Station` | Profile Distance (m) | `0` |
| `InPhase` | Amplitude (%) | `45.2` |
| `Quadrature` | Amplitude (%) | `-12.5` |

## Project Structure

```
geoviz/
├── index.html    # Application UI
├── styles.css    # Styling
├── script.js     # Core logic and calculations
└── LICENSE       # MIT License (see below)
```

## Author

Oseni Ridwan — [oddbrushstudio@gmail.com](mailto:oddbrushstudio@gmail.com)

## License

This project is licensed under the MIT License.
