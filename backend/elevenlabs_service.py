"""
ElevenLabs API service for managing credits and account information.
"""

import logging
from elevenlabs.client import ElevenLabs
import os

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not ELEVENLABS_API_KEY:
    logger.warning("[ELEVENLABS] ⚠️ No API key provided. Credits will be unavailable.")
    elevenlabs_client = None
else:
    elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)


def get_elevenlabs_credits() -> dict:
    """
    Fetch ElevenLabs account credits and subscription information.

    Returns:
        dict: Account information including:
            - character_count: Characters used in current period
            - character_limit: Total character limit
            - characters_available: Characters remaining
            - can_create_professional_voice: Whether user can create pro voices
            - status: Account status

    Raises:
        Exception: If unable to fetch credits from ElevenLabs API
    """
    if not elevenlabs_client:
        raise Exception("ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in your .env file.")

    try:
        # Fetch subscription information by calling get()
        subscription = elevenlabs_client.user.subscription.get()

        if not subscription:
            raise Exception("Could not retrieve subscription information")

        # Extract relevant credit information
        character_limit = subscription.character_limit
        character_count = subscription.character_count
        characters_available = character_limit - character_count

        # Calculate percentage used
        usage_percentage = (character_count / character_limit * 100) if character_limit > 0 else 0

        logger.info(
            f"[ELEVENLABS] Credits fetched. Used: {character_count}/{character_limit} "
            f"({usage_percentage:.1f}%), Available: {characters_available}"
        )

        return {
            "character_count": character_count,
            "character_limit": character_limit,
            "characters_available": characters_available,
            "usage_percentage": round(usage_percentage, 2),
            "can_create_professional_voice": getattr(subscription, "can_create_professional_voice", False),
            "status": "active"
        }

    except Exception as e:
        logger.error(f"[ELEVENLABS] Failed to fetch credits: {str(e)}")
        raise


def has_sufficient_credits(required_characters: int = 5000) -> bool:
    """
    Check if account has sufficient credits for podcast generation.

    Args:
        required_characters: Estimated characters needed for one podcast (default 5000)

    Returns:
        bool: True if sufficient credits available, False otherwise
    """
    try:
        credits = get_elevenlabs_credits()
        has_credits = credits["characters_available"] >= required_characters

        if has_credits:
            logger.info(f"[ELEVENLABS] ✓ Sufficient credits available for generation")
        else:
            logger.warning(
                f"[ELEVENLABS] ✗ Insufficient credits. Need {required_characters}, "
                f"have {credits['characters_available']}"
            )

        return has_credits
    except Exception as e:
        logger.error(f"[ELEVENLABS] Error checking credits: {str(e)}")
        return False


__all__ = ["get_elevenlabs_credits", "has_sufficient_credits"]
