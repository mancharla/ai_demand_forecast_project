from pydantic import BaseModel

class DatasetResponse(BaseModel):

    id: int

    file_name: str

    file_path: str

    user_id: int

    class Config:

        from_attributes = True