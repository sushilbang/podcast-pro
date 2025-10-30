"""
Email Mailing Service
Sends email notifications to users about their podcast status.
Supports multiple email providers: SendGrid, AWS SES, etc.
"""

import logging
import os
from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class MailingError(Exception):
    """Raised when email sending fails."""
    pass


class EmailProvider(ABC):
    """Abstract base class for email providers."""

    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> bool:
        """Send an email. Returns True if successful."""
        pass


class SendGridProvider(EmailProvider):
    """SendGrid email provider."""

    def __init__(self, api_key: str):
        """Initialize SendGrid provider."""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content
            self.sendgrid = sendgrid
            self.Mail = Mail
            self.Email = Email
            self.To = To
            self.Content = Content
            self.sg = sendgrid.SendGridAPIClient(api_key)
        except ImportError:
            raise ImportError("sendgrid package not installed. Install with: pip install sendgrid")

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> bool:
        """Send email via SendGrid."""
        try:
            from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@podcast-pro.com")

            message = self.Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                plain_text_content=body_text or "See HTML version",
                html_content=body_html
            )

            response = self.sg.send(message)
            logger.info(f"[MAIL] ✓ Email sent via SendGrid to {to_email}. Status: {response.status_code}")
            return response.status_code in [200, 201, 202]
        except Exception as e:
            logger.error(f"[MAIL] ✗ SendGrid error: {str(e)}")
            raise MailingError(f"Failed to send email via SendGrid: {str(e)}")


class AWSSESProvider(EmailProvider):
    """AWS SES (Simple Email Service) provider."""

    def __init__(self, region: str = "us-east-1"):
        """Initialize AWS SES provider."""
        try:
            import boto3
            self.ses_client = boto3.client('ses', region_name=region)
        except ImportError:
            raise ImportError("boto3 package not installed")

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> bool:
        """Send email via AWS SES."""
        try:
            from_email = os.getenv("SES_FROM_EMAIL", "noreply@podcast-pro.com")

            response = self.ses_client.send_email(
                Source=from_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {
                        'Html': {'Data': body_html, 'Charset': 'UTF-8'},
                        'Text': {'Data': body_text or "See HTML version", 'Charset': 'UTF-8'}
                    }
                }
            )
            logger.info(f"[MAIL] ✓ Email sent via AWS SES to {to_email}. MessageId: {response['MessageId']}")
            return True
        except Exception as e:
            logger.error(f"[MAIL] ✗ AWS SES error: {str(e)}")
            raise MailingError(f"Failed to send email via AWS SES: {str(e)}")


class SMTPProvider(EmailProvider):
    """Generic SMTP provider."""

    def __init__(self, host: str, port: int, username: str, password: str, use_tls: bool = True):
        """Initialize SMTP provider."""
        try:
            import smtplib
            self.smtplib = smtplib
            self.host = host
            self.port = port
            self.username = username
            self.password = password
            self.use_tls = use_tls
        except ImportError:
            raise ImportError("smtplib is part of Python stdlib but may be unavailable")

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> bool:
        """Send email via SMTP."""
        try:
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@podcast-pro.com")

            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = to_email

            # Attach plain text and HTML versions
            if body_text:
                msg.attach(MIMEText(body_text, 'plain'))
            msg.attach(MIMEText(body_html, 'html'))

            # Send via SMTP
            with self.smtplib.SMTP(self.host, self.port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)

            logger.info(f"[MAIL] ✓ Email sent via SMTP to {to_email}")
            return True
        except Exception as e:
            logger.error(f"[MAIL] ✗ SMTP error: {str(e)}")
            raise MailingError(f"Failed to send email via SMTP: {str(e)}")


