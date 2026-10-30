"""
Adora AI — Structured Logging Setup
"""

import logging
import sys
from app.core.config import settings

def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] [Adora] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

logger = logging.getLogger("adora")
