"use client";
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import { useSearchParams } from "next/navigation";
import { toast, Toaster } from "sonner";

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const searchParams = useSearchParams();
  const hls = searchParams.get("hls");
  const src = searchParams.get("src");

  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported() && hls !== "undefined" && hls !== "null" && hls) {
      const hlsjs = new Hls();
      hlsjs.attachMedia(video);
      hlsjs.loadSource(hls);
      hlsjs.on(Hls.Events.MANIFEST_PARSED, function () {
        toast.success("HLS (adaptive streaming) in use.");
        video.play().catch(() => {
          // Autoplay was prevented, let user click play
        });
      });
    } else if (video && src) {
      video.src = src;
      video.load();
      const playHandler = () => {
        toast.warning("Playing normal video (no HLS).");
        video.play().catch(() => {
          // Autoplay was prevented, let user click play
        });
        video.removeEventListener("canplay", playHandler);
      };
      video.addEventListener("canplay", playHandler);
    }
  }, [hls, src]);

  return (
    <div className="min-h-screen flex justify-center items-center py-8 bg-black">
      <div className="relative w-full max-w-3xl aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
        <Toaster position="top-center" richColors />
        <video
          ref={videoRef}
          controls
          className="w-full h-full object-contain bg-black"
          style={{ backgroundColor: "black" }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
