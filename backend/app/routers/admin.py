import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import (
    User,
    Dataset,
    Forecast,
    Notification,
    Report,
    UserActivityLog,
    APIActivityLog,
)
from app.utils.dependencies import get_current_admin
from app.services.activity_logger import log_activity


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    total_users = db.query(User).count()

    total_admins = (
        db.query(User)
        .filter(User.role.in_(["admin", "super_admin"]))
        .count()
    )

    total_normal_users = (
        db.query(User)
        .filter(User.role == "viewer")
        .count()
    )

    total_datasets = db.query(Dataset).count()

    total_forecasts = (
        db.query(Forecast)
        .filter(~Forecast.forecast_values.like("%model_comparison_metric%"))
        .count()
    )

    total_notifications = db.query(Notification).count()

    total_forecast_history = total_forecasts

    total_accuracy_metrics = (
        db.query(Forecast)
        .filter(Forecast.forecast_values.like("%model_comparison_metric%"))
        .count()
    )

    return {
        "admin": {
            "id": current_admin.id,
            "name": current_admin.name,
            "email": current_admin.email,
            "role": current_admin.role,
        },
        "stats": {
            "total_users": total_users,
            "total_admins": total_admins,
            "total_normal_users": total_normal_users,
            "total_datasets": total_datasets,
            "total_forecasts": total_forecasts,
            "total_notifications": total_notifications,
            "total_forecast_history": total_forecast_history,
            "total_accuracy_metrics": total_accuracy_metrics,
        },
    }


