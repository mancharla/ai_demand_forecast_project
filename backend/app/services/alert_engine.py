def evaluate_alert(alert, latest_accuracy=None, demand_growth=None):
    alert_type = alert.alert_type
    threshold = float(alert.threshold_value or 0)

    if alert_type == "forecast_failure":
        if latest_accuracy is not None and latest_accuracy < threshold:
            return {
                "triggered": True,
                "message": f"Forecast accuracy dropped to {latest_accuracy:.2f}%"
            }

    if alert_type == "demand_spike":
        if demand_growth is not None and demand_growth > threshold:
            return {
                "triggered": True,
                "message": f"Demand spike detected: {demand_growth:.2f}% growth"
            }

    if alert_type == "low_stock":
        if demand_growth is not None and demand_growth > threshold:
            return {
                "triggered": True,
                "message": f"Low stock risk: demand growth is {demand_growth:.2f}%"
            }

    return {
        "triggered": False,
        "message": None
    }