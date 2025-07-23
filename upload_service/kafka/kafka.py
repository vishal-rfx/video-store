from dotenv import load_dotenv
import os

from aiokafka import AIOKafkaProducer

load_dotenv(override=True)

class KafkaConfig:
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_SERVER_URI", "kafka:29092")
        self.security_protocol = "PLAINTEXT"

    def to_dict(self):
        return {
            "bootstrap_servers": self.bootstrap_servers,
            "security_protocol": self.security_protocol,
        }


class KafkaProducer:
    def __init__(self, topic):
        self.__config = KafkaConfig()
        self.__producer = AIOKafkaProducer(**self.__config.to_dict())
        self.__topic = topic

    async def send(self, msg):
        await self.__producer.start()
        try:
            await self.__producer.send_and_wait(self.__topic, msg)
        finally:
            await self.__producer.stop()


