import os
import pandas as pd

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.dataset import Dataset
from app.models.forecast import Forecast
from app.models.user import User
from app.models.notification import Notification
from app.utils.security import verify_token


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"]
)

security = HTTPBearer()

UPLOAD_FOLDER = "app/uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials: HTTPAuthorizationCredentials, db: Session):
    token = credentials.credentials
    email = verify_token(token)

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    allowed_extensions = [".csv", ".xlsx"]

    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are allowed"
        )

    safe_filename = f"{user.id}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        if file_extension == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

    except Exception:
        notification = Notification(
            user_id=user.id,
            title="Dataset Upload Failed",
            message=f"{file.filename} could not be uploaded because the file format is invalid"
        )

        db.add(notification)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid file format"
        )

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.replace("\ufeff", "", regex=False)
    )

    df.drop_duplicates(inplace=True)
    df.fillna(0, inplace=True)

    if df.empty:
        notification = Notification(
            user_id=user.id,
            title="Dataset Upload Failed",
            message=f"{file.filename} is empty"
        )

        db.add(notification)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Uploaded dataset is empty"
        )

    if file_extension == ".csv":
        df.to_csv(file_path, index=False)
    else:
        df.to_excel(file_path, index=False)

    dataset = Dataset(
        file_name=file.filename,
        file_path=file_path,
        user_id=user.id
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    notification = Notification(
        user_id=user.id,
        title="Dataset Uploaded",
        message=f"{dataset.file_name} uploaded successfully"
    )

    db.add(notification)
    db.commit()

    return {
        "message": "Dataset Uploaded Successfully",
        "dataset_id": dataset.id,
        "file_name": dataset.file_name,
        "rows": int(len(df)),
        "columns": list(df.columns)
    }


@router.get("/my-datasets")
def get_my_datasets(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == user.id)
        .order_by(Dataset.id.desc())
        .all()
    )

    return [
        {
            "id": dataset.id,
            "file_name": dataset.file_name,
            "file_path": dataset.file_path,
            "uploaded_at": str(getattr(dataset, "uploaded_at", ""))
        }
        for dataset in datasets
    ]


@router.get("/{dataset_id}")
def get_dataset_details(
    dataset_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found")

    try:
        if dataset.file_path.endswith(".csv"):
            df = pd.read_csv(dataset.file_path)
        else:
            df = pd.read_excel(dataset.file_path)

    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read dataset")

    return {
        "id": dataset.id,
        "file_name": dataset.file_name,
        "rows": int(len(df)),
        "columns": list(df.columns)
    }


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = get_current_user(credentials, db)

    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    db.query(Forecast).filter(
        Forecast.dataset_id == dataset.id
    ).delete()

    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)

    db.delete(dataset)

    notification = Notification(
        user_id=user.id,
        title="Dataset Deleted",
        message=f"{dataset.file_name} deleted successfully"
    )

    db.add(notification)
    db.commit()

    return {
        "message": "Dataset deleted successfully"
    }