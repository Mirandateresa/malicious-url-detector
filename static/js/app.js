// Frontend simplificado - Solo gráfica de métricas

const API_BASE = '/api';

// ===== FUNCIONES PRINCIPALES =====

// Cargar métricas y gráfica
async function loadMetrics() {
    try {
        // Cargar información del modelo
        const metricsResponse = await fetch(`${API_BASE}/model-info`);
        const metricsData = await metricsResponse.json();
        
        if (metricsData.metrics) {
            updateMetricsDisplay(metricsData.metrics);
        }
        
        // Cargar gráfico de métricas
        await loadMetricsChart();
        
        // Actualizar estado
        document.getElementById('modelStatus').innerHTML = 
            `<i class="fas fa-check-circle"></i> Modelo ${metricsData.kernel} - F1: ${(metricsData.metrics.f1_score * 100).toFixed(1)}%`;
        
    } catch (error) {
        console.error('Error cargando métricas:', error);
        document.getElementById('modelStatus').innerHTML = 
            `<i class="fas fa-exclamation-triangle"></i> Error cargando métricas`;
    }
}

// Cargar gráfica de métricas
async function loadMetricsChart() {
    try {
        const response = await fetch(`${API_BASE}/metrics-chart`);
        const data = await response.json();
        
        if (data.chart) {
            const chartData = JSON.parse(data.chart);
            Plotly.newPlot('metricsChart', chartData.data, chartData.layout, {
                responsive: true,
                displayModeBar: false, // Ocultar barra de herramientas para simplificar
                staticPlot: false
            });
        }
    } catch (error) {
        console.error('Error cargando gráfica:', error);
        document.getElementById('metricsChart').innerHTML = 
            `<div style="text-align: center; padding: 2rem; color: var(--accent-teal);">
                <i class="fas fa-chart-line"></i>
                <p>Gráfica de métricas</p>
                <p style="font-size: 0.9rem; color: var(--text-muted);">
                    F1-Score, Precisión, Recall y Accuracy
                </p>
            </div>`;
    }
}

// Actualizar display de métricas
function updateMetricsDisplay(metrics) {
    if (!metrics) return;
    
    // Actualizar valores principales
    document.getElementById('accuracyValue').textContent = 
        `${(metrics.accuracy * 100).toFixed(1)}%`;
    
    document.getElementById('f1Value').textContent = 
        `${(metrics.f1_score * 100).toFixed(1)}%`;
    
    document.getElementById('recallValue').textContent = 
        `${(metrics.recall * 100).toFixed(1)}%`;
    
    document.getElementById('precisionValue').textContent = 
        `${(metrics.precision * 100).toFixed(1)}%`;
    
    // Colorear según valor
    colorizeMetric('accuracyValue', metrics.accuracy);
    colorizeMetric('f1Value', metrics.f1_score);
    colorizeMetric('recallValue', metrics.recall);
    colorizeMetric('precisionValue', metrics.precision);
    
    // Animación de actualización
    animateUpdate('f1Value');
}

// Animación para métricas actualizadas
function animateUpdate(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('updated');
        setTimeout(() => {
            element.classList.remove('updated');
        }, 500);
    }
}

// Colorear métricas según valor
function colorizeMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (value >= 0.9) {
        element.style.color = '#06D6A0'; // Verde
    } else if (value >= 0.8) {
        element.style.color = '#FFD166'; // Amarillo
    } else if (value >= 0.7) {
        element.style.color = '#FF9E6B'; // Naranja
    } else {
        element.style.color = '#FF6B6B'; // Rojo
    }
}

