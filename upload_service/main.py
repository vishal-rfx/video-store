from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import boto3


load_dotenv(override=True)

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"]
)

@app.get("/")
async def home():
    """
    Home endpoint that indicates the service is up.
    """
    return {"message": "Service is Up!"}


@app.post('/upload')
async def upload(file: UploadFile = File(...)):
    """
    Uploads a file to an S3 bucket using boto3.

    This function retrieves the S3 bucket name and AWS credentials from environment variables.
    It uploads the provided file object to the specified S3 bucket. If the S3 bucket name is not set
    or if any exception occurs during the upload, an HTTPException is raised.

    Args:
        file (UploadFile): The file object to be uploaded, provided by FastAPI's File dependency.

    Raises:
        HTTPException: If the S3_BUCKET_NAME environment variable is not set.
        HTTPException: If an error occurs during the S3 upload process.

    Returns:
        dict: A dictionary containing a success message with the file name and S3 bucket name.
    """
    s3_bucket = os.getenv('S3_BUCKET_NAME')
    if not s3_bucket:
        raise HTTPException(status_code=500, detail="S3_BUCKET_NAME environment variable is not set")

    s3_client = boto3.client(
        "s3",
        aws_access_key_id = os.getenv('AWS_ACCESS_KEY'),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

    try:
        s3_client.upload_fileobj(file.file, s3_bucket, file.filename)
        return {"message": f"File {file.filename} uploaded successfully to {s3_bucket}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