class MailingService:
    """Main mailing service for sending podcast notifications."""

    def __init__(self, provider: EmailProvider):
        """
        Initialize mailing service with a provider.

        Args:
            provider: EmailProvider instance (SendGrid, AWS SES, SMTP, etc.)
        """
        self.provider = provider

    def send_podcast_ready_email(
        self,
        user_email: str,
        podcast_title: str,
        podcast_duration_seconds: int,
        stream_url: str,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Send notification email when podcast is ready.

        Args:
            user_email: User's email address
            podcast_title: Title of the generated podcast
            podcast_duration_seconds: Duration in seconds
            stream_url: URL to stream/download the podcast
            user_name: Optional user's name for personalization

        Returns:
            True if email sent successfully
        """
        try:
            # Format duration
            minutes = podcast_duration_seconds // 60
            seconds = podcast_duration_seconds % 60

            # Create HTML email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #333;">Your Podcast is Ready! 🎉</h2>

                        <p style="color: #666;">
                            {"Hello " + user_name + "," if user_name else "Hello,"}
                        </p>

                        <p style="color: #666;">
                            Your podcast has been successfully generated and is ready to listen!
                        </p>

                        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                            <h3 style="color: #007bff; margin-top: 0;">{podcast_title}</h3>
                            <p style="color: #666; margin: 10px 0;">
                                <strong>Duration:</strong> {minutes}m {seconds}s
                            </p>
                            <p style="color: #666; margin: 10px 0;">
                                <strong>Generated on:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
                            </p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{stream_url}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                Listen Now
                            </a>
                        </div>

                        <p style="color: #666; font-size: 12px;">
                            The streaming link above is valid for 1 hour. You can also access your podcast from your dashboard.
                        </p>

                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                        <p style="color: #999; font-size: 12px;">
                            Podcast Pro - Transform Your Content into Audio
                        </p>
                    </div>
                </body>
            </html>
            """

            # Create plain text version
            text_body = f"""
Your Podcast is Ready! 🎉

Hello{"" if not user_name else " " + user_name},

Your podcast has been successfully generated and is ready to listen!

PODCAST DETAILS:
Title: {podcast_title}
Duration: {minutes}m {seconds}s
Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}

Listen now: {stream_url}

The streaming link above is valid for 1 hour. You can also access your podcast from your dashboard.

---
Podcast Pro - Transform Your Content into Audio
            """

            # Send email
            subject = f"Your Podcast '{podcast_title}' is Ready! 🎉"
            return self.provider.send_email(
                to_email=user_email,
                subject=subject,
                body_html=html_body,
                body_text=text_body
            )

        except Exception as e:
            logger.error(f"[MAIL] ✗ Failed to send podcast ready email: {str(e)}")
            raise MailingError(f"Failed to send podcast ready email: {str(e)}")

    def send_podcast_failed_email(
        self,
        user_email: str,
        podcast_title: str,
        error_reason: str,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Send notification email when podcast generation fails.

        Args:
            user_email: User's email address
            podcast_title: Title of the podcast attempt
            error_reason: Reason for failure
            user_name: Optional user's name for personalization

        Returns:
            True if email sent successfully
        """
        try:
            # Create HTML email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #d32f2f;">Podcast Generation Failed</h2>

                        <p style="color: #666;">
                            {"Hello " + user_name + "," if user_name else "Hello,"}
                        </p>

                        <p style="color: #666;">
                            Unfortunately, we encountered an issue while generating your podcast.
                        </p>

                        <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                            <h3 style="color: #d32f2f; margin-top: 0;">Generation Error</h3>
                            <p style="color: #666; margin: 10px 0;">
                                <strong>Podcast:</strong> {podcast_title}
                            </p>
                            <p style="color: #666; margin: 10px 0;">
                                <strong>Reason:</strong> {error_reason}
                            </p>
                        </div>

                        <p style="color: #666;">
                            Please check the following:
                        </p>
                        <ul style="color: #666;">
                            <li>Ensure your PDF contains readable text content</li>
                            <li>Verify the PDF is not corrupted or encrypted</li>
                            <li>Try uploading a different PDF file</li>
                        </ul>

                        <p style="color: #666;">
                            If the issue persists, please contact our support team.
                        </p>

                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                        <p style="color: #999; font-size: 12px;">
                            Podcast Pro - Transform Your Content into Audio
                        </p>
                    </div>
                </body>
            </html>
            """

            # Create plain text version
            text_body = f"""
Podcast Generation Failed

Hello{"" if not user_name else " " + user_name},

Unfortunately, we encountered an issue while generating your podcast.

FAILED PODCAST:
Title: {podcast_title}
Reason: {error_reason}

Please check the following:
- Ensure your PDF contains readable text content
- Verify the PDF is not corrupted or encrypted
- Try uploading a different PDF file

If the issue persists, please contact our support team.

---
Podcast Pro - Transform Your Content into Audio
            """

            # Send email
            subject = f"Podcast Generation Failed: {podcast_title}"
            return self.provider.send_email(
                to_email=user_email,
                subject=subject,
                body_html=html_body,
                body_text=text_body
            )

        except Exception as e:
            logger.error(f"[MAIL] ✗ Failed to send podcast failed email: {str(e)}")
            raise MailingError(f"Failed to send podcast failed email: {str(e)}")


# Initialize mailing service based on environment
def get_mailing_service() -> Optional[MailingService]:
    """
    Get mailing service instance based on environment variables.

    Supported providers (in order of preference):
    1. SendGrid (SENDGRID_API_KEY)
    2. AWS SES (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY)
    3. SMTP (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD)

    Returns:
        MailingService instance or None if no provider is configured
    """
    try:
        # Try SendGrid
        sendgrid_key = os.getenv("SENDGRID_API_KEY")
        if sendgrid_key:
            logger.info("[MAIL] Initializing SendGrid provider")
            provider = SendGridProvider(sendgrid_key)
            return MailingService(provider)

        # Try AWS SES
        aws_key = os.getenv("AWS_ACCESS_KEY_ID")
        if aws_key:
            logger.info("[MAIL] Initializing AWS SES provider")
            region = os.getenv("AWS_REGION", "us-east-1")
            provider = AWSSESProvider(region)
            return MailingService(provider)

        # Try SMTP
        smtp_host = os.getenv("SMTP_HOST")
        if smtp_host:
            logger.info("[MAIL] Initializing SMTP provider")
            provider = SMTPProvider(
                host=smtp_host,
                port=int(os.getenv("SMTP_PORT", "587")),
                username=os.getenv("SMTP_USERNAME", ""),
                password=os.getenv("SMTP_PASSWORD", ""),
                use_tls=os.getenv("SMTP_USE_TLS", "true").lower() == "true"
            )
            return MailingService(provider)

        # No provider configured
        logger.warning("[MAIL] No mailing provider configured. Email notifications disabled.")
        return None

    except Exception as e:
        logger.error(f"[MAIL] Failed to initialize mailing service: {str(e)}")
        return None
