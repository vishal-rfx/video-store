from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.upload import router as upload_router


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


app.include_router(upload_router, prefix="/upload", tags=["Upload"])