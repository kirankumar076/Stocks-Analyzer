const WEBHOOK_URL = "https://avah-ungalled-brilliantly.ngrok-free.dev/webhook/7ef65165-0469-4ffd-a09c-5309080d33d4"; // <<< REPLACE THIS!

const analyzeButton = document.getElementById('analyze-button');
const stockInput = document.getElementById('stock-input');
const tickerDisplay = document.getElementById('ticker-display');
const financialsTable = document.getElementById('financials-table');
const redirectLinksDiv = document.getElementById('redirect-links');
const summaryCard = document.getElementById('summary-card');
const summaryText = document.getElementById('summary-text'); // For optional AI-generated text

// Key Metrics Grid Elements
const currentPriceSpan = document.getElementById('current-price');
const metricChangeSpan = document.getElementById('metric-change');
const peRatioSpan = document.getElementById('pe-ratio');
const rsiValueSpan = document.getElementById('rsi-value');
const volumeValueSpan = document.getElementById('volume-value');
const rsiInfoSpan = document.getElementById('rsi-info');


analyzeButton.addEventListener('click', async () => {
    const ticker = stockInput.value.trim().toUpperCase();

    if (!ticker) {
        alert('Please enter a stock ticker.');
        return;
    }
    
    // 1. Initial State Setup
    tickerDisplay.textContent = ticker;
    summaryText.innerHTML = `<p>Analyzing ${ticker}...</p><div class="spinner"></div>`;
    financialsTable.innerHTML = '';
    redirectLinksDiv.innerHTML = '<h2 class="card-title">Access Links</h2><ul><li>Loading...</li></ul>';
    
    // Reset Key Metrics to loading
    document.querySelectorAll('.metric-value').forEach(span => span.textContent = 'Loading...');
    metricChangeSpan.textContent = '';
    
    summaryCard.classList.add('loading');
    
    const payload = { ticker };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`n8n HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        displayAnalysis(data);

    } catch (error) {
        console.error('Error fetching data from n8n:', error);
        summaryText.innerHTML = `⚠️ Analysis failed: ${error.message}. back-end server is offline.`;
        // Handle error display in metrics
        currentPriceSpan.textContent = 'Failed';
        metricChangeSpan.textContent = '';
        peRatioSpan.textContent = 'N/A';
        rsiValueSpan.textContent = 'N/A';
        volumeValueSpan.textContent = 'N/A';
    } finally {
        summaryCard.classList.remove('loading');
    }
});

// Main Display Dispatcher
function displayAnalysis(data) {
    if (data.error) {
        summaryText.innerHTML = `⚠️ <b>Workflow Error:</b> ${data.error}`;
        financialsTable.innerHTML = '';
        redirectLinksDiv.innerHTML = '<h2 class="card-title">Access Links</h2><ul><li>Error</li></ul>';
        return;
    }
    
    // Display the AI-generated paragraph text below the metrics grid
    summaryText.innerHTML = data.summary_text || 'No detailed summary available.';
    
    displayKeyMetrics(data.key_metrics || {}); 
    displayKeyFinancials(data.financials_data || []); 
    displayRedirectLinks(data.redirect_links || []);
    displayNewsText(data.news || []);
}

// ---------------------------------------------------
// 2. NEW FUNCTION: Populates the Key Metrics Grid
// ---------------------------------------------------
function displayKeyMetrics(metrics) {
    // --- Current Price & Change ---
    const price = metrics.price ? parseFloat(metrics.price).toFixed(2) : 'N/A';
    const change = metrics.formattedChange || metrics.change || 'N/A';
    
    currentPriceSpan.textContent = price !== 'N/A' ? `₹${price}` : price;

    // Determine change class
    const isPositive = (change && change.includes('+'));
    const changeClass = change !== 'N/A' ? (isPositive ? 'positive' : 'negative') : '';
    
    metricChangeSpan.textContent = change;
    metricChangeSpan.className = `metric-change ${changeClass}`;
    
    // --- P/E Ratio ---
    const pe = metrics.pe_ratio ? parseFloat(metrics.pe_ratio).toFixed(2) : 'N/A';
    peRatioSpan.textContent = pe;

    // --- RSI ---
    const rsi = metrics.rsi ? parseFloat(metrics.rsi).toFixed(2) : 'N/A';
    rsiValueSpan.textContent = rsi;
    
    let rsiLabel = '(Momentum)';
    if (rsi !== 'N/A') {
        if (rsi > 70) {
            rsiLabel = '(Overbought)';
        } else if (rsi < 30) {
            rsiLabel = '(Oversold)';
        } else {
            rsiLabel = '(Neutral)';
        }
    }
    rsiInfoSpan.textContent = rsiLabel;
    
    // --- Volume ---
    volumeValueSpan.textContent = metrics.volume || 'N/A';
}

// ---------------------------------------------------
// 3. UPDATED FUNCTION: Display Key Financials (The table)
// ---------------------------------------------------
function displayKeyFinancials(financialsData) {
    let tableHTML = `
        <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (!financialsData || financialsData.length === 0) {
        tableHTML += `<tr><td colspan="2">No key financial data available.</td></tr>`;
    } else {
        financialsData.forEach(item => {
            tableHTML += `
                <tr>
                    <td><b>${item.metric}</b></td>
                    <td>${item.value}</td>
                </tr>
            `;
        });
    }

    tableHTML += `</tbody>`;
    financialsTable.innerHTML = tableHTML;
}

// ---------------------------------------------------
// 4. FUNCTION: Display Redirect Links
// ---------------------------------------------------
function displayRedirectLinks(linksData) {
    let linksHTML = '<h2 class="card-title">Access Links</h2><ul>';

    if (linksData.length === 0) {
        linksHTML += `<li>No redirect links generated.</li>`;
    } else {
        linksData.forEach(link => {
            linksHTML += `<li><a href="${link.url}" target="_blank">${link.name}</a></li>`;
        });
    }

    linksHTML += '</ul>';
    redirectLinksDiv.innerHTML = linksHTML;
}

// ---------------------------------------------------
// 5. FUNCTION: Display News Text
// ---------------------------------------------------
function displayNewsText(newsData) {
    const newsDiv = document.getElementById("news-text");
    
    if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
        newsDiv.innerHTML = "<p>No news available.</p>";
        return;
    }

    const listItems = newsData.map(item => {
        let text = item.news || "No headline provided";
        const url = item.url || "#";

        // Clean up the text
        text = text.replace(/^•\s*/, '').trim();

        return `
            <li class="news-item">
                <p>${text}</p>
                <a href="${url}" target="_blank" class="read-source-link">
                    Read Source ↗
                </a>
            </li>
        `;
    }).join("");

    newsDiv.innerHTML = `<ul>${listItems}</ul>`;
}

