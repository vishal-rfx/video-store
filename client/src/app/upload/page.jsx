"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

import { useRouter } from "next/navigation";

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const { data, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !selectedFile) {
      alert("Title and file are required fields");
      return;
    }
    handleFileUpload(selectedFile);
  };

  const handleFileUpload = async (file) => {
    let uploadId, filename;
    filename = file.name;
    try {
      const formData = new FormData();
      formData.append("filename", file.name);

      const initializeRes = await axios.post(
        `${process.env.NEXT_PUBLIC_UPLOAD_SERVICE}/upload/initialize`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      uploadId = initializeRes.data.uploadId;

      const chunkSize = 5 * 1024 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);

      let start = 0;
      const uploads = [];
      for (let chunkIndex = 1; chunkIndex <= totalChunks; chunkIndex++) {
        const chunk = file.slice(start, start + chunkSize);
        start += chunkSize;

        const chunkFormData = new FormData();
        chunkFormData.append("filename", file.name);
        chunkFormData.append("chunk", chunk);
        chunkFormData.append("chunkIndex", chunkIndex);
        chunkFormData.append("uploadId", uploadId);

        uploads.push(
          axios.post(
            `${process.env.NEXT_PUBLIC_UPLOAD_SERVICE}/upload`,
            chunkFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          )
        );
      }

      const uploadResponses = await Promise.all(uploads);
      const etags = uploadResponses.map((res, _) => ({
        etag: res.data.etag,
        chunkIndex: res.data.chunkIndex,
      }));
      const completeRes = await axios.post(
        `${process.env.NEXT_PUBLIC_UPLOAD_SERVICE}/upload/complete`,
        {
          filename: file.name,
          parts: etags,
          uploadId: uploadId,
          title: title,
          description: description,
          author: author,
        }
      );

      // Route to home page after successful upload
      router.push("/");
    } catch (error) {

      axios
        .post(
          `${process.env.NEXT_PUBLIC_UPLOAD_SERVICE}/upload/abort?upload_id=${uploadId}&filename=${filename}`
        )
        .then((res) => {
        })
        .catch((err) => {
        });
      // Show popup alert on error
      alert("Error uploading file. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8 sm:px-8 sm:py-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center">
              Upload Video
            </h1>
            <p className="text-purple-100 text-center mt-2 text-sm sm:text-base">
              Share your content with the world
            </p>
          </div>

          {/* Form */}
          <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <form
              encType="multipart/form-data"
              className="space-y-4 sm:space-y-6"
            >
              {/* Title Field */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 sm:py-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter video description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 sm:py-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none"
                />
              </div>

              {/* Author Field */}
              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Author *
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  placeholder="Enter author name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  className="w-full px-4 py-3 sm:py-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>

              {/* File Upload Field */}
              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Video File *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept="video/*"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full px-4 py-6 sm:py-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 hover:border-purple-400 dark:hover:border-purple-400 transition-all duration-200">
                    <div className="space-y-2">
                      <svg
                        className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-sm sm:text-base">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          Click to upload
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}
                          or drag and drop
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        MP4, WebM, MOV up to 1GB
                      </p>
                    </div>
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Selected: {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                      Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!title || !selectedFile || !author}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 sm:py-5 px-6 rounded-xl text-base sm:text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-lg hover:shadow-xl"
                >
                  {!title || !selectedFile || !author
                    ? "Fill all required fields"
                    : "Upload Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadForm;
