import random


def generate_model_performance_metrics(project_id):
    models = [
        "Linear Regression",
        "Random Forest",
        "XGBoost",
    ]

    performances = []

    for model in models:
        mae = round(random.uniform(20, 80), 2)
        rmse = round(random.uniform(30, 120), 2)
        mape = round(random.uniform(3, 18), 2)

        accuracy = round(100 - mape, 2)

        performances.append({
            "project_id": project_id,
            "model_name": model,
            "mae": mae,
            "rmse": rmse,
            "mape": mape,
            "accuracy_score": accuracy,
        })

    performances.sort(
        key=lambda x: x["accuracy_score"],
        reverse=True
    )

    for rank, item in enumerate(performances, start=1):
        item["model_rank"] = rank

    return performances