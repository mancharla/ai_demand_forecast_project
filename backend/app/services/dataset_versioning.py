import os
import shutil
import pandas as pd
from datetime import datetime


VERSION_DIR = "dataset_versions"


def get_dataset_file_path(dataset):
    filename = getattr(dataset, "filename", None)

    if not filename:
        return None

    return os.path.join("uploads", filename)


def read_dataset_stats(file_path):
    if not file_path or not os.path.exists(file_path):
        return {
            "rows_count": 0,
            "columns_count": 0,
            "file_size_mb": 0,
        }

    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    file_size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)

    return {
        "rows_count": len(df),
        "columns_count": len(df.columns),
        "file_size_mb": file_size_mb,
    }


def create_dataset_version_file(dataset, version_number):
    os.makedirs(VERSION_DIR, exist_ok=True)

    source_path = get_dataset_file_path(dataset)

    if not source_path or not os.path.exists(source_path):
        return None

    extension = source_path.split(".")[-1]

    version_filename = (
        f"dataset_{dataset.id}_v{version_number}_"
        f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{extension}"
    )

    destination_path = os.path.join(VERSION_DIR, version_filename)

    shutil.copy(source_path, destination_path)

    return destination_path


def compare_dataset_files(file_path_1, file_path_2):
    if not os.path.exists(file_path_1) or not os.path.exists(file_path_2):
        return {
            "error": "One or both dataset files not found"
        }

    if file_path_1.endswith(".csv"):
        df1 = pd.read_csv(file_path_1)
    else:
        df1 = pd.read_excel(file_path_1)

    if file_path_2.endswith(".csv"):
        df2 = pd.read_csv(file_path_2)
    else:
        df2 = pd.read_excel(file_path_2)

    columns_1 = set(df1.columns)
    columns_2 = set(df2.columns)

    return {
        "version_1": {
            "rows": len(df1),
            "columns": len(df1.columns),
        },
        "version_2": {
            "rows": len(df2),
            "columns": len(df2.columns),
        },
        "row_difference": len(df2) - len(df1),
        "column_difference": len(df2.columns) - len(df1.columns),
        "added_columns": list(columns_2 - columns_1),
        "removed_columns": list(columns_1 - columns_2),
        "common_columns": list(columns_1.intersection(columns_2)),
    }