import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:Mancharla%40264@localhost/demand_forecasting"
)

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "ai-demand-forecasting-secret-key-2026"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440)
)