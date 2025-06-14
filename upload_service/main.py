from fastapi import FastAPI
from dotenv import load_dotenv
import os
import boto3


load_dotenv()

app = FastAPI()

@app.get("/")
async def home():
    return {"message": "Service is Up!"}


@app.post('/upload')
async def upload():
    pass

