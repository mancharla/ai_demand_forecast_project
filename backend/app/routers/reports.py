import io
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.database import get_db
from app.models import Forecast, Report, Notification
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/preview")
def report_preview(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecasts = (
        db.query(Forecast)
        .filter(Forecast.user_id == current_user.id)
        .order_by(Forecast.created_at.desc())
        .all()
    )

    forecast_data = []

    for forecast in forecasts:
        value = {}

        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        forecast_data.append(
            {
                "product": value.get("product", "N/A"),
                "predicted_sales": value.get("predicted_sales", 0),
            }
        )

    total_sales = sum(
        item["predicted_sales"] for item in forecast_data
    )

    return {
        "user_name": current_user.name,
        "total_sales": round(total_sales, 2),
        "total_products": len(forecast_data),
        "forecast_count": len(forecast_data),
        "forecast_data": forecast_data,
    }


@router.get("/forecast/excel")
def download_forecast_excel(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecasts = (
        db.query(Forecast)
        .filter(Forecast.user_id == current_user.id)
        .order_by(Forecast.created_at.desc())
        .all()
    )

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Forecast Report"

    sheet.append([
        "Product",
        "Predicted Sales",
        "Model",
        "Dataset ID",
        "Created At",
    ])

    for forecast in forecasts:
        value = {}

        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        sheet.append([
            value.get("product", "N/A"),
            value.get("predicted_sales", 0),
            forecast.model_name,
            forecast.dataset_id,
            str(forecast.created_at),
        ])

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    notification = Notification(
        user_id=current_user.id,
        message="Excel report generated successfully",
        type="success",
    )

    db.add(notification)
    db.commit()

    return StreamingResponse(
        output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                "attachment; filename=forecast_report.xlsx"
            )
        },
    )


@router.get("/dashboard/pdf")
def download_dashboard_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    forecasts = (
        db.query(Forecast)
        .filter(Forecast.user_id == current_user.id)
        .order_by(Forecast.created_at.desc())
        .all()
    )

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(
        50,
        height - 50,
        "AI Demand Forecasting Report",
    )

    pdf.setFont("Helvetica", 12)
    pdf.drawString(
        50,
        height - 80,
        f"User: {current_user.name}",
    )

    pdf.drawString(
        50,
        height - 100,
        f"Total Forecasts: {len(forecasts)}",
    )

    y = height - 140

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y, "Product")
    pdf.drawString(220, y, "Predicted Sales")
    pdf.drawString(380, y, "Model")

    y -= 25
    pdf.setFont("Helvetica", 10)

    for forecast in forecasts[:25]:
        value = {}

        try:
            value = json.loads(forecast.forecast_values or "{}")
        except Exception:
            value = {}

        pdf.drawString(
            50,
            y,
            str(value.get("product", "N/A"))[:20],
        )

        pdf.drawString(
            220,
            y,
            str(value.get("predicted_sales", 0)),
        )

        pdf.drawString(
            380,
            y,
            forecast.model_name[:20],
        )

        y -= 20

        if y < 60:
            pdf.showPage()
            y = height - 60

    pdf.save()
    buffer.seek(0)

    notification = Notification(
        user_id=current_user.id,
        message="PDF report generated successfully",
        type="success",
    )

    db.add(notification)
    db.commit()

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; filename=dashboard_report.pdf"
            )
        },
    )