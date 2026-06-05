import os
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.models import Dataset, Forecast
from app.models_extended import ForecastProject, ProjectForecast

UPLOAD_DIR = "uploads"


class ExecutiveAnalyticsService:
    @staticmethod
    def _load_project_datasets(project: ForecastProject) -> pd.DataFrame:
        frames: List[pd.DataFrame] = []

        for association in project.datasets:
            dataset = association.dataset
            if not dataset or not dataset.filename:
                continue

            file_path = os.path.join(UPLOAD_DIR, dataset.filename)
            if not os.path.exists(file_path):
                continue

            try:
                if dataset.filename.lower().endswith(".csv"):
                    df = pd.read_csv(file_path)
                else:
                    df = pd.read_excel(file_path)

                frames.append(df)
            except Exception:
                continue

        if not frames:
            return pd.DataFrame()

        return pd.concat(frames, ignore_index=True)

    @staticmethod
    def _normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        if "Sales" in df.columns:
            df["Sales"] = pd.to_numeric(df["Sales"], errors="coerce").fillna(0)

        if "Price" in df.columns:
            df["Price"] = pd.to_numeric(df["Price"], errors="coerce").fillna(0)

        if "Cost" in df.columns:
            df["Cost"] = pd.to_numeric(df["Cost"], errors="coerce").fillna(0)

        if "FixedCost" in df.columns:
            df["FixedCost"] = pd.to_numeric(df["FixedCost"], errors="coerce").fillna(0)

        if "VariableCost" in df.columns:
            df["VariableCost"] = pd.to_numeric(df["VariableCost"], errors="coerce").fillna(0)

        if "Inventory" in df.columns:
            df["Inventory"] = pd.to_numeric(df["Inventory"], errors="coerce").fillna(0)

        return df

    @staticmethod
    def _parse_forecast_values(value: Optional[str]) -> Any:
        if not value:
            return None

        if isinstance(value, dict) or isinstance(value, list):
            return value

        try:
            return json.loads(value)
        except Exception:
            return None

    @staticmethod
    def _extract_revenue_from_forecast(forecast_payload: Any, avg_price: float) -> float:
        if forecast_payload is None:
            return 0.0

        if isinstance(forecast_payload, dict):
            if "revenue" in forecast_payload:
                return float(forecast_payload.get("revenue", 0) or 0)

            if "forecast_revenue" in forecast_payload:
                return float(forecast_payload.get("forecast_revenue", 0) or 0)

            if "forecast_value" in forecast_payload:
                return float(forecast_payload.get("forecast_value", 0) or 0)

            if "predicted_sales" in forecast_payload:
                units = float(forecast_payload.get("predicted_sales", 0) or 0)
                price = float(forecast_payload.get("price", avg_price) or avg_price)
                return units * price

            if "sales" in forecast_payload:
                units = float(forecast_payload.get("sales", 0) or 0)
                price = float(forecast_payload.get("price", avg_price) or avg_price)
                return units * price

            if "data" in forecast_payload and isinstance(forecast_payload["data"], list):
                return ExecutiveAnalyticsService._extract_revenue_from_forecast(
                    forecast_payload["data"], avg_price
                )

            values = []
            for key, value in forecast_payload.items():
                if isinstance(value, (int, float)) and key.lower() in ["sales", "predicted_sales", "forecast_value", "revenue"]:
                    values.append(float(value))

            if values:
                return sum(values)

            return 0.0

        if isinstance(forecast_payload, list):
            total = 0.0
            for item in forecast_payload:
                if isinstance(item, dict):
                    if "predicted_sales" in item:
                        units = float(item.get("predicted_sales", 0) or 0)
                        price = float(item.get("price", avg_price) or avg_price)
                        total += units * price
                        continue

                    if "sales" in item:
                        units = float(item.get("sales", 0) or 0)
                        price = float(item.get("price", avg_price) or avg_price)
                        total += units * price
                        continue

                    if "revenue" in item:
                        total += float(item.get("revenue", 0) or 0)
                        continue

                if isinstance(item, (int, float)):
                    total += float(item)

            return total

        if isinstance(forecast_payload, (int, float)):
            return float(forecast_payload)

        return 0.0

    @staticmethod
    def _calculate_average_price(df: pd.DataFrame) -> float:
        if df.empty:
            return 1.0

        if "Price" in df.columns and df["Price"].gt(0).any():
            average_price = df.loc[df["Price"] > 0, "Price"].mean()
            return float(average_price or 1.0)

        return 1.0

    @staticmethod
    def _estimate_cost(df: pd.DataFrame, actual_sales: float, avg_price: float) -> float:
        if df.empty:
            return max(actual_sales * avg_price * 0.25, 0.0)

        cost_columns = ["Cost", "TotalCost", "FixedCost", "VariableCost", "Expense"]
        total_cost = 0.0
        for column in cost_columns:
            if column in df.columns:
                total_cost += float(df[column].sum(skipna=True) or 0)

        if total_cost > 0:
            return total_cost

        if "Sales" in df.columns and actual_sales > 0:
            return actual_sales * avg_price * 0.25

        return 0.0

    @staticmethod
    def _calculate_summary_metrics(df: pd.DataFrame, forecast_revenue: float, actual_revenue: float) -> Dict[str, Any]:
        total_units = 0.0
        if not df.empty and "Sales" in df.columns:
            total_units = float(df["Sales"].sum(skipna=True) or 0)

        inventory_health = "Unknown"
        if not df.empty and "Inventory" in df.columns:
            inventory_level = float(df["Inventory"].mean(skipna=True) or 0)
            inventory_health = (
                "Healthy"
                if inventory_level < 100
                else "Needs review"
            )

        growth_rate = 0.0
        if actual_revenue:
            growth_rate = (forecast_revenue - actual_revenue) / actual_revenue

        top_product = None
        if not df.empty and "Product" in df.columns and "Sales" in df.columns:
            product_sales = df.groupby("Product")["Sales"].sum().sort_values(ascending=False)
            if not product_sales.empty:
                top_product = product_sales.index[0]

        return {
            "revenue_growth_rate": round(growth_rate * 100, 2),
            "cost_per_unit": round((actual_revenue / total_units) if total_units > 0 else 0.0, 2),
            "inventory_health": inventory_health,
            "top_product": top_product or "N/A",
        }

    @staticmethod
    def calculate_revenue_forecast(project: ForecastProject, db: Session) -> Dict[str, Any]:
        df = ExecutiveAnalyticsService._normalize_dataframe(
            ExecutiveAnalyticsService._load_project_datasets(project)
        )
        avg_price = ExecutiveAnalyticsService._calculate_average_price(df)

        actual_sales = float(df["Sales"].sum(skipna=True) if "Sales" in df.columns else 0)
        actual_revenue = round(actual_sales * avg_price, 2)

        project_forecasts = db.query(ProjectForecast).filter(
            ProjectForecast.project_id == project.id
        ).all()

        forecast_revenue = 0.0
        for project_forecast in project_forecasts:
            if not project_forecast.forecast:
                continue

            forecast_payload = ExecutiveAnalyticsService._parse_forecast_values(
                project_forecast.forecast.forecast_values
            )
            forecast_revenue += ExecutiveAnalyticsService._extract_revenue_from_forecast(
                forecast_payload,
                avg_price,
            )

        return {
            "project_id": project.id,
            "project_name": project.name,
            "actual_revenue": round(actual_revenue, 2),
            "forecast_revenue": round(forecast_revenue, 2),
            "revenue_variance": round(forecast_revenue - actual_revenue, 2),
            "variance_percentage": round(
                ((forecast_revenue - actual_revenue) / actual_revenue * 100)
                if actual_revenue > 0
                else 0.0,
                2,
            ),
            "average_price": round(avg_price, 2),
            "forecast_count": len(project_forecasts),
        }

    @staticmethod
    def calculate_profit_analysis(project: ForecastProject, db: Session) -> Dict[str, Any]:
        df = ExecutiveAnalyticsService._normalize_dataframe(
            ExecutiveAnalyticsService._load_project_datasets(project)
        )
        avg_price = ExecutiveAnalyticsService._calculate_average_price(df)

        actual_sales = float(df["Sales"].sum(skipna=True) if "Sales" in df.columns else 0)
        actual_revenue = round(actual_sales * avg_price, 2)
        actual_cost = round(
            ExecutiveAnalyticsService._estimate_cost(df, actual_sales, avg_price),
            2,
        )
        actual_profit = round(actual_revenue - actual_cost, 2)
        actual_margin = round((actual_profit / actual_revenue * 100), 2) if actual_revenue > 0 else 0.0

        revenue_data = ExecutiveAnalyticsService.calculate_revenue_forecast(project, db)
        forecast_cost = round(actual_cost * 0.95, 2)
        forecast_profit = round(revenue_data["forecast_revenue"] - forecast_cost, 2)
        forecast_margin = round((forecast_profit / revenue_data["forecast_revenue"] * 100), 2) if revenue_data["forecast_revenue"] > 0 else 0.0

        return {
            "project_id": project.id,
            "project_name": project.name,
            "actual_cost": actual_cost,
            "forecast_cost": forecast_cost,
            "cost_variance": round(forecast_cost - actual_cost, 2),
            "actual_profit": actual_profit,
            "forecast_profit": forecast_profit,
            "actual_margin_percentage": actual_margin,
            "forecast_margin_percentage": forecast_margin,
        }

    @staticmethod
    def calculate_cost_analysis(project: ForecastProject, db: Session) -> Dict[str, Any]:
        df = ExecutiveAnalyticsService._normalize_dataframe(
            ExecutiveAnalyticsService._load_project_datasets(project)
        )

        if df.empty:
            return {
                "project_id": project.id,
                "project_name": project.name,
                "total_cost": 0.0,
                "cost_breakdown": {},
                "cost_by_category": [],
                "cost_by_region": [],
                "key_findings": [
                    "No dataset available for cost analysis."
                ],
            }

        cost_columns = ["Cost", "TotalCost", "FixedCost", "VariableCost", "Expense"]
        cost_breakdown = {}
        total_cost = 0.0
        for column in cost_columns:
            if column in df.columns:
                column_sum = float(df[column].sum(skipna=True) or 0)
                if column_sum > 0:
                    cost_breakdown[column] = round(column_sum, 2)
                    total_cost += column_sum

        if total_cost == 0.0:
            total_cost = round(df["Sales"].sum(skipna=True) * ExecutiveAnalyticsService._calculate_average_price(df) * 0.25, 2)
            cost_breakdown["estimated_cost"] = total_cost

        cost_by_category = []
        if "Category" in df.columns and "Cost" in df.columns:
            category_totals = df.groupby("Category")["Cost"].sum().reset_index()
            cost_by_category = [
                {"category": row["Category"], "cost": round(float(row["Cost"] or 0), 2)}
                for _, row in category_totals.iterrows()
            ]

        cost_by_region = []
        if "Region" in df.columns and "Cost" in df.columns:
            region_totals = df.groupby("Region")["Cost"].sum().reset_index()
            cost_by_region = [
                {"region": row["Region"], "cost": round(float(row["Cost"] or 0), 2)}
                for _, row in region_totals.iterrows()
            ]

        return {
            "project_id": project.id,
            "project_name": project.name,
            "total_cost": round(total_cost, 2),
            "cost_breakdown": cost_breakdown,
            "cost_by_category": cost_by_category,
            "cost_by_region": cost_by_region,
            "key_findings": [
                "Projected cost structure generated from available dataset columns."
            ],
        }

    @staticmethod
    def calculate_kpi_summary(project: ForecastProject, db: Session) -> Dict[str, Any]:
        revenue_data = ExecutiveAnalyticsService.calculate_revenue_forecast(project, db)
        profit_data = ExecutiveAnalyticsService.calculate_profit_analysis(project, db)
        df = ExecutiveAnalyticsService._normalize_dataframe(
            ExecutiveAnalyticsService._load_project_datasets(project)
        )

        extra_metrics = ExecutiveAnalyticsService._calculate_summary_metrics(
            df,
            revenue_data["forecast_revenue"],
            revenue_data["actual_revenue"],
        )

        kpi_metrics = [
            {
                "kpi_name": "Revenue Forecast",
                "current_value": revenue_data["actual_revenue"],
                "forecast_value": revenue_data["forecast_revenue"],
                "target_value": None,
                "variance_percentage": revenue_data["variance_percentage"],
                "trend": "up" if revenue_data["variance_percentage"] >= 0 else "down",
                "unit": "USD",
            },
            {
                "kpi_name": "Profit Margin",
                "current_value": profit_data["actual_margin_percentage"],
                "forecast_value": profit_data["forecast_margin_percentage"],
                "target_value": 20.0,
                "variance_percentage": round(
                    profit_data["forecast_margin_percentage"] - profit_data["actual_margin_percentage"],
                    2,
                ),
                "trend": "up" if profit_data["forecast_margin_percentage"] >= profit_data["actual_margin_percentage"] else "down",
                "unit": "%",
            },
            {
                "kpi_name": "Cost per Unit",
                "current_value": extra_metrics["cost_per_unit"],
                "forecast_value": None,
                "target_value": None,
                "variance_percentage": 0.0,
                "trend": "stable",
                "unit": "USD",
            },
            {
                "kpi_name": "Growth Rate",
                "current_value": 0.0,
                "forecast_value": extra_metrics["revenue_growth_rate"],
                "target_value": None,
                "variance_percentage": extra_metrics["revenue_growth_rate"],
                "trend": "up" if extra_metrics["revenue_growth_rate"] >= 0 else "down",
                "unit": "%",
            },
        ]

        return {
            "project_id": project.id,
            "project_name": project.name,
            "top_product": extra_metrics["top_product"],
            "inventory_health": extra_metrics["inventory_health"],
            "kpis": kpi_metrics,
        }

    @staticmethod
    def get_executive_overview(project: ForecastProject, db: Session) -> Dict[str, Any]:
        revenue = ExecutiveAnalyticsService.calculate_revenue_forecast(project, db)
        profit = ExecutiveAnalyticsService.calculate_profit_analysis(project, db)
        cost = ExecutiveAnalyticsService.calculate_cost_analysis(project, db)
        kpis = ExecutiveAnalyticsService.calculate_kpi_summary(project, db)

        return {
            "project_id": project.id,
            "project_name": project.name,
            "revenue_forecast": revenue,
            "profit_analysis": profit,
            "cost_analysis": cost,
            "kpi_summary": kpis,
            "updated_at": datetime.utcnow().isoformat(),
        }
