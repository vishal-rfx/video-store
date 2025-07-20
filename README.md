# VideoStore - YouTube Clone

A scalable video streaming platform built with modern microservices architecture, featuring video upload, transcoding, and streaming capabilities.

## 🏗️ Architecture Overview

This application follows a microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │  Upload Service │    │Transcoder Service│
│   Frontend      │◄──►│   (FastAPI)     │◄──►│   (Python)      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         │              │   Database      │              │
         │              └─────────────────┘              │
         │                                               │
         ▼              ┌─────────────────┐              │
┌─────────────────┐     │     Kafka       │◄─────────────┘
│  Watch Service  │     │   Message Bus   │
│   (FastAPI)     │     │                 │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Amazon S3     │
│  File Storage   │
└─────────────────┘
```

## 🚀 Services

### 1. Frontend Client (Next.js)

- **Technology**: Next.js 15.3.3, React 19, TailwindCSS
- **Features**:
  - User authentication with NextAuth.js (Google OAuth)
  - Video upload with chunked multipart upload
  - Video streaming with HLS support
  - Responsive video gallery
  - Real-time video player with react-player


### 2. Upload Service (FastAPI)

- **Technology**: Python 3.12+, FastAPI, SQLAlchemy, AsyncPG
- **Port**: 8000
- **Features**:
  - Multipart file upload to AWS S3
  - Video metadata storage in PostgreSQL
  - Kafka message publishing for transcoding pipeline
  - CORS enabled for frontend integration


### 3. Transcoder Service (Python)

- **Technology**: Python 3.12+, FFmpeg, Kafka Consumer
- **Features**:
  - Automatic video transcoding to multiple resolutions
  - HLS (HTTP Live Streaming) playlist generation
  - Multiple bitrate variants (320x180, 854x480, 1280x720)
  - S3 integration for processed video storage

**Transcoding Pipeline**:

1. Downloads original video from S3
2. Generates multiple resolution variants
3. Creates HLS playlists (.m3u8) and segments (.ts)
4. Uploads processed files back to S3
5. Cleans up local temporary files

### 4. Watch Service (FastAPI)

- **Technology**: Python 3.12+, FastAPI, SQLAlchemy
- **Port**: 8003
- **Features**:
  - Video streaming via S3 presigned URLs
  - Video metadata retrieval
  - Database integration for video catalog


## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 15.3.3 with App Router
- **UI**: React 19, TailwindCSS 4
- **Authentication**: NextAuth.js with Google OAuth
- **Video Player**: react-player with HLS.js support
- **HTTP Client**: Axios

### Backend Services

- **API Framework**: FastAPI with async/await support
- **Database**: PostgreSQL with AsyncPG driver
- **ORM**: SQLAlchemy 2.0 with async support
- **Message Queue**: Apache Kafka with SASL_SSL
- **File Storage**: Amazon S3 with multipart upload
- **Video Processing**: FFmpeg with Python bindings


