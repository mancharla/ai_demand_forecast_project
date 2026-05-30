# AI Demand Forecasting System

## Overview

AI Demand Forecasting System is a full-stack application that helps businesses predict future product demand using machine learning models and advanced analytics.

The platform provides forecasting, business insights, inventory optimization, automated scheduling, model comparison, reporting, and interactive dashboards.

---

## Features

### Authentication

* User Registration
* User Login
* JWT Authentication
* Role-Based Access Control

### Dataset Management

* CSV Upload
* Excel Upload
* Dataset Validation
* User-Specific Dataset Storage

### Forecasting

* Linear Regression
* Random Forest
* XGBoost

### Dashboard Analytics

* KPI Cards
* Revenue Analytics
* Region Analytics
* Category Analytics
* Seasonal Trends
* Inventory Risk Detection
* Sales Anomaly Detection

### AI Recommendations

* Demand Recommendations
* Inventory Optimization
* Demand Spike Detection
* Customer Buying Behavior

### Model Comparison

* Multi-Model Evaluation
* Accuracy Comparison
* MAE Comparison
* RMSE Comparison
* MAPE Comparison

### Reports

* Dashboard Summary Export
* Excel Reports
* PDF Reports
* Model Comparison Reports

### Automation

* Forecast Scheduling
* Daily Forecasts
* Weekly Forecasts
* Monthly Forecasts

### Alerts

* Demand Spike Alerts
* Low Stock Alerts
* Forecast Failure Alerts

### Enterprise Features

* API Integrations
* Webhook Integrations
* Dashboard Widgets
* Scheduler Monitoring

---

## Technology Stack

### Frontend

* React.js
* Tailwind CSS
* Axios
* Recharts

### Backend

* FastAPI
* SQLAlchemy
* JWT Authentication
* APScheduler

### Machine Learning

* Scikit-Learn
* XGBoost
* Pandas
* NumPy

### Database

* MySQL

---

## Project Structure

backend/

* app/

  * routers/
  * services/
  * models/
  * schemas/
  * utils/

frontend/

* src/

  * pages/
  * components/
  * api/

---

## Installation

### Backend

pip install -r requirements.txt

uvicorn app.main:app --reload

### Frontend

npm install

npm run dev

---

## Future Enhancements

* Deep Learning Models
* Real-Time Forecast Streaming
* Mobile Application
* Cloud Deployment
* Advanced Explainable AI

---


=======
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
>>>>>>> 1ff9601c740706a92150fc37c95c25553b186041
