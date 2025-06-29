import json
import logging
import traceback

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import upload
from pydantic import BaseModel

from kafka.kafka import KafkaProducer

class Message(BaseModel):
    message: str

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
load_dotenv(override=True)

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"]
)

app.include_router(upload.router, prefix="/upload", tags=["Upload"])


@app.get("/")
async def home():
    """
    Home endpoint that indicates the service is up.
    """
    return {"message": "Service is Up!"}


@app.post("/produce")
async def produce(msg: Message):
    """
    Produces a message to a Kafka topic.

    This endpoint receives a JSON payload, serializes it, and sends it to a Kafka topic
    using the KafkaProducer class. If an error occurs during the process, it logs the error
    and returns an HTTP 500 response.

    Args:
        msg (Message): The message payload to be sent to Kafka.

    Returns:
        dict: A dictionary containing a success message if the message is produced successfully.

    Raises:
        HTTPException: If an error occurs while sending the message to Kafka.
    """
    logger.debug(f"Received message: {msg}")
    topic = "TEST"
    kafka_producer = KafkaProducer(topic)
    try:
        msg_bytes = json.dumps(msg.model_dump()).encode('utf-8')
        await kafka_producer.send(msg_bytes)
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Message produced to kafka successfully"}
