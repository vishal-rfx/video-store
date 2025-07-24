import os
import logging
import boto3
from dotenv import load_dotenv
import ffmpeg
import mimetypes
from db.models import HLS, VideoMetaData
from db.database import SessionLocal
from db.deps import get_db


# Load environment variables
load_dotenv(override=True)

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Video resolutions and bitrates
RESOLUTIONS = [
    {
        'resolution': '320x180',
        'videoBitrate': '500k',
        'audioBitrate': '64k'
    },
    {
        'resolution': '854x480',
        'videoBitrate': '1000k',
        'audioBitrate': '128k'
    },
    {
        'resolution': '1280x720',
        'videoBitrate': '2500k',
        'audioBitrate': '192k'
    }
]

BANDWIDTH_MAP = {
    '320x180': 676800,
    '854x480': 1353600,
    '1280x720': 3230400
}

S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
LOCAL_PATH = os.getenv('LOCAL_PATH', 'local.mp4')
HLS_FOLDER = "hls"

# Initialize S3 client
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY'),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

def download_s3_file(filename, local_path):
    try:
        with open(local_path, 'wb') as f:
            s3.download_fileobj(S3_BUCKET_NAME, filename, f)
        logger.info('Downloaded s3 mp4 file locally')
    except Exception as e:
        logger.error(f"Failed to download s3 file: {e}")
        raise RuntimeError("Failed to download s3 file") from e

def generate_variant_playlists(local_filename, local_path, key):
    variant_playlists = []
    os.makedirs(HLS_FOLDER, exist_ok=True)
    for res in RESOLUTIONS:
        resolution = res['resolution']
        vbitrate = res['videoBitrate']
        abitrate = res['audioBitrate']
        output_filename = key.replace('.', f'_{resolution}.m3u8', 1)
        segment_filename = key.replace('.', f'_{resolution}_%03d.ts', 1)

        logger.info(f"HLS conversion starting for {resolution}")
        (
            ffmpeg.input(local_path)
            .output(
                f'{HLS_FOLDER}/{output_filename}',
                **{
                    'c:v': 'h264',
                    'b:v': vbitrate,
                    'c:a': 'aac',
                    'b:a': abitrate,
                    'vf': f'scale={resolution}',
                    'f': 'hls',
                    'hls_time': 2,
                    'hls_list_size': 0,
                    'hls_segment_filename': f'{HLS_FOLDER}/{segment_filename}'
                }
            )
            .run(overwrite_output=True)
        )
        variant_playlists.append({
            'resolution': resolution,
            'outputFileName': output_filename
        })
        logger.info(f'HLS conversion done for {resolution}')
    return variant_playlists

def generate_master_playlist(local_filename, variant_playlists, key):
    master_playlist_lines = []
    for variant in variant_playlists:
        resolution = variant['resolution']
        output_file_name = variant['outputFileName']
        bandwidth = BANDWIDTH_MAP.get(resolution, 676800)
        master_playlist_lines.append(
            f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={resolution}\n{output_file_name}"
        )
    master_playlist = "#EXTM3U\n" + "\n".join(master_playlist_lines)
    master_playlist_file_name = key.replace('.', '_master.m3u8', 1)
    master_playlist_path = f"{HLS_FOLDER}/{master_playlist_file_name}"
    try:
        with open(master_playlist_path, "w") as f:
            f.write(master_playlist)
        logger.info("HLS master m3u8 playlist generated")
    except Exception as e:
        logger.error(f"Failed to write master playlist: {e}")
        raise
    return master_playlist_path

async def upload_hls_to_s3_and_db(key, master_playlist_file):
    logger.info("Uploading media m3u8 playlists and ts segments to s3")
    files = os.listdir(HLS_FOLDER)
    prefix = list(key.split('.'))[0]
    master_hls_key = None
    for file in files:
        if not file.startswith(prefix):
            print(f"File {file} do not start with prefix: {prefix}")
            continue
        file_path = os.path.join(HLS_FOLDER, file)
        content_type = (
            "video/mp2t" if file.endswith(".ts")
            else "application/x-mpegURL" if file.endswith(".m3u8")
            else mimetypes.guess_type(file)[0]
        )
        try:
            with open(file_path, "rb") as file_stream:
                s3.upload_fileobj(
                    file_stream,
                    S3_BUCKET_NAME,
                    f"{HLS_FOLDER}/{file}",
                    ExtraArgs={"ContentType": content_type} if content_type else None
                )
            os.remove(file_path)
            logger.info(f"Uploaded and deleted {file}")
            if file == master_playlist_file:
                master_hls_key = f"{HLS_FOLDER}/{file}"
        except Exception as e:
            logger.error(f"Failed to upload or delete {file}: {e}")
    # Insert only the master m3u8 file into DB
    if master_hls_key:
        await insert_master_hls_record(key, master_hls_key)

async def insert_master_hls_record(key, master_hls_key):
    async for session in get_db():
        video_metadata_id = await session.scalar(
            VideoMetaData.__table__.select().with_only_columns(VideoMetaData.id).where(VideoMetaData.key == key)
        )
        if not video_metadata_id:
            logger.error(f"No VideoMetaData found for key: {key}")
            return
        hls_record = HLS(video_metadata_id=video_metadata_id, hls_key=master_hls_key)
        session.add(hls_record)
        await session.commit()

def get_video_metadata_id_by_key(session, key):
    return session.scalar(
        session.query(VideoMetaData.id).filter(VideoMetaData.key == key)
    )

async def insert_hls_records(key, hls_keys):
    async with SessionLocal() as session:
        video_metadata_id = await session.scalar(
            session.execute(
                VideoMetaData.__table__.select().where(VideoMetaData.key == key)
            )
        )
        if not video_metadata_id:
            logger.error(f"No VideoMetaData found for key: {key}")
            return
        for hls_key in hls_keys:
            hls_record = HLS(video_metadata_id=video_metadata_id, hls_key=hls_key)
            session.add(hls_record)
        await session.commit()

def delete_local_file(local_path):
    try:
        logger.info("Deleting locally downloaded s3 mp4 file")
        os.remove(local_path)
        logger.info("Deleted locally downloaded s3 mp4 file")
    except Exception as e:
        logger.warning(f"Failed to delete local mp4 file: {e}")

async def transcode_s3_to_s3(key):
    local_path = LOCAL_PATH
    local_filename = os.path.basename(local_path)
    try:
        download_s3_file(key, local_path)
        variant_playlists = generate_variant_playlists(local_filename, local_path, key)
        master_playlist_path = generate_master_playlist(local_filename, variant_playlists, key)
        logger.info(f"Master playlist path: {master_playlist_path}")
        master_playlist_file = os.path.basename(master_playlist_path)
        logger.info(f"Master playlist file: {master_playlist_file}")
    except Exception as e:
        logger.error(f"Transcoding failed: {e}")
        delete_local_file(local_path)
        return

    delete_local_file(local_path)

    try:
        await upload_hls_to_s3_and_db(key, master_playlist_file)
        logger.info("Uploaded media m3u8 playlists and ts segments to s3. Also deleted locally and added master playlist to DB")
    except Exception as e:
        logger.error(f"Failed to upload HLS files to S3 or DB: {e}")