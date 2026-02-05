import yfinance as yf
import pandas as pd
from sklearn.ensemble import RandomForestClassifier


# =========================================
# FETCH DATA (NO CACHE, SAFE FOR COMPARISON)
# =========================================
def fetch_data(symbol: str, period="6mo", interval="1d") -> pd.DataFrame:
    """
    Fetch historical OHLC data safely using yf.Ticker
    This avoids caching issues when comparing stocks
    """
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            return pd.DataFrame()

        df = df.reset_index()
        return df

    except Exception:
        return pd.DataFrame()


# =========================================
# FEATURE ENGINEERING FOR ML
# =========================================
def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["Return"] = df["Close"].pct_change()
    df["MA_5"] = df["Close"].rolling(5).mean()
    df["MA_10"] = df["Close"].rolling(10).mean()
    df["Volatility"] = df["Return"].rolling(10).std()

    # Target: next day up or down
    df["Target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)

    df = df.dropna()
    return df


# =========================================
# ML DIRECTION PREDICTION
# =========================================
def ml_predict_direction(symbol: str) -> str:
    df = fetch_data(symbol, period="1y", interval="1d")

    if df.empty or len(df) < 40:
        return "NOT_ENOUGH_DATA"

    df = add_features(df)

    if len(df) < 30:
        return "NOT_ENOUGH_DATA"

    features = ["Return", "MA_5", "MA_10", "Volatility"]
    X = df[features]
    y = df["Target"]

    model = RandomForestClassifier(
        n_estimators=120,
        random_state=42
    )

    # Train on all except last row
    model.fit(X.iloc[:-1], y.iloc[:-1])

    last_features = X.iloc[[-1]]
    prediction = model.predict(last_features)[0]

    return "UP" if prediction == 1 else "DOWN"


# =========================================
# TREND PREDICTION (SMA CROSSOVER)
# =========================================
def trend_predict(df: pd.DataFrame) -> str:
    if df.empty or len(df) < 60:
        return "NOT_ENOUGH_DATA"

    df = df.copy()

    df["SMA_20"] = df["Close"].rolling(20).mean()
    df["SMA_50"] = df["Close"].rolling(50).mean()

    last_20 = df["SMA_20"].iloc[-1]
    last_50 = df["SMA_50"].iloc[-1]

    if pd.isna(last_20) or pd.isna(last_50):
        return "NOT_ENOUGH_DATA"

    return "UP" if last_20 > last_50 else "DOWN"
