import pandas as pd


def load_dataset(file_path: str) -> pd.DataFrame:
    """
    Load CSV or Excel dataset.
    """
    if file_path.endswith(".csv"):
        return pd.read_csv(file_path)
    elif file_path.endswith(".xlsx"):
        return pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format")


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Basic preprocessing for demand forecasting data.
    Expected columns:
    - Date
    - Product
    - Sales
    Optional:
    - Region
    - Category
    """

    df = df.copy()

    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(
            df["Date"],
            errors="coerce"
        )

    if "Sales" in df.columns:
        df["Sales"] = pd.to_numeric(
            df["Sales"],
            errors="coerce"
        )

    # Remove invalid rows
    required_columns = ["Date", "Product", "Sales"]

    existing_required = [
        col for col in required_columns
        if col in df.columns
    ]

    df = df.dropna(subset=existing_required)

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Sort by date
    if "Date" in df.columns:
        df = df.sort_values("Date")

    df = df.reset_index(drop=True)

    return df


def get_dataset_summary(df: pd.DataFrame):
    """
    Return dataset summary statistics.
    """

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "missing_values": df.isnull().sum().to_dict(),
    }