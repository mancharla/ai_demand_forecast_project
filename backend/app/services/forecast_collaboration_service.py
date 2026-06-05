def create_revision_snapshot(forecast):
    return {
        "forecast_id": forecast.id,
        "model_name": forecast.model_name,
        "target_column": forecast.target_column,
        "mae": forecast.mae,
        "rmse": forecast.rmse,
        "mape": forecast.mape,
        "accuracy": forecast.accuracy,
        "forecast_values": forecast.forecast_values,
    }