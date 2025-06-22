import asyncio

from kafka.kafka import KafkaConsumer

async def consume():
    consumer = KafkaConsumer("TEST", "test_consumer_group_id")
    await consumer.consume()

if __name__ == "__main__":
    asyncio.run(consume())
