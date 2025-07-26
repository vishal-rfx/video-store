"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../_components/navbar";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });
import { useRouter } from "next/navigation";

function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const getVideos = async () => {
      try {
        const res = await axios.get("/api/videos");
        console.log(res);
        if (Array.isArray(res.data.videos) && res.data.videos.length > 0) {
          setVideos(res.data.videos);
          setLoading(false);
          setError(null);
        } else {
          setError("No videos found.");
          setLoading(false);
        }
      } catch (error) {
        console.log("Error in fetching videos: ", error);
        setError(
          error.response?.data?.error ||
            "Failed to fetch videos. Please try again later."
        );
        setLoading(false);
      }
    };

    getVideos();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      {loading ? (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl font-medium">
              Loading videos...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400"
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
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Oops! Something went wrong
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Video Library
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base">
              Discover and watch amazing content
            </p>
          </div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] border border-gray-200 dark:border-gray-700"
                onClick={() =>
                  router.push(
                    `/videoplayer?hls=${encodeURIComponent(
                      video.hls_url
                    )}&src=${encodeURIComponent(video.url)}`
                  )
                }
              >
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <ReactPlayer
                    url={video.url}
                    width="100%"
                    height="100%"
                    controls={false}
                    muted={true}
                    playing={false}
                    className="object-cover"
                  />
                </div>

                {/* Video Info */}
                <div className="p-4 sm:p-5">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                    {video.title}
                  </h2>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {video.author}
                    </p>

                    {video.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Watch Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                      Watch Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {videos.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No videos yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-6">
                Be the first to upload a video and share it with the community!
              </p>
              <button
                onClick={() => router.push("/upload")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Upload Your First Video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;
