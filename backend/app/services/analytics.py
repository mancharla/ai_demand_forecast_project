import pandas as pd


def calculate_summary_metrics(df: pd.DataFrame):
    """
    Generate summary KPI metrics for dashboard.
    """

    if df.empty:
        return {
            "total_products": 0,
            "total_regions": 0,
            "total_sales": 0,
            "top_product": "N/A",
        }

    total_products = (
        int(df["Product"].nunique())
        if "Product" in df.columns
        else 0
    )

    total_regions = (
        int(df["Region"].nunique())
        if "Region" in df.columns
        else 0
    )

    total_sales = (
        float(pd.to_numeric(
            df["Sales"],
            errors="coerce"
        ).fillna(0).sum())
        if "Sales" in df.columns
        else 0
    )

    top_product = "N/A"

    if (
        "Product" in df.columns
        and "Sales" in df.columns
    ):
        grouped = (
            df.groupby("Product")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        if not grouped.empty:
            top_product = grouped.index[0]

    return {
        "total_products": total_products,
        "total_regions": total_regions,
        "total_sales": round(total_sales, 2),
        "top_product": str(top_product),
    }


def get_chart_data(df: pd.DataFrame):
    """
    Build chart-ready datasets.
    """

    charts = {
        "product_sales": [],
        "region_sales": [],
        "category_sales": [],
        "monthly_sales": [],
    }

    if df.empty:
        return charts

    # Product Sales
    if (
        "Product" in df.columns
        and "Sales" in df.columns
    ):
        charts["product_sales"] = (
            df.groupby("Product")["Sales"]
            .sum()
            .reset_index()
            .rename(
                columns={
                    "Product": "product",
                    "Sales": "sales",
                }
            )
            .to_dict(orient="records")
        )

    # Region Sales
    if (
        "Region" in df.columns
        and "Sales" in df.columns
    ):
        charts["region_sales"] = (
            df.groupby("Region")["Sales"]
            .sum()
            .reset_index()
            .rename(
                columns={
                    "Region": "region",
                    "Sales": "sales",
                }
            )
            .to_dict(orient="records")
        )

    # Category Sales
    if (
        "Category" in df.columns
        and "Sales" in df.columns
    ):
        charts["category_sales"] = (
            df.groupby("Category")["Sales"]
            .sum()
            .reset_index()
            .rename(
                columns={
                    "Category": "category",
                    "Sales": "sales",
                }
            )
            .to_dict(orient="records")
        )

    # Monthly Sales
    if (
        "Date" in df.columns
        and "Sales" in df.columns
    ):
        temp = df.copy()

        temp["Date"] = pd.to_datetime(
            temp["Date"],
            errors="coerce"
        )

        temp = temp.dropna(subset=["Date"])

        temp["month"] = temp["Date"].dt.strftime(
            "%Y-%m"
        )

        charts["monthly_sales"] = (
            temp.groupby("month")["Sales"]
            .sum()
            .reset_index()
            .rename(columns={"Sales": "sales"})
            .to_dict(orient="records")
        )

    return charts