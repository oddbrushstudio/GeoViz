/*
 * GeoViz Logic v2.0
 * Author: Oseni Ridwan | oddbrushstudio@gmail.com
 */

// --- Configuration ---
let chart = null;
let currentMode = 'vlf';
let chartPluginActive = false;

const THEMES = {
    vlf: [
        { name: "Ocean (Blue/Orange)", colors: ['#0ea5e9', '#f97316'] }, // Blue, Orange
        { name: "Forest (Green/Gold)", colors: ['#10b981', '#eab308'] }, // Emerald, Yellow
        { name: "Sunset (Purple/Red)", colors: ['#8b5cf6', '#ef4444'] }  // Violet, Red
    ],
    res: [
        { name: "Scientific (Rainbow)", colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] },
        { name: "Cool (Blues)", colors: ['#082f49', '#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc'] },
        { name: "Warm (Reds)", colors: ['#450a0a', '#991b1b', '#dc2626', '#f87171', '#fca5a5'] }
    ]
};

// --- Initialization ---
window.onload = () => {
    initUI();
    checkPlugins();
};

function initUI() {
    // Populate Themes
    const vSelect = document.getElementById('vlfTheme');
    THEMES.vlf.forEach((t, i) => vSelect.add(new Option(t.name, i)));
    
    const rSelect = document.getElementById('resTheme');
    THEMES.res.forEach((t, i) => rSelect.add(new Option(t.name, i)));

    document.getElementById('fileUpload').addEventListener('change', handleFile);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

function checkPlugins() {
    // Safe check for chart annotation plugin
    try {
        if (window['chartjs-plugin-annotation']) {
            Chart.register(window['chartjs-plugin-annotation']);
            chartPluginActive = true;
        }
    } catch (e) { console.warn("Annotation plugin missing"); }
}

// --- Mode Switching ---
function setMode(mode) {
    currentMode = mode;
    
    // Toggle UI States
    document.getElementById('btnVLF').classList.toggle('active', mode === 'vlf');
    document.getElementById('btnRes').classList.toggle('active', mode === 'resistivity');
    document.getElementById('vlfOptions').style.display = mode === 'vlf' ? 'block' : 'none';
    document.getElementById('resOptions').style.display = mode === 'resistivity' ? 'block' : 'none';
    
    // Update Hints
    const hint = document.getElementById('formatHint');
    hint.textContent = mode === 'vlf' ? 'Station, InPhase, Quad' : 'P1, P2, P3, P4, K, R, ρa';
    
    clearAll(true);
}

// --- Data Parsing ---
function parseData(input) {
    const lines = input.trim().split('\n');
    const cleanLines = lines.map(l => l.trim().split(/[\t, ]+/).map(Number)).filter(row => row.length > 1 && !row.some(isNaN));
    return cleanLines;
}

// --- Plotting Logic ---
function updatePlot() {
    const input = document.getElementById('dataInput').value;
    if (!input.trim()) return;

    if (chart) chart.destroy();
    
    document.getElementById('chartContainer').querySelector('.empty-state').style.display = 'none';
    const canvas = document.getElementById('mainChart');
    const ctx = canvas.getContext('2d');

    const rawData = parseData(input);
    if(rawData.length === 0) {
        alert("Invalid data format. Please check your inputs.");
        return;
    }

    if (currentMode === 'vlf') {
        plotVLF(ctx, rawData);
    } else {
        plotResistivity(ctx, rawData);
    }
    
    document.getElementById('dlBtn').disabled = false;
}

function plotVLF(ctx, data) {
    // Sort by Station (Column 0)
    data.sort((a,b) => a[0] - b[0]);
    
    const themeIdx = document.getElementById('vlfTheme').value;
    const colors = THEMES.vlf[themeIdx].colors;
    const showKH = document.getElementById('khToggle').checked;

    const datasets = [
        {
            label: 'In-Phase (%)',
            data: data.map(d => ({x: d[0], y: d[1]})),
            borderColor: colors[0],
            backgroundColor: colors[0] + '10', // Transparent fill
            borderWidth: 2.5,
            tension: 0.3,
            yAxisID: 'y'
        },
        {
            label: 'Quadrature (%)',
            data: data.map(d => ({x: d[0], y: d[2]})),
            borderColor: colors[1],
            backgroundColor: colors[1] + '10',
            borderWidth: 2.5,
            tension: 0.3,
            yAxisID: 'y'
        }
    ];

    const options = getChartOptions('Station (m)', 'Amplitude (%)');

    // KH Filter Calculation (Derivative)
    if (showKH && chartPluginActive) {
        const khData = [];
        for(let i=0; i<data.length-1; i++) {
            const xMid = (data[i][0] + data[i+1][0]) / 2;
            const dy = data[i+1][1] - data[i][1]; // Change in InPhase
            const dx = data[i+1][0] - data[i][0];
            if(dx !== 0) khData.push({x: xMid, y: dy/dx});
        }
        
        datasets.push({
            label: 'KH Filter',
            data: khData,
            borderColor: '#64748b',
            borderDash: [5, 5],
            borderWidth: 1.5,
            pointRadius: 0,
            yAxisID: 'yKH'
        });
        
        options.scales.yKH = { position: 'right', grid: {drawOnChartArea: false}, title: {display:true, text:'Filter'} };
    }

    chart = new Chart(ctx, { type: 'line', data: { datasets }, options });
    renderStats({ 'Points': data.length, 'Max Amp': Math.max(...data.map(d=>d[1])) + '%' });
}

function plotResistivity(ctx, data) {
    // Columns: P1, P2, P3, P4, K, R, Rho(optional)
    const arrayType = document.getElementById('arrayType').value;
    const themeIdx = document.getElementById('resTheme').value;
    const palette = THEMES.res[themeIdx].colors;

    // Group by Spacing 'a' (Column 1 - Column 0)
    const groups = {};
    
    data.forEach(row => {
        // Calculate Spacing 'a'
        const a = Math.abs(row[1] - row[0]);
        // Calculate Rho if missing
        let rho = row[6];
        if (isNaN(rho)) {
            // Basic K calc if not provided (fallback)
            const k = row[4] !== 0 ? row[4] : (arrayType === 'wenner' ? 2 * Math.PI * a : 1);
            rho = k * row[5]; 
        }
        
        // Midpoint calculation (Standard Center)
        const midpoint = (row[0] + row[3]) / 2; 
        
        const key = a.toFixed(1);
        if(!groups[key]) groups[key] = [];
        groups[key].push({ x: midpoint, y: rho });
    });

    const datasets = [];
    let colorIdx = 0;
    
    // Create dataset for each spacing level
    Object.keys(groups).sort((a,b)=>parseFloat(a)-parseFloat(b)).forEach(spacing => {
        const points = groups[spacing].sort((a,b) => a.x - b.x);
        const color = palette[colorIdx % palette.length];
        
        datasets.push({
            label: `Spacing a=${spacing}m`,
            data: points,
            borderColor: color,
            backgroundColor: color,
            showLine: true,
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.2
        });
        colorIdx++;
    });

    const options = getChartOptions('Profile Midpoint (m)', 'Apparent Resistivity (Ωm)');
    options.scales.y.type = 'logarithmic'; // Essential for resistivity

    chart = new Chart(ctx, { type: 'scatter', data: { datasets }, options });
    renderStats({ 'Layers': Object.keys(groups).length, 'Total Pts': data.length });
}

// --- Helpers ---
function getChartOptions(xLabel, yLabel) {
    const isDark = document.body.classList.contains('dark-mode');
    const color = isDark ? '#94a3b8' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    // Get Custom Title
    let titleText = document.getElementById('customTitle').value;
    if(!titleText) titleText = currentMode === 'vlf' ? "VLF In-Phase vs Quadrature" : "Resistivity Pseudosection Profile";

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: true, text: titleText, color: color, font: {size: 16, family: 'Poppins'} },
            legend: { labels: { color: color } }
        },
        scales: {
            x: { 
                type: 'linear', 
                title: { display: true, text: xLabel, color: color }, 
                ticks: { color: color },
                grid: { color: gridColor } 
            },
            y: { 
                title: { display: true, text: yLabel, color: color }, 
                ticks: { color: color },
                grid: { color: gridColor } 
            }
        }
    };
}

