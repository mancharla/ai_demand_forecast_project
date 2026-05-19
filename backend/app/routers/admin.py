import io
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.database import get_db
from app.models import User, Dataset, Forecast, Notification
from app.utils.dependencies import get_current_admin

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return {
        "admin": {
            "id": current_admin.id,
            "name": current_admin.name,
            "email": current_admin.email,
            "role": current_admin.role,
        },
        "stats": {
            "total_users": db.query(User).count(),
            "total_admins": db.query(User).filter(User.role == "admin").count(),
            "total_normal_users": db.query(User).filter(User.role == "user").count(),
            "total_datasets": db.query(Dataset).count(),
            "total_forecasts": db.query(Forecast).count(),
            "total_notifications": db.query(Notification).count(),
            "total_forecast_history": db.query(Forecast).count(),
            "total_accuracy_metrics": db.query(Forecast).count(),
        },
    }


@router.get("/users")
def get_users(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(User)

    if search:
        query = query.filter(
            (User.name.like(f"%{search}%")) |
            (User.email.like(f"%{search}%")) |
            (User.role.like(f"%{search}%"))
        )

    total = query.count()

    users = (
        query.order_by(User.created_at.desc())
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
    role: str = Query(...),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    if role not in ["user", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be user or admin",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user.role = role
    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully",
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
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }


@router.get("/datasets")
def get_all_datasets(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(Dataset)

    if search:
        query = query.filter(
            Dataset.original_filename.like(f"%{search}%")
        )

    total = query.count()

    datasets = (
        query.order_by(Dataset.upload_date.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    data = []

    for dataset in datasets:
        data.append({
            "id": dataset.id,
            "file_name": dataset.original_filename,
            "user_id": dataset.user_id,
            "file_path": dataset.filename,
            "uploaded_at": dataset.upload_date,
        })

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.delete("/datasets/{dataset_id}")
def delete_admin_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    db.delete(dataset)
    db.commit()

    return {
        "message": "Dataset deleted successfully"
    }


@router.get("/forecasts")
def get_all_forecasts(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(Forecast)

    total = query.count()

    forecasts = (
        query.order_by(Forecast.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    data = []

    for forecast in forecasts:
        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        product_name = value.get("product", "N/A")

        if search and search.lower() not in product_name.lower():
            continue

        data.append({
            "id": forecast.id,
            "product_name": product_name,
            "predicted_sales": value.get("predicted_sales", 0),
            "dataset_id": forecast.dataset_id,
            "model_name": forecast.model_name,
            "created_at": forecast.created_at,
        })

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/forecast-history")
def get_forecast_history(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(Forecast)

    total = query.count()

    forecasts = (
        query.order_by(Forecast.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    data = []

    for forecast in forecasts:
        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        product = value.get("product", "N/A")

        if search and search.lower() not in (
            forecast.model_name.lower() + product.lower()
        ):
            continue

        data.append({
            "id": forecast.id,
            "user_id": forecast.user_id,
            "dataset_id": forecast.dataset_id,
            "model_name": forecast.model_name,
            "forecast_days": 30,
            "top_demand_product": product,
            "created_at": forecast.created_at,
        })

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/accuracy-metrics")
def get_accuracy_metrics(
    page: int = Query(1),
    limit: int = Query(10),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    query = db.query(Forecast)

    total = query.count()

    forecasts = (
        query.order_by(Forecast.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    data = []

    for forecast in forecasts:
        if search and search.lower() not in forecast.model_name.lower():
            continue

        data.append({
            "id": forecast.id,
            "user_id": forecast.user_id,
            "dataset_id": forecast.dataset_id,
            "model_name": forecast.model_name,
            "mae": forecast.mae or 0,
            "rmse": forecast.rmse or 0,
            "mape": forecast.mape or 0,
            "created_at": forecast.created_at,
        })

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/reports")
def admin_reports(
    current_admin=Depends(get_current_admin),
):
    return [
        {
            "name": "All Forecast Excel Report",
            "type": "Excel",
            "endpoint": "/admin/reports/forecast/excel",
        },
        {
            "name": "Admin Dashboard PDF Report",
            "type": "PDF",
            "endpoint": "/admin/reports/dashboard/pdf",
        },
    ]


@router.get("/reports/forecast/excel")
def admin_forecast_excel(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    forecasts = (
        db.query(Forecast)
        .order_by(Forecast.created_at.desc())
        .all()
    )

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "All Forecasts"

    sheet.append([
        "ID",
        "User ID",
        "Dataset ID",
        "Product",
        "Predicted Sales",
        "Model",
        "Created At",
    ])

    for forecast in forecasts:
        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        sheet.append([
            forecast.id,
            forecast.user_id,
            forecast.dataset_id,
            value.get("product", "N/A"),
            value.get("predicted_sales", 0),
            forecast.model_name,
            str(forecast.created_at),
        ])

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                "attachment; filename=admin_all_forecast_report.xlsx"
        },
    )


@router.get("/reports/dashboard/pdf")
def admin_dashboard_pdf(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    total_users = db.query(User).count()
    total_datasets = db.query(Dataset).count()
    total_forecasts = db.query(Forecast).count()
    total_notifications = db.query(Notification).count()

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(50, height - 50, "Admin Dashboard Report")

    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, height - 90, f"Admin: {current_admin.name}")
    pdf.drawString(50, height - 120, f"Total Users: {total_users}")
    pdf.drawString(50, height - 145, f"Total Datasets: {total_datasets}")
    pdf.drawString(50, height - 170, f"Total Forecasts: {total_forecasts}")
    pdf.drawString(
        50,
        height - 195,
        f"Total Notifications: {total_notifications}",
    )

    pdf.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=admin_dashboard_report.pdf"
        },
    )