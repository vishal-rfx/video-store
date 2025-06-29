import logging
import boto3
import os
from dotenv import load_dotenv

from fastapi import APIRouter, Form, UploadFile, HTTPException, Request

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
load_dotenv(override=True)

router = APIRouter()
s3_bucket = os.getenv('S3_BUCKET_NAME')
s3 = boto3.client(
    "s3",
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY'),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

@router.post('/')
async def upload(
    filename: str = Form(...),
    upload_id: str = Form(..., alias="uploadId"),
    part_id: int = Form(..., alias="chunkIndex"),
    part: UploadFile = Form(..., alias="chunk")
):
    if not s3_bucket:
        raise HTTPException(status_code=500, detail="S3_BUCKET_NAME environment variable is not set")
    logger.debug("Part id is %s",part_id)
    try:
        resp = s3.upload_part(
            Bucket = s3_bucket,
            Key = filename,
            UploadId = upload_id,
            PartNumber = part_id,
            Body = part.file
        )

        return {"etag": resp["ETag"], "chunkIndex": part_id}

    except s3.exceptions.NoSuchUpload:
        raise HTTPException(status_code=404, detail="Upload ID not found")
    except Exception as e:
        logger.error("Exception while uploading part %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/initialize')
async def initialize(filename: str = Form(...)):
    if not s3_bucket:
        raise HTTPException(status_code=500, detail="S3_BUCKET_NAME environment variable is not set")

    try:
        resp = s3.create_multipart_upload(Bucket=s3_bucket, Key=filename)
        upload_id = resp['UploadId']
        return {
            "message": "Multipart upload initialized successfully",
            "uploadId": upload_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/complete')
async def complete(request: Request):
    """
        Expects a JSON body like:
        {
            "filename": "file.mp4",
            "uploadId": "xyz",
            "parts": [
                {"part_number": 1, "etag": "\"8e9b...\""},
                {"part_number": 2, "etag": "\"9f01...\""}
            ]
        }
    """
    try:
        data = await request.json()
        print("DATA", data)
        filename = data["filename"]
        upload_id = data["uploadId"]
        parts_list = data["parts"]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    print("part list", parts_list)
    for p in parts_list:
        print(type(p), p)
    parts_sorted = sorted(
        [{"PartNumber": p["chunkIndex"], "ETag": p["etag"]} for p in parts_list],
        key=lambda p: p["PartNumber"],
    )

    try:
        s3.complete_multipart_upload(
            Bucket=s3_bucket,
            Key=filename,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts_sorted}
        )
        return {"message": "File uploaded successfully"}
    except Exception as e:
        logger.error("Exception while completing upload: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/abort')
async def abort_upload(upload_id: str, filename: str):
    s3.abort_multipart_upload(Bucket = s3_bucket, Key=filename, UploadId=upload_id)