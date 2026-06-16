import os
import json
import pandas as pd


def load_dataset_file(dataset):
    file_path = os.path.join("uploads", dataset.filename)

    if not os.path.exists(file_path):
        raise FileNotFoundError("Dataset file not found")

    if dataset.filename.endswith(".csv"):
        return pd.read_csv(file_path)

    return pd.read_excel(file_path)


def analyze_data_quality(df):
    total_rows = len(df)
    total_columns = len(df.columns)

    missing_values = int(df.isnull().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    issues = []

    if total_rows == 0:
        issues.append("Dataset is empty")

    if missing_values > 0:
        issues.append(f"{missing_values} missing values detected")

    if duplicate_rows > 0:
        issues.append(f"{duplicate_rows} duplicate rows detected")

    required_columns = ["Date", "Product", "Category", "Region", "Sales"]

    missing_required = [
        col for col in required_columns if col not in df.columns
    ]

    if missing_required:
        issues.append(
            f"Missing required columns: {', '.join(missing_required)}"
        )

    penalty = 0

    if total_rows > 0:
        penalty += (missing_values / (total_rows * max(total_columns, 1))) * 40
        penalty += (duplicate_rows / total_rows) * 30

    penalty += len(missing_required) * 10

    quality_score = max(0, round(100 - penalty, 2))

    return {
        "quality_score": quality_score,
        "total_rows": total_rows,
        "total_columns": total_columns,
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        "validation_summary": json.dumps({
            "issues": issues,
            "missing_required_columns": missing_required,
            "required_columns": required_columns,
        }),
    }