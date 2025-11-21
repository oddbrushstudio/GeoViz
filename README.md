📊 GeoViz: Geophysical Profile Analyzer
Author: Oseni Ridwan | Email: olainmotion@gmail.com
License: MIT
Short Description
GeoViz is a fast, client-side geophysical visualization toolkit. Easily plot VLF and Resistivity survey profiles, automatically calculate Apparent Resistivity (\rho_a = K \cdot R), and apply the Karous-Hjelt filter for quick analysis and interpretation. Supports multiple arrays (Wenner, Schlumberger, Dipole-Dipole).
🚀 Key Features
Dual Survey Support: Resistivity & VLF plotting modes.
Automatic \rho_a Calculation: \rho_a = K \cdot R if input is missing.
Geophysical Array Flexibility: Wenner, Schlumberger, Dipole-Dipole support.
Karous-Hjelt Filtering: Apply derivative filter to VLF data.
Interactive Visualization: Customizable VLF colors, PNG/JPG export.
Robust Data Input: Accepts CSV/TXT with tabs, commas, or spaces.
🛠️ Usage Instructions
1. Running the Application
Clone the repository.
Open locally: Double-click index.html to open in your browser.
2. Data Input Format
The app accepts tabs, commas, or spaces as delimiters.
A. Resistivity Data (7 Columns Expected)
Select your Array Type. Input columns: P1, P2, P3, P4, K, R, Apparent_Rho (Optional)
Example: 0 10 20 30 62.83 8.1 508.92
B. VLF Data (3 Columns Expected)
Input columns: Station, InPhase, Quadrature
Example: 0 45.2 -12.5
📐 Project Files
index.html: Structure (UI).
styles.css: Presentation (Design).
script.js: Behavior (Logic/Calculations).
LICENSE: MIT License.
.gitignore: Git exclusion file.
📜 License
This project is licensed under the MIT License.
