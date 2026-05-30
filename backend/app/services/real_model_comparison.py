import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

from xgboost import XGBRegressor


def calculate_metrics(y_true, y_pred):
    mae = round(mean_absolute_error(y_true, y_pred), 2)

    rmse = round(
        np.sqrt(mean_squared_error(y_true, y_pred)),
        2,
    )

    y_true_safe = np.where(y_true == 0, 1, y_true)

    mape = round(
        np.mean(np.abs((y_true_safe - y_pred) / y_true_safe)) * 100,
        2,
    )

    accuracy = round(max(0, 100 - mape), 2)

    return {
        "mae": mae,
        "rmse": rmse,
        "mape": mape,
        "accuracy": accuracy,
    }


def prepare_ml_data(df):
    df = df.copy()

    if "Sales" not in df.columns:
        raise ValueError("Sales column is required")

    df["Sales"] = pd.to_numeric(df["Sales"], errors="coerce")
    df = df.dropna(subset=["Sales"])

    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        df["month"] = df["Date"].dt.month.fillna(1)
        df["year"] = df["Date"].dt.year.fillna(2025)
        df["day"] = df["Date"].dt.day.fillna(1)

    for col in ["Product", "Category", "Region"]:
        if col in df.columns:
            encoder = LabelEncoder()
            df[col] = encoder.fit_transform(df[col].astype(str))

    feature_columns = []

    for col in ["Product", "Category", "Region", "month", "year", "day"]:
        if col in df.columns:
            feature_columns.append(col)

    if not feature_columns:
        raise ValueError(
            "Need Product, Category, Region, or Date columns"
        )

    X = df[feature_columns]
    y = df["Sales"]

    return X, y


def compare_real_models(df):
    X, y = prepare_ml_data(df)

    if len(X) < 10:
        raise ValueError("At least 10 rows are required")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=50,
            random_state=42,
        ),
        "XGBoost": XGBRegressor(
            n_estimators=50,
            learning_rate=0.1,
            max_depth=3,
            random_state=42,
            objective="reg:squarederror",
        ),
    }

    results = []

    for model_name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        metrics = calculate_metrics(y_test.values, y_pred)

        results.append(
            {
                "model": model_name,
                "mae": metrics["mae"],
                "rmse": metrics["rmse"],
                "mape": metrics["mape"],
                "accuracy": metrics["accuracy"],
            }
        )

    results = sorted(results, key=lambda item: item["rmse"])

    return {
        "best_model": results[0],
        "models": results,
    }