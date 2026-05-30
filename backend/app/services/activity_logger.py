from sqlalchemy.orm import Session

from app.models import UserActivityLog


def log_activity(
    db: Session,
    user_id: int | None,
    action: str,
    description: str = "",
    module: str = "",
):
    log = UserActivityLog(
        user_id=user_id,
        action=action,
        description=description,
        module=module,
    )

    db.add(log)