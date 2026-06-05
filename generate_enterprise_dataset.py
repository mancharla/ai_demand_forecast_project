import pandas as pd
import random
from datetime import datetime, timedelta

# Configuration
ROWS = 50000

products = [
    "Laptop",
    "Mobile",
    "Tablet",
    "Smart Watch",
    "Headphones",
    "Speaker",
    "Keyboard",
    "Mouse",
    "Monitor",
    "Printer"
]

categories = {
    "Laptop": "Electronics",
    "Mobile": "Electronics",
    "Tablet": "Electronics",
    "Monitor": "Electronics",
    "Printer": "Electronics",
    "Smart Watch": "Wearables",
    "Headphones": "Accessories",
    "Speaker": "Accessories",
    "Keyboard": "Accessories",
    "Mouse": "Accessories",
}

regions = [
    "Hyderabad",
    "Bangalore",
    "Chennai",
    "Mumbai",
    "Delhi",
    "Pune",
    "Kolkata"
]

customer_segments = [
    "Consumer",
    "Corporate",
    "Home Office",
    "Enterprise"
]

start_date = datetime(2022, 1, 1)

data = []

for _ in range(ROWS):

    date = start_date + timedelta(
        days=random.randint(0, 1200)
    )

    product = random.choice(products)

    category = categories[product]

    region = random.choice(regions)

    customer_segment = random.choice(customer_segments)

    # Seasonal demand
    month = date.month

    seasonal_factor = 1

    if month in [10, 11, 12]:
        seasonal_factor = 1.5

    elif month in [6, 7]:
        seasonal_factor = 1.2

    price = random.randint(500, 80000)

    quantity = int(
        random.randint(1, 50) * seasonal_factor
    )

    discount = round(
        random.uniform(0, 30),
        2
    )

    sales = round(
        price * quantity * (1 - discount / 100),
        2
    )

    cost = price * 0.7

    profit = round(
        sales - (cost * quantity),
        2
    )

    data.append([
        date.strftime("%Y-%m-%d"),
        product,
        category,
        region,
        sales,
        price,
        quantity,
        profit,
        discount,
        customer_segment,
    ])

df = pd.DataFrame(
    data,
    columns=[
        "Date",
        "Product",
        "Category",
        "Region",
        "Sales",
        "Price",
        "Quantity",
        "Profit",
        "Discount",
        "Customer_Segment",
    ]
)

df.to_csv(
    "enterprise_demand_forecasting_dataset.csv",
    index=False
)

print("Dataset Generated Successfully")
print("Rows:", len(df))
print("File: enterprise_demand_forecasting_dataset.csv")