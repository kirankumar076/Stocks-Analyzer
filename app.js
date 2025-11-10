// ==========================
// 🔗 CONFIGURATION
// ==========================
const WEBHOOK_URL = "https://avah-ungalled-brilliantly.ngrok-free.dev/webhook/7ef65165-0469-4ffd-a09c-5309080d33d4"; // <<< REPLACE THIS!


// ==========================
// 🎯 ELEMENT REFERENCES
// ==========================
const analyzeButton = document.getElementById('analyze-button');
const stockInput = document.getElementById('stock-input');
const summaryText = document.getElementById('summary-text');
const tickerDisplay = document.getElementById('ticker-display');
const financialsTable = document.getElementById('financials-table');
const summaryCard = document.getElementById('summary-card');
const redirectLinks = document.getElementById('redirect-links');


// ==========================
// 🚀 MAIN EVENT LISTENER
// ==========================
analyzeButton.addEventListener('click', async () => {
    const ticker = stockInput.value.trim().toUpperCase();

    if (!ticker) {
        alert('Please enter a stock ticker.');
        return;
    }

    // --- Show loading state ---
    tickerDisplay.textContent = ticker;
    summaryText.innerHTML = `Analyzing ${ticker}... <div class="spinner"></div>`;
    financialsTable.innerHTML = '';
    redirectLinks.innerHTML = '';
    summaryCard.classList.add('loading');

    // --- Prepare payload ---
    const payload = { ticker };

    try {
        // --- Send request to n8n ---
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`n8n HTTP error! Status: ${response.status}`);
        }

        // --- Parse response ---
        const data = await response.json();
        displayAnalysis(data);

    } catch (error) {
        console.error('Error fetching data from n8n:', error);
        summaryText.innerHTML = `⚠️ Analysis failed: ${error.message}. Please check n8n logs.`;
    } finally {
        summaryCard.classList.remove('loading');
    }
});


// ==========================
// 🧠 DISPLAY ANALYSIS DATA
// ==========================
function displayAnalysis(data) {
    // --- Handle error case ---
    if (data.error) {
        summaryText.innerHTML = `⚠️ <b>Workflow Error:</b> ${data.error}<br><br><code>${data.raw_output}</code>`;
        financialsTable.innerHTML = '';
        redirectLinks.innerHTML = '';
        return;
    }

    // --- 1️⃣ Summary Section ---
    summaryText.innerHTML = formatSummaryText(data.summary_text || 'No summary available.');

    // --- 2️⃣ Table Section ---
    displayPerformanceTable(data.performance_data || []);

    // --- 3️⃣ Links Section ---
    displayRedirectLinks(data.redirect_links || []);
}


// ==========================
// 🎨 FORMAT SUMMARY TEXT
// ==========================
function formatSummaryText(text) {
    if (!text) return 'No summary provided.';

    // Highlight profits (green) and losses (red) automatically
    return text
        .replace(/\b(\+?\d+(\.\d+)?%)\b/g, '<span style="color: green; font-weight: bold;">$1</span>')
        .replace(/\b(-\d+(\.\d+)?%)\b/g, '<span style="color: red; font-weight: bold;">$1</span>');
}


// ==========================
// 📊 DISPLAY TABLE DATA
// ==========================
function displayPerformanceTable(performanceData) {
    let tableHTML = `
        <thead>
            <tr>
                <th>Stock</th>
                <th>Price (₹)</th>
                <th>Change</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (performanceData.length === 0) {
        tableHTML += `<tr><td colspan="3">No performance data available.</td></tr>`;
    } else {
        performanceData.forEach(item => {
            // Color logic
            const colorStyle = item.color === 'green'
                ? 'style="color: green; font-weight: bold;"'
                : item.color === 'red'
                ? 'style="color: red; font-weight: bold;"'
                : 'style="color: gray;"';

            // Show formattedChange if available
            const changeDisplay = item.formattedChange || item.change;

            tableHTML += `
                <tr>
                    <td>${item.stock}</td>
                    <td>₹${parseFloat(item.price).toFixed(2)}</td>
                    <td ${colorStyle}>${changeDisplay}</td>
                </tr>
            `;
        });
    }

    tableHTML += `</tbody>`;
    financialsTable.innerHTML = tableHTML;
}


// ==========================
// 🔗 DISPLAY REDIRECT LINKS
// ==========================
function displayRedirectLinks(linksData) {
    let linksHTML = '<h5>Related Links</h5><ul>';

    if (linksData.length === 0) {
        linksHTML += `<li>No redirect links generated.</li>`;
    } else {
        linksData.forEach(link => {
            linksHTML += `<li><a href="${link.url}" target="_blank">${link.name}</a></li>`;
        });
    }

    linksHTML += '</ul>';
    redirectLinks.innerHTML = linksHTML;
}