@router.get("/users")
def get_users(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    role: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(User)

    if search:
        query = query.filter(
            or_(
                User.name.like(f"%{search}%"),
                User.email.like(f"%{search}%"),
                User.role.like(f"%{search}%"),
            )
        )

    if role:
        query = query.filter(User.role == role)

    total = query.count()

    users = (
        query.order_by(User.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "data": users,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    allowed_roles = ["super_admin", "admin", "analyst", "viewer", "user"]

    if role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role

    log_activity(
        db=db,
        user_id=current_admin.id,
        action="UPDATE_USER_ROLE",
        description=f"Updated user {user.email} role to {role}",
        module="Admin",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully",
        "user": user,
    }


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    account_status: str,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    allowed_status = ["active", "inactive", "suspended"]

    if account_status not in allowed_status:
        raise HTTPException(status_code=400, detail="Invalid account status")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.account_status = account_status

    if hasattr(user, "is_active"):
        user.is_active = 1 if account_status == "active" else 0

    log_activity(
        db=db,
        user_id=current_admin.id,
        action="UPDATE_USER_STATUS",
        description=f"Updated user {user.email} status to {account_status}",
        module="Admin",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "User status updated successfully",
        "user": user,
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account",
        )

    db.delete(user)

    log_activity(
        db=db,
        user_id=current_admin.id,
        action="DELETE_USER",
        description=f"Deleted user {user.email}",
        module="Admin",
    )

    db.commit()

    return {"message": "User deleted successfully"}


@router.get("/datasets")
def get_all_datasets(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    user_id: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(Dataset)

    if search:
        query = query.filter(
            or_(
                Dataset.filename.like(f"%{search}%"),
                Dataset.original_filename.like(f"%{search}%"),
            )
        )

    if user_id:
        try:
            query = query.filter(Dataset.user_id == int(user_id))
        except ValueError:
            pass

    total = query.count()

    datasets = (
        query.order_by(Dataset.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    data = []

    for dataset in datasets:
        data.append(
            {
                "id": dataset.id,
                "file_name": dataset.original_filename or dataset.filename,
                "filename": dataset.filename,
                "original_filename": dataset.original_filename,
                "user_id": dataset.user_id,
                "file_path": getattr(dataset, "file_path", None)
                or dataset.filename,
                "uploaded_at": getattr(dataset, "upload_date", None),
            }
        )

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.delete("/datasets/{dataset_id}")
def delete_dataset_admin(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    db.delete(dataset)

    log_activity(
        db=db,
        user_id=current_admin.id,
        action="DELETE_DATASET",
        description=f"Deleted dataset {dataset_id}",
        module="Admin",
    )

    db.commit()

    return {"message": "Dataset deleted successfully"}


@router.get("/forecasts")
def get_all_forecasts(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    model_name: str = Query(""),
    dataset_id: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = (
        db.query(Forecast)
        .filter(~Forecast.forecast_values.like("%model_comparison_metric%"))
    )

    if model_name:
        query = query.filter(Forecast.model_name.like(f"%{model_name}%"))

    if dataset_id:
        try:
            query = query.filter(Forecast.dataset_id == int(dataset_id))
        except ValueError:
            pass

    forecasts = query.order_by(Forecast.id.desc()).all()

    data = []

    for forecast in forecasts:
        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        product_name = (
            value.get("product")
            or value.get("product_name")
            or value.get("top_product")
            or value.get("top_demand_product")
            or "N/A"
        )

        predicted_sales = (
            value.get("predicted_sales")
            or value.get("sales")
            or value.get("forecast")
            or 0
        )

        if search and search.lower() not in str(product_name).lower():
            continue

        data.append(
            {
                "id": forecast.id,
                "product_name": product_name,
                "predicted_sales": predicted_sales,
                "dataset_id": forecast.dataset_id,
                "model_name": forecast.model_name,
                "created_at": forecast.created_at,
                "user_id": forecast.user_id,
            }
        )

    total = len(data)
    start = (page - 1) * limit
    end = start + limit

    return {
        "data": data[start:end],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/forecast-history")
def get_admin_forecast_history(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = (
        db.query(Forecast)
        .filter(~Forecast.forecast_values.like("%model_comparison_metric%"))
    )

    if search:
        query = query.filter(Forecast.model_name.like(f"%{search}%"))

    total = query.count()

    history = (
        query.order_by(Forecast.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    data = []

    for item in history:
        try:
            values = json.loads(item.forecast_values or "{}")
        except Exception:
            values = {}

        product = (
            values.get("product")
            or values.get("product_name")
            or values.get("top_product")
            or values.get("top_demand_product")
            or "N/A"
        )

        data.append(
            {
                "id": item.id,
                "user_id": item.user_id,
                "dataset_id": item.dataset_id,
                "model_name": item.model_name,
                "forecast_days": values.get("days", 30),
                "top_demand_product": product,
                "created_at": item.created_at,
            }
        )

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/accuracy-metrics")
def get_admin_accuracy_metrics(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = (
        db.query(Forecast)
        .filter(Forecast.forecast_values.like("%model_comparison_metric%"))
    )

    if search:
        query = query.filter(Forecast.model_name.like(f"%{search}%"))

    total = query.count()

    metrics = (
        query.order_by(Forecast.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    data = []

    for item in metrics:
        data.append(
            {
                "id": item.id,
                "user_id": item.user_id,
                "dataset_id": item.dataset_id,
                "model_name": item.model_name,
                "mae": item.mae,
                "rmse": item.rmse,
                "mape": item.mape,
                "accuracy": item.accuracy,
                "created_at": item.created_at,
            }
        )

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/reports")
def get_admin_reports(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return [
        {
            "name": "Professional Forecast Excel Report",
            "type": "Excel",
            "endpoint": "/reports/forecast/excel",
        },
        {
            "name": "Professional Dashboard PDF Report",
            "type": "PDF",
            "endpoint": "/reports/dashboard/pdf",
        },
        {
            "name": "Professional Analytics Summary Excel",
            "type": "Excel",
            "endpoint": "/reports/analytics/summary/excel",
        },
        {
            "name": "Model Comparison PDF Report",
            "type": "PDF",
            "endpoint": "/comparison-report/pdf/{dataset_id}",
        },
        {
            "name": "Model Comparison Excel Report",
            "type": "Excel",
            "endpoint": "/comparison-report/excel/{dataset_id}",
        },
    ]


@router.get("/activity-logs")
def get_activity_logs(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(UserActivityLog)

    if search:
        query = query.filter(
            or_(
                UserActivityLog.action.like(f"%{search}%"),
                UserActivityLog.description.like(f"%{search}%"),
                UserActivityLog.module.like(f"%{search}%"),
            )
        )

    total = query.count()

    logs = (
        query.order_by(UserActivityLog.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "data": logs,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/api-activity-logs")
def get_api_activity_logs(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(APIActivityLog)

    if search:
        query = query.filter(
            or_(
                APIActivityLog.path.like(f"%{search}%"),
                APIActivityLog.method.like(f"%{search}%"),
            )
        )

    total = query.count()

    logs = (
        query.order_by(APIActivityLog.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "data": logs,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/system-metrics")
def get_system_metrics(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    total_users = db.query(User).count()
    total_datasets = db.query(Dataset).count()

    total_forecasts = (
        db.query(Forecast)
        .filter(~Forecast.forecast_values.like("%model_comparison_metric%"))
        .count()
    )

    total_notifications = db.query(Notification).count()

    unread_notifications = (
        db.query(Notification)
        .filter(Notification.is_read == False)
        .count()
    )

    total_activity_logs = db.query(UserActivityLog).count()
    total_api_logs = db.query(APIActivityLog).count()

    latest_forecast = (
        db.query(Forecast)
        .filter(~Forecast.forecast_values.like("%model_comparison_metric%"))
        .order_by(Forecast.id.desc())
        .first()
    )

    latest_activity = (
        db.query(UserActivityLog)
        .order_by(UserActivityLog.id.desc())
        .first()
    )

    return {
        "total_users": total_users,
        "total_datasets": total_datasets,
        "total_forecasts": total_forecasts,
        "total_notifications": total_notifications,
        "unread_notifications": unread_notifications,
        "total_activity_logs": total_activity_logs,
        "total_api_logs": total_api_logs,
        "latest_forecast_time": latest_forecast.created_at
        if latest_forecast
        else None,
        "latest_activity_time": latest_activity.created_at
        if latest_activity
        else None,
        "api_status": "running",
        "database_status": "connected",
    }


@router.get("/api-performance-summary")
def api_performance_summary(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    logs = (
        db.query(APIActivityLog)
        .order_by(APIActivityLog.id.desc())
        .limit(100)
        .all()
    )

    slow_logs = [
        log for log in logs
        if log.response_time_ms and log.response_time_ms > 1000
    ]

    average_response_time = 0

    if logs:
        average_response_time = round(
            sum(log.response_time_ms or 0 for log in logs) / len(logs),
            2,
        )

    chart_data = [
        {
            "path": log.path,
            "method": log.method,
            "status_code": log.status_code,
            "response_time_ms": log.response_time_ms,
            "created_at": log.created_at,
        }
        for log in reversed(logs)
    ]

    alerts = [
        {
            "id": log.id,
            "message": f"Slow API detected: {log.method} {log.path}",
            "response_time_ms": log.response_time_ms,
            "created_at": log.created_at,
        }
        for log in slow_logs[:10]
    ]

    return {
        "total_checked": len(logs),
        "slow_api_count": len(slow_logs),
        "average_response_time": average_response_time,
        "chart_data": chart_data,
        "alerts": alerts,
    }