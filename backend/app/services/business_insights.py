import pandas as pd


def generate_business_insights(df: pd.DataFrame):
    insights = []

    if df.empty:
        return ["No data available to generate insights."]

    if "Sales" in df.columns:
        df["Sales"] = pd.to_numeric(
            df["Sales"],
            errors="coerce"
        ).fillna(0)

    if "Product" in df.columns and "Sales" in df.columns:
        product_sales = (
            df.groupby("Product")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        if not product_sales.empty:
            top_product = product_sales.index[0]
            top_sales = product_sales.iloc[0]

            insights.append(
                f"{top_product} is the highest-demand product with total sales of {round(float(top_sales), 2)}."
            )

            low_product = product_sales.index[-1]
            low_sales = product_sales.iloc[-1]

            insights.append(
                f"{low_product} has the lowest demand with total sales of {round(float(low_sales), 2)}."
            )

    if "Region" in df.columns and "Sales" in df.columns:
        region_sales = (
            df.groupby("Region")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        if not region_sales.empty:
            insights.append(
                f"{region_sales.index[0]} is the strongest sales region."
            )

    if "Category" in df.columns and "Sales" in df.columns:
        category_sales = (
            df.groupby("Category")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        if not category_sales.empty:
            insights.append(
                f"{category_sales.index[0]} is the best-performing category."
            )

    if "Date" in df.columns and "Sales" in df.columns:
        temp = df.copy()
        temp["Date"] = pd.to_datetime(
            temp["Date"],
            errors="coerce"
        )

        temp = temp.dropna(subset=["Date"])
        temp["month"] = temp["Date"].dt.strftime("%Y-%m")

        monthly_sales = (
            temp.groupby("month")["Sales"]
            .sum()
            .sort_index()
        )

        if len(monthly_sales) >= 2:
            last_month = monthly_sales.iloc[-1]
            previous_month = monthly_sales.iloc[-2]

            if last_month > previous_month:
                insights.append(
                    "Sales are increasing compared to the previous month."
                )
            elif last_month < previous_month:
                insights.append(
                    "Sales are decreasing compared to the previous month."
                )
            else:
                insights.append(
                    "Sales remained stable compared to the previous month."
                )

    if not insights:
        insights.append(
            "Dataset uploaded successfully, but more columns are needed for advanced insights."
        )

    return insights