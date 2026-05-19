import pandas as pd
import random
from datetime import datetime, timedelta

products = [
    ("Laptop", "Electronics"),
    ("Mobile", "Electronics"),
    ("Headphones", "Electronics"),
    ("Smart Watch", "Electronics"),
    ("Tablet", "Electronics"),
    ("Shoes", "Fashion"),
    ("T-Shirt", "Fashion"),
    ("Jeans", "Fashion"),
    ("Jacket", "Fashion"),
    ("Backpack", "Accessories"),
    ("Rice", "Grocery"),
    ("Wheat", "Grocery"),
    ("Oil", "Grocery"),
    ("Milk", "Grocery"),
    ("Biscuits", "Grocery"),
]

regions = [
    "Hyderabad",
    "Bangalore",
    "Chennai",
    "Mumbai",
    "Delhi",
    "Pune",
    "Kolkata",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
]

rows = []
start_date = datetime(2023, 1, 1)

total_rows = 50000   # change to 100000 or 500000 if needed

for i in range(total_rows):
    product, category = random.choice(products)
    region = random.choice(regions)

    date = start_date + timedelta(days=random.randint(0, 730))

    base_sales = random.randint(50, 500)

    # seasonal boost
    if date.month in [10, 11, 12]:
        base_sales += random.randint(100, 300)

    # electronics usually higher demand
    if category == "Electronics":
        base_sales += random.randint(100, 400)

    # grocery steady demand
    if category == "Grocery":
        base_sales += random.randint(50, 150)

    price = random.randint(100, 80000)

    discount = random.choice([0, 5, 10, 15, 20, 25, 30])

    promotion = random.choice(["Yes", "No"])

    if promotion == "Yes":
        base_sales += random.randint(50, 200)

    stock_available = random.randint(100, 5000)

    rows.append({
        "Date": date.strftime("%Y-%m-%d"),
        "Product": product,
        "Category": category,
        "Region": region,
        "Sales": base_sales,
        "Price": price,
        "Discount": discount,
        "Promotion": promotion,
        "Stock_Available": stock_available,
    })

df = pd.DataFrame(rows)

df.to_csv("large_demand_forecasting_dataset.csv", index=False)

print("Large dataset created successfully!")
print("Rows:", len(df))
print("File: large_demand_forecasting_dataset.csv")