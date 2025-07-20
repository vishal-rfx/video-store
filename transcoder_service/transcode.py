import os
import logging
import boto3
from dotenv import load_dotenv
import ffmpeg
import mimetypes


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

def upload_hls_to_s3(key):
    logger.info("Uploading media m3u8 playlists and ts segments to s3")
    files = os.listdir(HLS_FOLDER)
    prefix = list(key.split('.'))[0]
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
        except Exception as e:
            logger.error(f"Failed to upload or delete {file}: {e}")

def delete_local_file(local_path):
    try:
        logger.info("Deleting locally downloaded s3 mp4 file")
        os.remove(local_path)
        logger.info("Deleted locally downloaded s3 mp4 file")
    except Exception as e:
        logger.warning(f"Failed to delete local mp4 file: {e}")

def transcode_s3_to_s3(key):
    local_path = LOCAL_PATH
    local_filename = os.path.basename(local_path)
    try:
        download_s3_file(key, local_path)
        variant_playlists = generate_variant_playlists(local_filename, local_path, key)
        master_playlist_path = generate_master_playlist(local_filename, variant_playlists, key)
    except Exception as e:
        logger.error(f"Transcoding failed: {e}")
        delete_local_file(local_path)
        return

    delete_local_file(local_path)

    try:
        upload_hls_to_s3(key)
        logger.info("Uploaded media m3u8 playlists and ts segments to s3. Also deleted locally")
    except Exception as e:
        logger.error(f"Failed to upload HLS files to S3: {e}")