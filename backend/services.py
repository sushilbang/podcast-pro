"""
Service layer for external API interactions.
Handles S3 operations and other third-party services.
"""

import boto3
import logging
from datetime import datetime
from botocore.config import Config
from botocore.exceptions import ClientError
from .config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


class S3Service:
    """Service for handling AWS S3 operations."""

    def __init__(self):
        """Initialize S3 client."""
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name=settings.AWS_REGION,
        )
        self.bucket_name = settings.AWS_S3_BUCKET_NAME

    def generate_presigned_url(self, user_id: str, filename: str) -> dict:
        """
        Generate a presigned POST URL for direct S3 upload.

        Args:
            user_id: Authenticated user ID
            filename: Original filename from user

        Returns:
            Dictionary with 'url' and 'fields' for form-based POST upload

        Raises:
            Exception: If presigned URL generation fails
        """
        try:
            # Organize files as: podcasts/{user_id}/{timestamp}_{filename}
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
            s3_key = f"podcasts/{user_id}/{timestamp}_{filename}"

            # Conditions for the presigned POST
            conditions = [
                ["content-length-range", 1, settings.MAX_FILE_SIZE_MB * 1024 * 1024],
                {"acl": "private"},
                {"key": s3_key},
                ["starts-with", "$Content-Type", "application/pdf"],
            ]

            fields = {
                "acl": "private",
                "Content-Type": "application/pdf",
            }

            response = self.client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                ExpiresIn=3600,
                Conditions=conditions,
                Fields=fields,
            )

            logger.info(f"Generated presigned URL for user {user_id}: {s3_key}")
            logger.debug(f"Presigned POST response fields: {list(response.get('fields', {}).keys())}")
            return response

        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {str(e)}")
            raise Exception("Could not generate upload URL") from e

    def get_file_url(self, s3_key: str) -> str:
        """
        Get the public URL for a file in S3.

        Args:
            s3_key: S3 object key

        Returns:
            Public HTTPS URL to the file
        """
        return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"


# Singleton instance
s3_service = S3Service()
