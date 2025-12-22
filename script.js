/* 
 * Author: Oseni Ridwan | oddbrushstudio@gmail.com
 */

let chart = null;
let currentDataType = 'vlf';
let khPluginActive = false;

// --- Curated Combo Themes ---
const VLF_COMBOS = [
    { name: "Ocean (Blue & Orange)", colors: ['#0284c7', '#f97316'] },
    { name: "Nature (Green & Yellow)", colors: ['#059669', '#eab308'] },
    { name: "Classic (Blue & Red)", colors: ['#2563eb', '#dc2626'] },
    { name: "Cyber (Purple & Pink)", colors: ['#9333ea', '#db2777'] }
];

const RES_COMBOS = [
    { name: "Forest (Greens)", colors: ['#064e3b', '#059669', '#34d399', '#a7f3d0'] },
    { name: "Twilight (Blues/Purples)", colors: ['#1e3a8a', '#3b82f6', '#8b5cf6', '#d8b4fe'] },
    { name: "Volcano (Reds/Oranges)", colors: ['#7f1d1d', '#ef4444', '#f97316', '#fdba74'] }
];

// --- Plugin Registration Fix ---
try {
    // In Chart.js 3 via CDN, the annotation plugin usually defines global "ChartAnnotation"
    if (typeof ChartAnnotation !== 'undefined') {
        Chart.register(ChartAnnotation);
        khPluginActive = true;
    } else if (window['chartjs-plugin-annotation']) {
        Chart.register(window['chartjs-plugin-annotation']);
        khPluginActive = true;
    }
} catch (e) {
    console.error("KH Plugin Error:", e);
}

window.onload = () => {
    initThemes();
    setDataType('vlf');
};

function initThemes() {
    const vSelect = document.getElementById('vlfTheme');
    VLF_COMBOS.forEach((c, i) => vSelect.options.add(new Option(c.name, i)));
    
    const rSelect = document.getElementById('resTheme');
    RES_COMBOS.forEach((c, i) => rSelect.options.add(new Option(c.name, i)));
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (chart) plotData();
}

function setDataType(type) {
    currentDataType = type;
    document.getElementById('btnResistivity').classList.toggle('active', type === 'resistivity');
    document.getElementById('btnVLF').classList.toggle('active', type === 'vlf');
    document.getElementById('resistivityOptions').style.display = type === 'resistivity' ? 'block' : 'none';
    document.getElementById('vlfOptions').style.display = type === 'vlf' ? 'block' : 'none';
    
    const info = document.getElementById('infoBox');
    info.innerHTML = type === 'vlf' 
        ? "Paste 3 columns: <strong>Station, InPhase, Quadrature</strong>" 
        : "Paste 7 columns: <strong>P1, P2, P3, P4, K, R, ρa</strong> (ρa is optional)";
    clearAll(true);
}

// Gradient Utility
function getGradient(ctx, chartArea, color1, color2) {
    if (!chartArea) return color1;
    const grad = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2 || color1);
    return grad;
}

function plotData() {
    const input = document.getElementById('dataInput').value.trim();
    if (!input) return;

    if (chart) chart.destroy();
    document.getElementById('chartPlaceholder').style.display = 'none';
    const canvas = document.getElementById('resistivityChart');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    if (currentDataType === 'vlf') {
        renderVLF(ctx, input);
    } else {
        renderRes(ctx, input);
    }
    document.getElementById('downloadBtn').disabled = false;
}

