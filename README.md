# AI Demand Forecasting System

An end-to-end full-stack web application that uses Machine Learning to forecast future product demand from historical sales data. The system helps businesses predict sales, identify top-demand products, generate reports, and receive actionable inventory recommendations.

---

## Project Overview

The AI Demand Forecasting System allows users to:

- Register and log in securely
- Upload CSV or Excel datasets
- Generate demand forecasts using Machine Learning
- Compare model performance
- Visualize analytics on dashboards
- Download PDF and Excel reports
- Receive notifications
- Access an Admin Panel for full system monitoring

This project is built with:

- **Frontend:** React.js + Tailwind CSS + Vite
- **Backend:** FastAPI
- **Database:** MySQL
- **Machine Learning:** Scikit-learn
- **Reports:** ReportLab + OpenPyXL

---

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Forgot and reset password

### Dataset Management
- Upload CSV and Excel files
- Validate file formats
- Store dataset metadata
- Delete datasets

### Machine Learning Forecasting
- Linear Regression
- Random Forest Regressor
- Automatic model comparison
- Best model selection
- Product-level demand prediction

### Dashboard Analytics
- Total sales
- Top products
- Region-wise sales
- Category-wise sales
- Monthly sales trends
- Forecast vs actual charts

### Reporting
- Excel report generation
- PDF report generation

### Notifications
- Upload success/failure notifications
- Forecast completion notifications
- Report generation notifications

### Admin Panel
- View all users
- Manage datasets
- View forecasts
- Export system reports
- Change user roles

---

## Machine Learning Algorithms Used

### Linear Regression
A simple algorithm that models the relationship between input features and sales using a linear equation.

**Advantages**
- Fast training
- Easy to interpret
- Good baseline model

### Random Forest Regressor
An ensemble algorithm that combines multiple decision trees.

**Advantages**
- Captures non-linear patterns
- More accurate for complex data
- Handles feature interactions

### Model Selection Strategy
Both models are trained and evaluated using:
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- MAPE (Mean Absolute Percentage Error)

The model with the lowest RMSE is selected automatically.

---

## Machine Learning Pipeline

1. Data Upload
2. Data Validation
3. Data Cleaning
4. Feature Engineering
5. Train-Test Split
6. Model Training
7. Model Evaluation
8. Best Model Selection
9. Forecast Generation
10. Inventory Recommendation
11. Report Generation

---

## Input Dataset Format

Required columns:

| Column   | Description |
|-------|-------|
| Date | Transaction date |
| Product | Product name |
| Sales | Historical sales quantity |

Optional columns:

| Column | Description |
|------|------|
| Region | Sales region |
| Category | Product category |

Example:

| Date | Product | Sales | Region | Category |
|------|------|------:|------|------|
| 2025-01-01 | Laptop | 120 | Hyderabad | Electronics |
| 2025-01-02 | Mobile | 85 | Chennai | Electronics |

---

## Feature Engineering

From the Date column:
- Year
- Month
- Day
- Day of Week

Categorical Encoding:
- Product → product_code
- Region → region_code
- Category → category_code

---

## Forecast Output

The system returns:
- Predicted sales for each product
- Top demand product
- Model used
- Model comparison metrics
- Inventory recommendations

---

## Inventory Recommendations

Based on predicted sales:

| Predicted Sales | Recommendation |
|------:|------|
| > 10000 | Increase Inventory |
| 3000–10000 | Maintain Inventory |
| < 3000 | Reduce Inventory |

---

## Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- Recharts

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Passlib
- Python-Jose
- Pandas
- NumPy
- Scikit-learn
- OpenPyXL
- ReportLab

### Database
- MySQL
- PyMySQL

---

## Project Structure

```text
ai-demand-forecasting/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── models.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
└── README.md
