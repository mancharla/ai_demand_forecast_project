import pandas as pd
import random
from datetime import datetime, timedelta

products = [
    "Laptop", "Mobile", "Tablet", "Headphones",
    "Smart Watch", "Keyboard", "Mouse",
    "Monitor", "Speaker", "Printer"
]

categories = [
    "Electronics",
    "Accessories",
    "Wearables"
]

regions = [
    "Hyderabad",
    "Bangalore",
    "Chennai",
    "Mumbai",
    "Delhi",
    "Pune",
    "Kolkata"
]

start_date = datetime(2022, 1, 1)

rows = []

for i in range(15000):

    date = start_date + timedelta(days=random.randint(0, 1200))

    product = random.choice(products)

    if product in ["Laptop", "Mobile", "Tablet"]:
        category = "Electronics"
    elif product in ["Smart Watch"]:
        category = "Wearables"
    else:
        category = "Accessories"

    region = random.choice(regions)

    sales = random.randint(1000, 50000)

    rows.append([
        date.strftime("%Y-%m-%d"),
        product,
        category,
        region,
        sales
    ])

df = pd.DataFrame(
    rows,
    columns=[
        "Date",
        "Product",
        "Category",
        "Region",
        "Sales"
    ]
)

df.to_csv(
    "advanced_demand_forecasting_dataset.csv",
    index=False
)

print("Dataset generated successfully!")
print("Rows:", len(df))