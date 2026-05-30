import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
)

from sklearn.model_selection import train_test_split


def compare_forecasting_models(df):

    if "Sales" not in df.columns:
        raise Exception("Sales column missing")

    df = df.copy()

    df["Index"] = range(len(df))

    X = df[["Index"]]
    y = df["Sales"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=100,
            random_state=42,
        ),
    }

    results = []

    for model_name, model in models.items():

        model.fit(X_train, y_train)

        predictions = model.predict(X_test)

        mae = mean_absolute_error(
            y_test,
            predictions,
        )

        rmse = mean_squared_error(
            y_test,
            predictions,
        ) ** 0.5

        results.append(
            {
                "model": model_name,
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
            }
        )

    results = sorted(
        results,
        key=lambda x: x["rmse"]
    )

    return {
        "best_model": results[0],
        "all_models": results,
    }