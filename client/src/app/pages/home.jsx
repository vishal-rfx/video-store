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
    <div>
      <NavBar />
      {loading ? (
        <div className="container mx-auto flex justify-center items-center h-screen">
          Loading...
        </div>
      ) : error ? (
        <div className="container mx-auto flex justify-center items-center h-screen text-red-600">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 m-10">
          {videos.map((video) => (
            <div
              key={video.id}
              className="border rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition"
              onClick={() =>
                router.push(
                  `/videoplayer?hls=${encodeURIComponent(
                    video.hls_url
                  )}&src=${encodeURIComponent(video.url)}`
                )
              }
            >
              <div>
                <ReactPlayer
                  url={video.url}
                  width="360px"
                  height="180px"
                  controls={true}
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">{video.title}</h2>
                <p className="text-gray-700">Author - {video.author}</p>
                <p className="text-gray-700">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
