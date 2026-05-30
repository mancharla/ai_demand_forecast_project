import pandas as pd


def product_demand_recommendations(df):
    recommendations = []

    if "Product" not in df.columns or "Sales" not in df.columns:
        return recommendations

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    product_sales = (
        df.groupby("Product")["Sales"]
        .sum()
        .sort_values(ascending=False)
        .reset_index()
    )

    avg_sales = product_sales["Sales"].mean()

    for _, row in product_sales.iterrows():
        product = row["Product"]
        sales = row["Sales"]

        if sales >= avg_sales * 1.5:
            recommendation = "High demand product. Increase stock and marketing focus."
            priority = "high"
        elif sales <= avg_sales * 0.5:
            recommendation = "Low demand product. Reduce inventory and review pricing."
            priority = "low"
        else:
            recommendation = "Stable demand product. Maintain current stock level."
            priority = "medium"

        recommendations.append(
            {
                "product": product,
                "total_sales": round(float(sales), 2),
                "priority": priority,
                "recommendation": recommendation,
            }
        )

    return recommendations


def customer_buying_behavior_analysis(df):
    insights = []

    if "Category" in df.columns and "Sales" in df.columns:
        category_sales = (
            df.groupby("Category")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        if not category_sales.empty:
            top_category = category_sales.index[0]
            insights.append(
                f"Customers show strongest buying behavior in {top_category} category."
            )

    if "Region" in df.columns and "Sales" in df.columns:
        region_sales = (
            df.groupby("Region")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        if not region_sales.empty:
            top_region = region_sales.index[0]
            insights.append(
                f"Highest customer demand is observed in {top_region} region."
            )

    if "Date" in df.columns and "Sales" in df.columns:
        temp_df = df.copy()
        temp_df["Date"] = pd.to_datetime(
            temp_df["Date"],
            errors="coerce",
        )

        temp_df = temp_df.dropna(subset=["Date"])

        if not temp_df.empty:
            temp_df["Month"] = temp_df["Date"].dt.month_name()

            monthly_sales = (
                temp_df.groupby("Month")["Sales"]
                .sum()
                .sort_values(ascending=False)
            )

            if not monthly_sales.empty:
                peak_month = monthly_sales.index[0]
                insights.append(
                    f"Customer buying activity peaks in {peak_month}."
                )

    return insights


def demand_spike_prediction(df):
    spikes = []

    if "Product" not in df.columns or "Sales" not in df.columns:
        return spikes

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    product_sales = (
        df.groupby("Product")["Sales"]
        .sum()
        .reset_index()
    )

    mean_sales = product_sales["Sales"].mean()
    std_sales = product_sales["Sales"].std()

    threshold = mean_sales + std_sales

    for _, row in product_sales.iterrows():
        if row["Sales"] >= threshold:
            spikes.append(
                {
                    "product": row["Product"],
                    "sales": round(float(row["Sales"]), 2),
                    "risk": "Demand Spike Expected",
                    "suggestion": "Prepare additional inventory and supplier backup.",
                }
            )

    return spikes


def low_stock_prediction(df):
    risks = []

    if "Product" not in df.columns or "Sales" not in df.columns:
        return risks

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    product_sales = (
        df.groupby("Product")["Sales"]
        .sum()
        .reset_index()
    )

    avg_sales = product_sales["Sales"].mean()

    for _, row in product_sales.iterrows():
        if row["Sales"] >= avg_sales:
            risks.append(
                {
                    "product": row["Product"],
                    "predicted_demand": round(float(row["Sales"]), 2),
                    "stock_risk": "Possible Low Stock Risk",
                    "suggestion": "Increase safety stock before next demand cycle.",
                }
            )

    return risks


def inventory_optimization_suggestions(df):
    suggestions = []

    if "Product" not in df.columns or "Sales" not in df.columns:
        return suggestions

    df["Sales"] = pd.to_numeric(
        df["Sales"],
        errors="coerce",
    ).fillna(0)

    product_sales = (
        df.groupby("Product")["Sales"]
        .sum()
        .reset_index()
    )

    avg_sales = product_sales["Sales"].mean()

    for _, row in product_sales.iterrows():
        product = row["Product"]
        sales = row["Sales"]

        if sales > avg_sales:
            action = "Increase reorder quantity"
        else:
            action = "Maintain or reduce reorder quantity"

        suggestions.append(
            {
                "product": product,
                "sales": round(float(sales), 2),
                "inventory_action": action,
            }
        )

    return suggestions