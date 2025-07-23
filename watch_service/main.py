import os
import boto3
import logging
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy import select, join

from db.deps import get_db
from db.models import VideoMetaData, HLS

load_dotenv(override=True)
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

s3_bucket = os.getenv('S3_BUCKET_NAME')
s3 = boto3.client(
    "s3",
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY'),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# Get S3 region for public URL construction
s3_region = os.getenv('AWS_REGION', 'us-east-1')


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
        # Left outer join video_metadata and hls tables
        stmt = select(VideoMetaData, HLS).join(HLS, VideoMetaData.id == HLS.video_metadata_id, isouter=True)
        result = await db.execute(stmt)
        videos = result.fetchall()
        video_list = []
        for row in videos:
            video = row[0]
            hls = row[1]
            video_dict = {
                "id": video.id,
                "title": video.title,
                "description": video.description,
                "author": video.author,
                "key": video.key,
                "created_at": video.created_at,
            }
            # Presigned S3 URL for mp4
            key = video.key
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
            # Public S3 URL for HLS master playlist
            hls_key = hls.hls_key if hls else None
            if hls_key:
                hls_url = f"https://{s3_bucket}.s3.{s3_region}.amazonaws.com/{hls_key}"
                video_dict["hls_url"] = hls_url
            else:
                video_dict["hls_url"] = None
            # Only add to list if at least the normal video url is present
            if video_dict["url"]:
                video_list.append(video_dict)
        return {"videos": video_list}
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching videos")
