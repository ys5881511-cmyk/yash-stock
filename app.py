from flask import Flask, render_template, request, jsonify
import pandas as pd
from model import fetch_data, trend_predict, ml_predict_direction

app = Flask(__name__)


# ---------------- HOME PAGE ----------------
@app.route("/")
def home():
    return render_template("index.html")


# ---------------- RESULT PAGE ----------------
@app.route("/result")
def result():
    return render_template("result.html")


# ---------------- COMPARE PAGE ----------------
@app.route("/compare")
def compare():
    return render_template("compare.html")


# ---------------- SEARCH API ----------------
@app.route("/search", methods=["GET"])
def search_company():
    import requests

    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}"

    try:
        res = requests.get(url, timeout=5)
        data = res.json()

        results = []
        for item in data.get("quotes", []):
            if item.get("quoteType") != "EQUITY":
                continue

            symbol = item.get("symbol")
            name = item.get("shortname", "")

            if symbol:
                results.append({
                    "symbol": symbol,
                    "name": name
                })

        return jsonify(results[:8])

    except Exception:
        return jsonify([])


# ---------------- MAIN PREDICTION API ----------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    symbol = data.get("symbol", "").strip()

    if not symbol:
        return jsonify({"error": "No symbol provided"}), 400

    # -------- FETCH DATA --------
    df = fetch_data(symbol, period="6mo", interval="1d")
    if df.empty:
        return jsonify({"error": "Data not available"}), 400

    # -------- TREND & ML --------
    trend = trend_predict(df)
    ml_dir = ml_predict_direction(symbol)

    # -------- PRICE INFO --------
    latest_price = float(df["Close"].iloc[-1])
    prev_price = float(df["Close"].iloc[-2]) if len(df) > 1 else latest_price

    change = latest_price - prev_price
    change_pct = (change / prev_price * 100) if prev_price != 0 else 0

    # -------- CHART DATA --------
    df_chart = df.tail(90).copy()
    df_chart["Date"] = pd.to_datetime(df_chart["Date"])
    df_chart = df_chart.dropna()

    chart = {
        "dates": df_chart["Date"].dt.strftime("%Y-%m-%d").tolist(),
        "open": df_chart["Open"].round(2).tolist(),
        "high": df_chart["High"].round(2).tolist(),
        "low": df_chart["Low"].round(2).tolist(),
        "close": df_chart["Close"].round(2).tolist(),
    }

    # -------- RECOMMENDATION LOGIC --------
    if trend == "UP" and ml_dir == "UP":
        recommendation = "STRONG BUY"
        confidence = 75
        reason = [
            "Trend is bullish",
            "ML model predicts upward movement"
        ]
    elif trend == "DOWN" and ml_dir == "DOWN":
        recommendation = "STRONG SELL"
        confidence = 75
        reason = [
            "Trend is bearish",
            "ML model predicts downward movement"
        ]
    else:
        recommendation = "HOLD"
        confidence = 50
        reason = [
            "Trend and ML prediction are not aligned"
        ]

    # -------- EXPLAINABLE AI --------
    explanation = []

    if trend == "UP":
        explanation.append("Short-term trend is bullish based on moving averages")
    else:
        explanation.append("Short-term trend is bearish based on moving averages")

    if ml_dir == "UP":
        explanation.append("ML model detected positive price momentum")
    else:
        explanation.append("ML model detected negative price momentum")

    explanation.append("Historical volatility and price behavior were considered")

    # -------- RESPONSE --------
    return jsonify({
        "symbol": symbol.upper(),
        "latest_price": round(latest_price, 2),
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "trend_prediction": trend,
        "ml_prediction": ml_dir,
        "recommendation": recommendation,
        "confidence": confidence,
        "reason": reason,
        "explanation": explanation,
        "chart": chart
    })


# ---------------- RUN APP ----------------
if __name__ == "__main__":
    app.run(debug=True)