// Analizar URL
async function analyzeURL() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Por favor, ingrese una URL');
        return;
    }
    
    try {
        // Mostrar carga
        const resultSection = document.getElementById('resultSection');
        resultSection.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--accent-teal);">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                <p>Analizando con modelo SVM...</p>
            </div>
        `;
        resultSection.style.display = 'block';
        
        // Enviar solicitud
        const response = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const data = await response.json();
        showResults(data, url);
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al analizar la URL');
    }
}

// Mostrar resultados
function showResults(data, url) {
    const resultSection = document.getElementById('resultSection');
    
    const isMalicious = data.is_malicious;
    const confidence = Math.round(data.confidence * 100);
    const probLegit = Math.round(data.probability_legitimate * 100);
    const probMal = Math.round(data.probability_malicious * 100);
    
    resultSection.innerHTML = `
        <div style="margin-top: 1.5rem;">
            <div class="result-badge ${isMalicious ? 'danger' : 'safe'}">
                <i class="fas ${isMalicious ? 'fa-exclamation-triangle' : 'fa-shield-alt'}"></i>
                ${isMalicious ? '⚠️ URL MALICIOSA' : '✅ URL SEGURA'}
            </div>
            
            <div style="margin: 1.5rem 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Confianza del análisis:</span>
                    <span style="font-weight: bold; color: ${getConfidenceColor(confidence)};">${confidence}%</span>
                </div>
                <div class="meter-bar">
                    <div class="meter-fill" style="width: ${confidence}%; background: ${getConfidenceGradient(confidence)};"></div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 1.5rem 0;">
                <div style="text-align: center; padding: 1.2rem; background: rgba(6, 214, 160, 0.1); border-radius: 10px; border: 1px solid rgba(6, 214, 160, 0.3);">
                    <div style="font-size: 0.9rem; color: var(--text-muted);">Legítima</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: #06D6A0;">${probLegit}%</div>
                </div>
                <div style="text-align: center; padding: 1.2rem; background: rgba(255, 107, 107, 0.1); border-radius: 10px; border: 1px solid rgba(255, 107, 107, 0.3);">
                    <div style="font-size: 0.9rem; color: var(--text-muted);">Maliciosa</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: #FF6B6B;">${probMal}%</div>
                </div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
                <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    <i class="fas fa-link"></i> URL analizada:
                </div>
                <div style="font-family: 'Courier New', monospace; word-break: break-all; color: var(--light-purple);">
                    ${url}
                </div>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: ${isMalicious ? 'rgba(255, 107, 107, 0.1)' : 'rgba(6, 214, 160, 0.1)'}; 
                 border-radius: 10px; border-left: 4px solid ${isMalicious ? '#FF6B6B' : '#06D6A0'};">
                <p style="margin: 0; line-height: 1.5;">
                    <strong>${isMalicious ? '⚠️ Precaución:' : '✅ Seguro:'}</strong><br>
                    ${data.recommendation}
                </p>
            </div>
        </div>
    `;
}

// Helper functions para colores
function getConfidenceColor(confidence) {
    if (confidence >= 90) return '#06D6A0';
    if (confidence >= 70) return '#FFD166';
    return '#FF6B6B';
}

function getConfidenceGradient(confidence) {
    if (confidence >= 90) return 'linear-gradient(90deg, #06D6A0, #4ECDC4)';
    if (confidence >= 70) return 'linear-gradient(90deg, #FFD166, #FFB347)';
    return 'linear-gradient(90deg, #FF6B6B, #FF8E8E)';
}

// Subir dataset
async function uploadDataset() {
    const fileInput = document.getElementById('datasetUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor seleccione un archivo');
        return;
    }
    
    if (!file.name.endsWith('.csv')) {
        alert('Solo se permiten archivos CSV');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/upload-dataset`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        alert('✅ Dataset cargado exitosamente');
        
    } catch (error) {
        console.error('Error uploading dataset:', error);
        alert('❌ Error subiendo dataset');
    }
}

// Entrenar modelo
async function trainModel() {
    const kernel = document.getElementById('kernelSelect').value;
    const C = parseFloat(document.getElementById('cValue').value);
    
    try {
        const trainBtn = document.getElementById('trainBtn');
        const originalText = trainBtn.innerHTML;
        trainBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrenando...';
        trainBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('kernel', kernel);
        formData.append('C', C);
        
        const response = await fetch(`${API_BASE}/train`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const data = await response.json();
        
        // Mostrar resultados
        const resultsDiv = document.getElementById('trainingResults');
        resultsDiv.innerHTML = `
            <div style="padding: 1rem; background: rgba(106, 13, 173, 0.1); border-radius: 10px; margin-top: 1rem;">
                <p style="color: #06D6A0; margin: 0;">
                    <i class="fas fa-check-circle"></i> <strong>${data.message}</strong>
                </p>
                <div style="margin-top: 0.8rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9rem;">
                    <div>
                        <div style="color: var(--text-muted);">Kernel</div>
                        <div style="font-weight: bold; color: #9D4EDD;">${data.kernel}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-muted);">F1-Score</div>
                        <div style="font-weight: bold; color: #4ECDC4;">${(data.metrics.f1_score * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        `;
        
        // Actualizar kernel display
        document.getElementById('kernelDisplay').textContent = kernel.toUpperCase();
        
        // Recargar métricas
        setTimeout(() => {
            loadMetrics();
        }, 1000);
        
    } catch (error) {
        console.error('Error training model:', error);
        const resultsDiv = document.getElementById('trainingResults');
        resultsDiv.innerHTML = `
            <div style="color: #FF6B6B; padding: 1rem;">
                <i class="fas fa-exclamation-circle"></i> Error entrenando modelo
            </div>
        `;
    } finally {
        const trainBtn = document.getElementById('trainBtn');
        if (trainBtn) {
            trainBtn.innerHTML = originalText;
            trainBtn.disabled = false;
        }
    }
}

// Actualizar valor de C
function updateCValue() {
    const slider = document.getElementById('cValue');
    const display = document.getElementById('cValueDisplay');
    if (slider && display) {
        display.textContent = slider.value;
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Cargar métricas al inicio
    loadMetrics();
    
    // Configurar eventos
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') analyzeURL();
        });
    }
    
    // Configurar slider
    const cSlider = document.getElementById('cValue');
    if (cSlider) {
        cSlider.addEventListener('input', updateCValue);
        updateCValue();
    }
    
    // Configurar kernel select
    const kernelSelect = document.getElementById('kernelSelect');
    if (kernelSelect) {
        kernelSelect.addEventListener('change', function() {
            document.getElementById('kernelDisplay').textContent = this.value.toUpperCase();
        });
    }
});
