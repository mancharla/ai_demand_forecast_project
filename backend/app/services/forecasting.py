import numpy as np
import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


def prepare_forecast_data(df: pd.DataFrame):
    df = df.copy()

    if "Date" not in df.columns:
        raise ValueError("Date column is required")

    if "Sales" not in df.columns:
        raise ValueError("Sales column is required")

    if "Product" not in df.columns:
        raise ValueError("Product column is required")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Sales"] = pd.to_numeric(df["Sales"], errors="coerce")

    df = df.dropna(subset=["Date", "Sales", "Product"])

    df["year"] = df["Date"].dt.year
    df["month"] = df["Date"].dt.month
    df["day"] = df["Date"].dt.day
    df["dayofweek"] = df["Date"].dt.dayofweek

    df["product_code"] = df["Product"].astype("category").cat.codes

    if "Region" in df.columns:
        df["region_code"] = df["Region"].astype("category").cat.codes
    else:
        df["region_code"] = 0

    if "Category" in df.columns:
        df["category_code"] = df["Category"].astype("category").cat.codes
    else:
        df["category_code"] = 0

    features = [
        "year",
        "month",
        "day",
        "dayofweek",
        "product_code",
        "region_code",
        "category_code",
    ]

    return df, features


def calculate_mape(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    non_zero = y_true != 0

    if non_zero.sum() == 0:
        return 0

    return float(
        np.mean(
            np.abs(
                (y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero]
            )
        )
        * 100
    )


def train_and_compare_models(df: pd.DataFrame):
    df, features = prepare_forecast_data(df)

    if len(df) < 5:
        raise ValueError("Dataset needs at least 5 valid rows")

    X = df[features]
    y = df["Sales"]

    split_index = int(len(df) * 0.8)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]
    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=100,
            random_state=42,
        ),
    }

    comparison = []
    best_model = None
    best_model_name = None
    best_rmse = float("inf")

    for model_name, model in models.items():
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mape = calculate_mape(y_test, y_pred)

        comparison.append(
            {
                "model_name": model_name,
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "mape": round(mape, 2),
            }
        )

        if rmse < best_rmse:
            best_rmse = rmse
            best_model = model
            best_model_name = model_name

    return {
        "df": df,
        "features": features,
        "best_model": best_model,
        "best_model_name": best_model_name,
        "model_comparison": comparison,
    }


def generate_product_forecast(df: pd.DataFrame, forecast_days: int = 30):
    result = train_and_compare_models(df)

    prepared_df = result["df"]
    features = result["features"]
    best_model = result["best_model"]
    best_model_name = result["best_model_name"]
    comparison = result["model_comparison"]

    latest_date = prepared_df["Date"].max()

    products = prepared_df["Product"].unique()

    forecasts = []

    for product in products:
        product_rows = prepared_df[prepared_df["Product"] == product]

        if product_rows.empty:
            continue

        latest_row = product_rows.iloc[-1]

        future_sales = []

        for i in range(1, forecast_days + 1):
            future_date = latest_date + pd.Timedelta(days=i)

            row = {
                "year": future_date.year,
                "month": future_date.month,
                "day": future_date.day,
                "dayofweek": future_date.dayofweek,
                "product_code": latest_row["product_code"],
                "region_code": latest_row["region_code"],
                "category_code": latest_row["category_code"],
            }

            future_df = pd.DataFrame([row])

            prediction = best_model.predict(future_df[features])[0]
            future_sales.append(max(0, float(prediction)))

        total_prediction = round(sum(future_sales), 2)

        forecasts.append(
            {
                "product": str(product),
                "predicted_sales": total_prediction,
                "model_used": best_model_name,
            }
        )

    forecasts = sorted(
        forecasts,
        key=lambda x: x["predicted_sales"],
        reverse=True,
    )

    # Attach model-level accuracy metrics to each product forecast so frontend can
    # display `accuracy.mae`, `accuracy.rmse`, and `accuracy.mape` per item.
    metrics_map = {
        mc.get("model_name"): {
            "mae": mc.get("mae", 0),
            "rmse": mc.get("rmse", 0),
            "mape": mc.get("mape", 0),
        }
        for mc in comparison
    }

    for item in forecasts:
        item_model = item.get("model_used")
        item["accuracy"] = metrics_map.get(item_model, {"mae": 0, "rmse": 0, "mape": 0})

    return {
        "product_forecasts": forecasts,
        "top_demand_product": forecasts[0]["product"] if forecasts else None,
        "model_used": best_model_name,
        "model_comparison": comparison,
    }