import json
from dotenv import load_dotenv
import os
import ssl
import asyncio
import traceback

from aiokafka import AIOKafkaConsumer
from transcode import transcode_s3_to_s3

load_dotenv(override=True)

class KafkaConfig:
    def __init__(self, consumer_group_id: str):
        self.bootstrap_servers = os.getenv("KAFKA_SERVER_URI")
        self.security_protocol = "SASL_SSL"
        self.sasl_mechanism = "SCRAM-SHA-256"
        self.sasl_plain_username = os.getenv("KAFKA_USER")
        self.sasl_plain_password = os.getenv("KAFKA_PASSWORD")
        self.group_id = consumer_group_id
        self.ssl_ctx = ssl.create_default_context(cafile=os.getenv("KAFKA_CA_FILE"))

    def to_dict(self):
        return {
            "bootstrap_servers": self.bootstrap_servers,
            "security_protocol": self.security_protocol,
            "sasl_mechanism": self.sasl_mechanism,
            "sasl_plain_username": self.sasl_plain_username,
            "sasl_plain_password": self.sasl_plain_password,
            "ssl_context": self.ssl_ctx,
            "group_id" : self.group_id
        }

class KafkaConsumer:
    def __init__(self, topic: str, consumer_group_id: str):
        self.__config = KafkaConfig(consumer_group_id)
        self.__consumer = AIOKafkaConsumer((topic), auto_offset_reset="earliest" , **self.__config.to_dict())

    async def consume(self):
        print('Consuming...')
        await self.__consumer.start()
        try:
            async for msg in self.__consumer:
                try:
                    print(f"Received: topic={msg.topic}, value={msg.value.decode()}")
                    data = json.loads(msg.value.decode())
                    await asyncio.to_thread(transcode_s3_to_s3, data['key'])
                except Exception as e:
                    print("Error in transcoding", str(e))
                    print(traceback.format_exc())
        finally:
            await self.__consumer.stop()

