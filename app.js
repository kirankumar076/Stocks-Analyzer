
const WEBHOOK_URL = "https://avah-ungalled-brilliantly.ngrok-free.dev/webhook/7ef65165-0469-4ffd-a09c-5309080d33d4"; // <<< REPLACE THIS!

const analyzeButton = document.getElementById('analyze-button');
const stockInput = document.getElementById('stock-input');
const summaryText = document.getElementById('summary-text');
const tickerDisplay = document.getElementById('ticker-display');
const financialsTable = document.getElementById('financials-table');
const summaryCard = document.getElementById('summary-card');
const redirectLinks = document.getElementById('redirect-links');

analyzeButton.addEventListener('click', async () => {
    const ticker = stockInput.value.trim().toUpperCase();

    if (!ticker) {
        alert('Please enter a stock ticker.');
        return;
    }
    tickerDisplay.textContent = ticker;
    summaryText.innerHTML = `Analyzing ${ticker}... <div class="spinner"></div>`;
    financialsTable.innerHTML = '';
    redirectLinks.innerHTML = '';
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
        summaryText.innerHTML = `⚠️ Analysis failed: ${error.message}. Please check n8n logs.`;
    } finally {
        summaryCard.classList.remove('loading');
    }
});

function displayAnalysis(data) {
    if (data.error) {
        summaryText.innerHTML = `⚠️ <b>Workflow Error:</b> ${data.error}<br><br><code>${data.raw_output}</code>`;
        financialsTable.innerHTML = '';
        redirectLinks.innerHTML = '';
        return;
    }
    summaryText.innerHTML = formatSummaryText(data.summary_text || 'No summary available.');
    displayPerformanceTable(data.performance_data || []);
    displayRedirectLinks(data.redirect_links || []);
    displayNewsText(data.news || '');
}
function formatSummaryText(text) {
    if (!text) return 'No summary provided.';
    
    return text; 
}
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
            const colorStyle = item.color === 'green'
                ? 'style="color: green; font-weight: bold;"'
                : item.color === 'red'
                ? 'style="color: red; font-weight: bold;"'
                : 'style="color: gray;"';
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
function displayNewsText(newsData) {
    const newsDiv = document.getElementById("news-text");
    if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
        newsDiv.innerHTML = "<p>No news available.</p>";
        return;
    }
    const listItems = newsData.map(item => {
        let text = item.news || "No headline provided";
        const url = item.url || "#";
        text = text.replace(/^•\s*/, '').trim();
        return `
            <li style="margin-bottom: 12px;">
                <span>${text}</span>
                <br>
                <a href="${url}" target="_blank" style="font-size: 0.85em; color: #007bff; text-decoration: none;">
                    Read Source ↗
                </a>
            </li>
        `;
    }).join("");

    newsDiv.innerHTML = `<ul>${listItems}</ul>`;
}


