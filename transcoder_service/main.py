import logging
import asyncio
import time
from kafka.kafka import KafkaConsumer

logger = logging.getLogger(__name__)

async def consume():
    consumer = KafkaConsumer("transcode", f"transcode_consumer_group_id_{time.time()}")
    await consumer.consume()

if __name__ == "__main__":
    try:
        asyncio.run(consume())
    except Exception as e:
        logger.error(f"Fatal error in main: {e}")