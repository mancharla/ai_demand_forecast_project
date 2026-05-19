import io
from typing import List, Dict, Any

from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def generate_excel_report(rows: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Create an Excel report from a list of dictionaries.
    """
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Forecast Report"

    if rows:
        # Header row
        sheet.append(list(rows[0].keys()))

        # Data rows
        for row in rows:
            sheet.append(list(row.values()))
    else:
        sheet.append(["No Data Available"])

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)

    return output


def generate_pdf_report(
    title: str,
    rows: List[Dict[str, Any]],
) -> io.BytesIO:
    """
    Create a simple PDF report.
    """
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter

    # Title
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(50, height - 50, title)

    # Content
    y = height - 90
    pdf.setFont("Helvetica", 10)

    if not rows:
        pdf.drawString(50, y, "No data available.")
    else:
        for row in rows:
            line = " | ".join(
                f"{key}: {value}"
                for key, value in row.items()
            )

            pdf.drawString(50, y, line[:110])

            y -= 18

            if y < 50:
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 10)

    pdf.save()
    buffer.seek(0)

    return buffer 