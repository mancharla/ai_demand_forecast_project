import pandas as pd


def detect_seasonal_trends(df: pd.DataFrame):
    """
    Detect monthly and quarterly sales trends.
    """

    if "Date" not in df.columns or "Sales" not in df.columns:
        return {
            "monthly_trends": [],
            "quarterly_trends": [],
            "message": "Date and Sales columns are required",
        }

    df = df.copy()

    df["Date"] = pd.to_datetime(
        df["Date"],
        errors="coerce"
    )

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce"
    ).fillna(0)

    df = df.dropna(subset=["Date"])

    df["month"] = df["Date"].dt.strftime("%B")
    df["month_number"] = df["Date"].dt.month
    df["quarter"] = "Q" + df["Date"].dt.quarter.astype(str)

    monthly = (
        df.groupby(["month_number", "month"])["Sales"]
        .sum()
        .reset_index()
        .sort_values("month_number")
    )

    quarterly = (
        df.groupby("quarter")["Sales"]
        .sum()
        .reset_index()
    )

    return {
        "monthly_trends": [
            {
                "month": row["month"],
                "sales": round(float(row["Sales"]), 2),
            }
            for _, row in monthly.iterrows()
        ],
        "quarterly_trends": [
            {
                "quarter": row["quarter"],
                "sales": round(float(row["Sales"]), 2),
            }
            for _, row in quarterly.iterrows()
        ],
        "best_month": (
            monthly.sort_values("Sales", ascending=False)
            .iloc[0]["month"]
            if not monthly.empty
            else "N/A"
        ),
        "best_quarter": (
            quarterly.sort_values("Sales", ascending=False)
            .iloc[0]["quarter"]
            if not quarterly.empty
            else "N/A"
        ),
    }