import logging
import asyncio
import os
from kafka.kafka import KafkaConsumer

logger = logging.getLogger(__name__)

async def consume():
    # Use a consistent consumer group ID instead of timestamp
    consumer_group_id = os.getenv('KAFKA_CONSUMER_GROUP_ID', 'transcode_consumer_group')
    consumer = KafkaConsumer("transcode", consumer_group_id)
    await consumer.consume()

if __name__ == "__main__":
    try:
        asyncio.run(consume())
    except Exception as e:
        logger.error(f"Fatal error in main: {e}")