function loadRobustSample() {
    const dataInput = document.getElementById('dataInput');
    if (currentMode === 'vlf') {
        // Robust VLF Data (Crossover Anomaly)
        let csv = "";
        for(let x=0; x<=100; x+=5) {
            // Simulated crossover at x=50
            const ip = 40 * Math.sin((x-50)/20) + (Math.random()*2);
            const quad = 20 * Math.cos((x-50)/20);
            csv += `${x}\t${ip.toFixed(1)}\t${quad.toFixed(1)}\n`;
        }
        dataInput.value = csv;
    } else {
        // Robust Resistivity (Wenner, 3 levels)
        let csv = "";
        // Level 1: a=10
        for(let x=0; x<=100; x+=10) {
            // P1, P2, P3, P4, K, R
            csv += `${x}\t${x+10}\t${x+20}\t${x+30}\t62.8\t${(10 + Math.random()).toFixed(1)}\n`;
        }
        // Level 2: a=20
        for(let x=0; x<=80; x+=10) {
            csv += `${x}\t${x+20}\t${x+40}\t${x+60}\t125.6\t${(5 + Math.random()).toFixed(1)}\n`;
        }
        dataInput.value = csv;
    }
    updatePlot();
}

function renderStats(metrics) {
    const container = document.getElementById('statsBar');
    container.innerHTML = '';
    container.style.display = 'grid';
    
    for (const [key, value] of Object.entries(metrics)) {
        const div = document.createElement('div');
        div.className = 'stat-item';
        div.innerHTML = `<div class="stat-label">${key}</div><div class="stat-val">${value}</div>`;
        container.appendChild(div);
    }
}

function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
        complete: (res) => {
            document.getElementById('dataInput').value = res.data.map(row => row.join('\t')).join('\n');
            updatePlot();
        }
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if(chart) updatePlot(); // Redraw chart to match new theme colors
}

function clearAll(keepInput) {
    if(!keepInput) document.getElementById('dataInput').value = '';
    if(chart) {
        chart.destroy();
        chart = null;
    }
    document.getElementById('chartContainer').querySelector('.empty-state').style.display = 'flex';
    document.getElementById('statsBar').style.display = 'none';
    document.getElementById('dlBtn').disabled = true;
}

function downloadChart() {
    if(!chart) return;
    const link = document.createElement('a');
    link.download = `geoviz_chart.${document.getElementById('formatSelect').value}`;
    link.href = chart.toBase64Image();
    link.click();
}
