import os
import pandas as pd

from io import BytesIO
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet


def generate_comparison_pdf(comparison_data):
    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    elements = []

    elements.append(
        Paragraph(
            "AI Demand Forecasting - Model Comparison Report",
            styles["Title"],
        )
    )

    elements.append(Spacer(1, 12))

    best_model = comparison_data["best_model"]

    elements.append(
        Paragraph(
            f"Best Model: {best_model['model']}",
            styles["Heading2"],
        )
    )

    elements.append(
        Paragraph(
            f"Accuracy: {best_model['accuracy']}%",
            styles["Normal"],
        )
    )

    elements.append(Spacer(1, 12))

    table_data = [
        [
            "Model",
            "Accuracy",
            "MAE",
            "RMSE",
            "MAPE",
        ]
    ]

    for model in comparison_data["models"]:
        table_data.append(
            [
                model["model"],
                str(model["accuracy"]),
                str(model["mae"]),
                str(model["rmse"]),
                str(model["mape"]),
            ]
        )

    table = Table(table_data)

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )

    elements.append(table)

    doc.build(elements)

    pdf = buffer.getvalue()

    buffer.close()

    return pdf


def generate_comparison_excel(comparison_data):
    output = BytesIO()

    rows = []

    for model in comparison_data["models"]:
        rows.append(
            {
                "Model": model["model"],
                "Accuracy": model["accuracy"],
                "MAE": model["mae"],
                "RMSE": model["rmse"],
                "MAPE": model["mape"],
            }
        )

    df = pd.DataFrame(rows)

    with pd.ExcelWriter(
        output,
        engine="openpyxl",
    ) as writer:
        df.to_excel(
            writer,
            index=False,
            sheet_name="Model Comparison",
        )

    output.seek(0)

    return output.getvalue()