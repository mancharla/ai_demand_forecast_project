import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = "your_email@gmail.com"
SMTP_PASSWORD = "your_app_password"


def send_email_notification(to_email: str, subject: str, message: str):
    try:
        email = MIMEMultipart()
        email["From"] = SMTP_EMAIL
        email["To"] = to_email
        email["Subject"] = subject

        email.attach(MIMEText(message, "plain"))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, email.as_string())
        server.quit()

        return True

    except Exception as e:
        print("Email sending failed:", e)
        return False