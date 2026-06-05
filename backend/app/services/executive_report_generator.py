import os
import pandas as pd


def load_project_data(project_datasets):
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

    for column in ["Sales", "Profit", "Price", "Quantity", "Discount"]:
        if column in df.columns:
            df[column] = pd.to_numeric(df[column], errors="coerce").fillna(0)

    return df


def generate_report_sections(df, insights):
    total_revenue = float(df["Sales"].sum()) if "Sales" in df.columns else 0
    total_profit = float(df["Profit"].sum()) if "Profit" in df.columns else 0
    total_quantity = float(df["Quantity"].sum()) if "Quantity" in df.columns else 0
    avg_discount = float(df["Discount"].mean()) if "Discount" in df.columns else 0

    top_product = "N/A"
    top_region = "N/A"
    top_category = "N/A"

    if "Product" in df.columns and "Sales" in df.columns:
        top_product = df.groupby("Product")["Sales"].sum().idxmax()

    if "Region" in df.columns and "Sales" in df.columns:
        top_region = df.groupby("Region")["Sales"].sum().idxmax()

    if "Category" in df.columns and "Sales" in df.columns:
        top_category = df.groupby("Category")["Sales"].sum().idxmax()

    revenue_forecast = {
        "current_revenue": round(total_revenue, 2),
        "forecast_revenue": round(total_revenue * 1.12, 2),
        "growth_percentage": 12,
        "top_revenue_product": top_product,
        "top_revenue_region": top_region,
    }

    profit_forecast = {
        "current_profit": round(total_profit, 2),
        "forecast_profit": round(total_profit * 1.10, 2),
        "profit_growth_percentage": 10,
        "profit_margin_percentage": round((total_profit / total_revenue) * 100, 2)
        if total_revenue else 0,
    }

    cost_analysis = {
        "estimated_cost": round(total_revenue - total_profit, 2),
        "average_discount": round(avg_discount, 2),
        "quantity_sold": round(total_quantity, 2),
        "cost_control_note": "Monitor discount-heavy products to protect profitability.",
    }

    kpi_summary = {
        "total_revenue": round(total_revenue, 2),
        "total_profit": round(total_profit, 2),
        "total_quantity": round(total_quantity, 2),
        "top_product": top_product,
        "top_region": top_region,
        "top_category": top_category,
    }

    key_findings = [
        f"{top_product} is the highest revenue product.",
        f"{top_region} is the strongest performing region.",
        f"{top_category} is the leading category.",
        f"Current revenue is ₹{total_revenue:,.2f}.",
        f"Current profit is ₹{total_profit:,.2f}.",
    ]

    recommendations = [
        "Increase inventory for high-demand products.",
        "Focus marketing campaigns on top-performing regions.",
        "Monitor low-profit products and reduce unnecessary discounts.",
        "Use scenario planning before large procurement decisions.",
    ]

    for insight in insights[:3]:
        recommendations.append(insight.recommended_action)

    summary = (
        f"The project generated ₹{total_revenue:,.2f} revenue and "
        f"₹{total_profit:,.2f} profit. The strongest product is {top_product}, "
        f"with {top_region} as the leading region. Forecast outlook shows "
        f"positive revenue and profit growth potential."
    )

    return {
        "summary": summary,
        "key_findings": key_findings,
        "recommendations": recommendations,
        "revenue_forecast": revenue_forecast,
        "profit_forecast": profit_forecast,
        "cost_analysis": cost_analysis,
        "kpi_summary": kpi_summary,
    }