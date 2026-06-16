from app.models_extended import OrganizationAuditLog


def log_audit(
    db,
    user_id=None,
    organization_id=None,
    module_name="System",
    action="ACTION",
    description=None,
    ip_address=None,
):
    log = OrganizationAuditLog(
        user_id=user_id,
        organization_id=organization_id,
        module_name=module_name,
        action=action,
        description=description,
        ip_address=ip_address,
    )

    db.add(log)
    db.commit()

    return log