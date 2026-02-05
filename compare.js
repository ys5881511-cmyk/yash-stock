// ===============================
// READ SYMBOLS FROM URL
// ===============================
const params = new URLSearchParams(window.location.search);
const stockA = params.get("A");
const stockB = params.get("B");

if (!stockA || !stockB) {
    alert("Stock symbols missing in URL");
}

// ===============================
// SET PAGE HEADERS
// ===============================
document.getElementById("stockA").innerText = stockA;
document.getElementById("stockB").innerText = stockB;

const tableBody = document.getElementById("compareTable");
tableBody.innerHTML = "";   // clear old rows if any

// ===============================
// HELPER FUNCTION TO ADD ROW
// ===============================
function addRow(label, valueA, valueB) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><strong>${label}</strong></td>
        <td>${valueA}</td>
        <td>${valueB}</td>
    `;
    tableBody.appendChild(tr);
}

// ===============================
// FETCH BOTH STOCKS (NO CACHE)
// ===============================
Promise.all([
    fetch(`/predict?nocache=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: stockA })
    }).then(res => res.json()),

    fetch(`/predict?nocache=${Date.now() + 1}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: stockB })
    }).then(res => res.json())
])
.then(([dataA, dataB]) => {

    // ===============================
    // BASIC DATA
    // ===============================
    addRow("Latest Price", dataA.latest_price, dataB.latest_price);
    addRow("Trend (SMA)", dataA.trend_prediction, dataB.trend_prediction);
    addRow("ML Prediction", dataA.ml_prediction, dataB.ml_prediction);
    addRow("Recommendation", dataA.recommendation, dataB.recommendation);
    addRow("Confidence (%)", dataA.confidence, dataB.confidence);

})
.catch(error => {
    console.error("Comparison error:", error);
    alert("Error loading comparison data");
});
