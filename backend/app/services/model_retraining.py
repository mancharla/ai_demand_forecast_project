import os
import pandas as pd

from app.services.forecasting import train_and_compare_models


UPLOAD_DIR = "uploads"


def retrain_dataset_model(dataset):
    file_path = os.path.join(
        UPLOAD_DIR,
        dataset.filename,
    )

    if not os.path.exists(file_path):
        return {
            "dataset_id": dataset.id,
            "status": "failed",
            "message": "Dataset file not found",
        }

    try:
        if dataset.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        result = train_and_compare_models(df)

        return {
            "dataset_id": dataset.id,
            "file_name": dataset.original_filename,
            "status": "success",
            "best_model": result["best_model_name"],
            "model_comparison": result["model_comparison"],
        }

    except Exception as e:
        return {
            "dataset_id": dataset.id,
            "file_name": dataset.original_filename,
            "status": "failed",
            "message": str(e),
        }