function renderVLF(ctx, input) {
    const lines = input.split('\n').filter(l => l.trim() && !isNaN(parseFloat(l[0])));
    const data = lines.map(l => {
        const p = l.split(/[\t, ]+/).map(parseFloat);
        return { x: p[0], ip: p[1], q: p[2] };
    }).sort((a,b) => a.x - b.x);

    const theme = VLF_COMBOS[document.getElementById('vlfTheme').value];
    const showKH = document.getElementById('khToggle').checked;

    const datasets = [
        {
            label: 'In-Phase (%)',
            data: data.map(d => ({x: d.x, y: d.ip})),
            borderColor: (c) => getGradient(ctx, c.chart.chartArea, theme.colors[0], '#fff'),
            borderWidth: 3, tension: 0.3, yAxisID: 'y'
        },
        {
            label: 'Quadrature (%)',
            data: data.map(d => ({x: d.x, y: d.q})),
            borderColor: (c) => getGradient(ctx, c.chart.chartArea, theme.colors[1], '#fff'),
            borderWidth: 3, tension: 0.3, yAxisID: 'y'
        }
    ];

    const options = baseOptions('Station (m)', 'Amplitude (%)');

    if (showKH && khPluginActive) {
        const kh = [];
        for(let i=0; i<data.length-1; i++) {
            kh.push({ x: (data[i].x + data[i+1].x)/2, y: (data[i+1].ip - data[i].ip)/(data[i+1].x - data[i].x) });
        }
        datasets.push({
            label: 'KH Filter',
            data: kh,
            borderColor: '#8b5cf6',
            borderDash: [5, 5],
            yAxisID: 'yKH',
            pointRadius: 0
        });
        options.scales.yKH = { position: 'right', title: { display: true, text: 'Filter Value' }, grid: { drawOnChartArea: false } };
    }

    chart = new Chart(ctx, { type: 'line', data: { datasets }, options });
    updateStats(`Points: ${data.length}`, `IP Max: ${Math.max(...data.map(d=>d.ip))}%`);
}

function renderRes(ctx, input) {
    const lines = input.split('\n').filter(l => l.trim() && !isNaN(parseFloat(l[0])));
    const theme = RES_COMBOS[document.getElementById('resTheme').value];
    
    const parsed = lines.map(l => {
        const p = l.split(/[\t, ]+/).map(parseFloat);
        const rho = isNaN(p[6]) ? p[4] * p[5] : p[6];
        return { x: (p[0] + p[3])/2, y: rho, a: Math.abs(p[1]-p[0]) };
    });

    const spacings = [...new Set(parsed.map(d => d.a))].sort((a,b) => a-b);
    const datasets = spacings.map((a, i) => {
        const color = theme.colors[i % theme.colors.length];
        return {
            label: `Depth a=${a}m`,
            data: parsed.filter(d => d.a === a).sort((a,b) => a.x - b.x),
            borderColor: (c) => getGradient(ctx, c.chart.chartArea, color, '#000'),
            borderWidth: 2, tension: 0.2
        };
    });

    const options = baseOptions('Midpoint (m)', 'Apparent Resistivity (Ωm)');
    options.scales.y.type = 'logarithmic';

    chart = new Chart(ctx, { type: 'line', data: { datasets }, options });
    updateStats(`Levels: ${spacings.length}`, `Total Points: ${parsed.length}`);
}

function baseOptions(xLab, yLab) {
    const isDark = document.body.classList.contains('dark-mode');
    const color = isDark ? '#94a3b8' : '#64748b';
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color } } },
        scales: {
            x: { type: 'linear', title: { display: true, text: xLab, color }, ticks: { color }, grid: { color: isDark ? '#334155' : '#e2e8f0' } },
            y: { title: { display: true, text: yLab, color }, ticks: { color }, grid: { color: isDark ? '#334155' : '#e2e8f0' } }
        }
    };
}

function updateStats(s1, s2) {
    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('statsContainer').innerHTML = `
        <div class="stat-card"><h4>Metric A</h4><p>${s1}</p></div>
        <div class="stat-card"><h4>Metric B</h4><p>${s2}</p></div>
    `;
}

function clearAll(keepInput = false) {
    if (!keepInput) document.getElementById('dataInput').value = '';
    if (chart) chart.destroy();
    document.getElementById('chartPlaceholder').style.display = 'flex';
    document.getElementById('resistivityChart').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
}

function loadSampleData() {
    if (currentDataType === 'vlf') {
        document.getElementById('dataInput').value = "0,45,-10\n10,55,-12\n20,40,-15\n30,10,-10\n40,-20,5\n50,-30,12\n60,-10,8";
    } else {
        document.getElementById('dataInput').value = "0,10,20,30,62.8,10,628\n10,20,30,40,62.8,12,753\n0,20,40,60,125.6,5,628";
    }
    plotData();
}

function downloadChart() {
    const link = document.createElement('a');
    link.download = `geoviz_${currentDataType}.${document.getElementById('formatSelect').value}`;
    link.href = chart.toBase64Image();
    link.click();
}
