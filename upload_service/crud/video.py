from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field
from fastapi import HTTPException, status

from db.models import VideoMetaData



class VideoMetaDataRequest(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    author: str | None = None
    key: str


async def create_video_metadata(payload: VideoMetaDataRequest, db: AsyncSession):
    metadata = VideoMetaData(**payload.model_dump(mode='json'))
    db.add(metadata)
    try:
        await db.commit()
    except IntegrityError as exc: # Some violations like UNIQUE(key)
        await db.rollback()
        raise HTTPException(
            status_code= status.HTTP_409_CONFLICT,
            detail="A video with this URL already exists."
        ) from exc

    await db.refresh(metadata)
    return metadata



