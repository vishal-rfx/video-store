import os
import boto3
import logging
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from db.deps import get_db

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

@app.get('/all-videos')
async def get_all_videos(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT * FROM video_metadata"))
        videos = result.fetchall()
        video_list = []
        for row in videos:
            video_dict = dict(row._mapping)
            key = video_dict.get("key")
            if key:
                try:
                    url = s3.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': s3_bucket, 'Key': key},
                        ExpiresIn=3600
                    )
                    video_dict["url"] = url
                except Exception as e:
                    logger.error(f"Error generating presigned url for key {key}: {e}")
                    video_dict["url"] = None
            else:
                video_dict["url"] = None
            video_list.append(video_dict)
        return {"videos": video_list}
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching videos")
