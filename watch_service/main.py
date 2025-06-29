import os
import boto3
import logging
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(override=True)
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

s3_bucket = os.getenv('S3_BUCKET_NAME')
s3 = boto3.client(
    "s3",
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY'),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"]
)

@app.get('/watch')
async def get_presigned_url(key: str):
    filename = key
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': s3_bucket, 'Key': filename},
            ExpiresIn = 3600
        )

        return {"url": url}

    except Exception as e:
        logger.error(str(e))
        return HTTPException(status_code= 500, detail="Internal server error while getting presigned url")


