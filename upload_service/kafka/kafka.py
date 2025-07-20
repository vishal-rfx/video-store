from dotenv import load_dotenv
import os
import ssl


from aiokafka import AIOKafkaProducer

load_dotenv(override=True)

class KafkaConfig:
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_SERVER_URI")
        self.security_protocol = "SASL_SSL"
        self.sasl_mechanism = "SCRAM-SHA-256"
        self.sasl_plain_username = os.getenv("KAFKA_USER")
        self.sasl_plain_password = os.getenv("KAFKA_PASSWORD")
        self.ssl_cafile = os.getenv("KAFKA_CA_FILE")
        self.ssl_ctx = ssl.create_default_context(cafile=os.getenv('KAFKA_CA_FILE'))

    def to_dict(self):
        return {
            "bootstrap_servers": self.bootstrap_servers,
            "security_protocol": self.security_protocol,
            "sasl_mechanism": self.sasl_mechanism,
            "sasl_plain_username": self.sasl_plain_username,
            "sasl_plain_password": self.sasl_plain_password,
            "ssl_context": self.ssl_ctx
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


