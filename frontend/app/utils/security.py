from passlib.context import CryptContext
from jose import jwt, JWTError

from datetime import datetime, timedelta

from fastapi import HTTPException

# PASSWORD HASHING
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# JWT SETTINGS
SECRET_KEY = "MYSECRETKEY"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 120

# HASH PASSWORD
def hash_password(password: str):

    password = password[:72]

    return pwd_context.hash(password)

# VERIFY PASSWORD
def verify_password(
    plain_password,
    hashed_password
):

    plain_password = plain_password[:72]

    return pwd_context.verify(
        plain_password,
        hashed_password
    )

# CREATE JWT TOKEN
def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

# VERIFY TOKEN
def verify_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid Token"
            )

        return email

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Token Expired or Invalid"
        )   