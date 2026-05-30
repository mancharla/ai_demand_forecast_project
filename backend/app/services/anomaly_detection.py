import pandas as pd


def detect_sales_anomalies(df: pd.DataFrame):
    """
    Detect unusual sales patterns using IQR method.
    """

    if "Sales" not in df.columns:
        return []

    df = df.copy()
    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce"
    ).fillna(0)

    q1 = df["Sales"].quantile(0.25)
    q3 = df["Sales"].quantile(0.75)

    iqr = q3 - q1

    lower_bound = q1 - (1.5 * iqr)
    upper_bound = q3 + (1.5 * iqr)

    anomalies = df[
        (df["Sales"] < lower_bound)
        | (df["Sales"] > upper_bound)
    ]

    result = []

    for _, row in anomalies.iterrows():
        result.append(
            {
                "date": str(row.get("Date", "N/A")),
                "product": str(row.get("Product", "N/A")),
                "region": str(row.get("Region", "N/A")),
                "sales": float(row.get("Sales", 0)),
                "reason": "Sales value is significantly higher or lower than normal",
            }
        )

    return result