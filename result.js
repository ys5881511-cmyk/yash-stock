const params = new URLSearchParams(window.location.search);
const symbol = params.get("symbol");

const loader = document.getElementById("loader");
const chartDiv = document.getElementById("chart");

const liveSymbol = document.getElementById("liveSymbol");
const livePrice = document.getElementById("livePrice");
const liveChange = document.getElementById("liveChange");

const trendResult = document.getElementById("trendResult");
const mlResult = document.getElementById("mlResult");
const recText = document.getElementById("recommendationText");
const confText = document.getElementById("confidenceText");
const reasonList = document.getElementById("reasonList");

if (!symbol) {
    alert("No stock symbol provided");
}

loader.style.display = "block";

// -------- FETCH PREDICTION --------
fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol })
})
.then(res => res.json())
.then(data => {
    loader.style.display = "none";

    // Basic info
    liveSymbol.innerText = data.symbol;
    livePrice.innerText = "₹ " + data.latest_price;
    liveChange.innerText = `${data.change} (${data.change_pct}%)`;
    liveChange.style.color = data.change >= 0 ? "#4cd137" : "#e84118";

    trendResult.innerText = "Trend (SMA): " + data.trend_prediction;
    mlResult.innerText = "ML Prediction: " + data.ml_prediction;

    // Recommendation
    recText.innerText = data.recommendation;
    confText.innerText = data.confidence;

    recText.className = "";
    if (data.recommendation.includes("BUY")) {
        recText.classList.add("buy");
    } else if (data.recommendation.includes("SELL")) {
        recText.classList.add("sell");
    } else {
        recText.classList.add("hold");
    }

    // Reasons
    reasonList.innerHTML = "";
    data.reason.forEach(r => {
        const li = document.createElement("li");
        li.innerText = r;
        reasonList.appendChild(li);
    });
    // Explainable AI output
const explainList = document.getElementById("explainList");
explainList.innerHTML = "";

data.explanation.forEach(e => {
    const li = document.createElement("li");
    li.innerText = e;
    explainList.appendChild(li);
});


    // Candlestick chart
    Plotly.newPlot(chartDiv, [{
        x: data.chart.dates,
        open: data.chart.open,
        high: data.chart.high,
        low: data.chart.low,
        close: data.chart.close,
        type: "candlestick",
        increasing: { line: { color: "#26a69a" } },
        decreasing: { line: { color: "#ef5350" } }
    }], {
        margin: { t: 30 }
    });
})
.catch(err => {
    loader.style.display = "none";
    alert("Error loading stock data");
});
