"use client";
import React, { useRef, useEffect, Suspense, useState } from "react";
import Hls from "hls.js";
import { useSearchParams, useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

function VideoPlayerInner() {
  const videoRef = useRef(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hls = searchParams.get("hls");
  const src = searchParams.get("src");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported() && hls !== "undefined" && hls !== "null" && hls) {
      const hlsjs = new Hls();
      hlsjs.attachMedia(video);
      hlsjs.loadSource(hls);

      hlsjs.on(Hls.Events.MANIFEST_PARSED, function () {
        toast.success("HLS (adaptive streaming) in use.");
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay was prevented, let user click play
        });
      });

      hlsjs.on(Hls.Events.ERROR, function (event, data) {
        console.error("HLS Error:", data);
        setHasError(true);
        setIsLoading(false);
        toast.error("Failed to load HLS stream. Trying fallback...");
      });
    } else if (video && src) {
      video.src = src;
      video.load();
      const playHandler = () => {
        toast.warning("Playing normal video (no HLS).");
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay was prevented, let user click play
        });
        video.removeEventListener("canplay", playHandler);
      };
      video.addEventListener("canplay", playHandler);
      video.addEventListener("error", () => {
        setHasError(true);
        setIsLoading(false);
        toast.error("Failed to load video.");
      });
    } else {
      setHasError(true);
      setIsLoading(false);
      toast.error("No valid video source provided.");
    }
  }, [hls, src]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors duration-200 group"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm sm:text-base font-medium">
              Back to Library
            </span>
          </button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white hidden sm:block">
            Video Player
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl">
          {/* Video Container */}
          <div className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-white text-sm sm:text-base font-medium">
                    Loading video...
                  </p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {hasError && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
                <div className="text-center space-y-4 max-w-md mx-auto px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Video Unavailable
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base">
                    The video could not be loaded. Please try again later.
                  </p>
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                      Back to Library
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Player */}
            <div className="relative aspect-video sm:aspect-video lg:aspect-video">
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-contain bg-black"
                style={{ backgroundColor: "black" }}
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#ffffff",
            border: "1px solid #374151",
          },
        }}
      />
    </div>
  );
}

export default function VideoPlayer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-white text-lg sm:text-xl font-medium">
              Loading video player...
            </p>
          </div>
        </div>
      }
    >
      <VideoPlayerInner />
    </Suspense>
  );
}
