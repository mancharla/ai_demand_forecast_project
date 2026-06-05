import os
import pandas as pd


def load_project_datasets(project_datasets):
    frames = []

    for item in project_datasets:
        dataset = item.dataset

        if not dataset:
            continue

        file_path = os.path.join("uploads", dataset.filename)

        if not os.path.exists(file_path):
            continue

        if dataset.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        frames.append(df)

    if not frames:
        return None

    df = pd.concat(frames, ignore_index=True)

    if "Sales" in df.columns:
        df["Sales"] = pd.to_numeric(df["Sales"], errors="coerce").fillna(0)

    if "Profit" in df.columns:
        df["Profit"] = pd.to_numeric(df["Profit"], errors="coerce").fillna(0)

    if "Discount" in df.columns:
        df["Discount"] = pd.to_numeric(df["Discount"], errors="coerce").fillna(0)

    return df


def generate_ai_insights_from_dataframe(df):
    insights = []

    if df is None or df.empty:
        return insights

    if "Product" in df.columns and "Sales" in df.columns:
        product_sales = df.groupby("Product")["Sales"].sum().sort_values(ascending=False)

        top_product = product_sales.index[0]
        top_sales = product_sales.iloc[0]

        insights.append({
            "insight_type": "opportunity",
            "title": f"High demand opportunity: {top_product}",
            "description": f"{top_product} generated the highest sales of ₹{top_sales:,.2f}.",
            "confidence_score": 0.92,
            "impact_level": "high",
            "recommended_action": f"Increase inventory and marketing focus for {top_product}.",
        })

        low_product = product_sales.index[-1]
        low_sales = product_sales.iloc[-1]

        insights.append({
            "insight_type": "risk",
            "title": f"Declining product risk: {low_product}",
            "description": f"{low_product} has the lowest sales of ₹{low_sales:,.2f}.",
            "confidence_score": 0.84,
            "impact_level": "medium",
            "recommended_action": f"Review pricing, promotion, or stock strategy for {low_product}.",
        })

    if "Region" in df.columns and "Sales" in df.columns:
        region_sales = df.groupby("Region")["Sales"].sum().sort_values(ascending=False)
        top_region = region_sales.index[0]
        top_region_sales = region_sales.iloc[0]

        insights.append({
            "insight_type": "trend",
            "title": f"Strong regional performance: {top_region}",
            "description": f"{top_region} is the strongest region with ₹{top_region_sales:,.2f} in sales.",
            "confidence_score": 0.89,
            "impact_level": "high",
            "recommended_action": f"Allocate more stock and sales campaigns to {top_region}.",
        })

    if "Category" in df.columns and "Profit" in df.columns:
        category_profit = df.groupby("Category")["Profit"].sum().sort_values(ascending=False)
        best_category = category_profit.index[0]
        best_profit = category_profit.iloc[0]

        insights.append({
            "insight_type": "recommendation",
            "title": f"Most profitable category: {best_category}",
            "description": f"{best_category} contributed the highest profit of ₹{best_profit:,.2f}.",
            "confidence_score": 0.88,
            "impact_level": "high",
            "recommended_action": f"Prioritize procurement and promotion for {best_category}.",
        })

    if "Discount" in df.columns and "Profit" in df.columns:
        avg_discount = df["Discount"].mean()
        total_profit = df["Profit"].sum()

        if avg_discount > 20:
            insights.append({
                "insight_type": "risk",
                "title": "High discount risk detected",
                "description": f"Average discount is {avg_discount:.2f}%, which may reduce profitability.",
                "confidence_score": 0.81,
                "impact_level": "medium",
                "recommended_action": "Reduce discounts on high-demand products and protect profit margins.",
            })
        else:
            insights.append({
                "insight_type": "recommendation",
                "title": "Discount strategy is under control",
                "description": f"Average discount is {avg_discount:.2f}% with total profit of ₹{total_profit:,.2f}.",
                "confidence_score": 0.78,
                "impact_level": "low",
                "recommended_action": "Continue monitoring discount impact on profit.",
            })

    return insights