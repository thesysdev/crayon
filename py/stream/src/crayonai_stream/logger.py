import logging

# Create a logger for your library
logger = logging.getLogger("crayonai_stream")
# By default, don't output any logs
logger.addHandler(logging.NullHandler())


def setup_logging(level: int = logging.INFO) -> None:
    """
    Configure logging for the library.
    Users can call this function to enable logging with their desired level.

    Args:
        level: The logging level (e.g., logging.INFO, logging.DEBUG, etc.)
    """
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(level)
