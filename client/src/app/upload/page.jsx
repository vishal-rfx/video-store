"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect } from "next/dist/server/api-utils";
import { useRouter } from "next/navigation";

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const { data } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!data) {
      redirect("/");
    }
  });

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

      console.log(completeRes.data);
      // Route to home page after successful upload
      router.push("/");
    } catch (error) {
      console.error("Error uploading files: ", error);
      console.log("Aborting multipart upload");
      axios
        .post(
          `${process.env.NEXT_PUBLIC_UPLOAD_SERVICE}/upload/abort?upload_id=${uploadId}&filename=${filename}`
        )
        .then((res) => {
          console.log(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
      // Show popup alert on error
      alert("Error uploading file. Please try again.");
    }
  };

  return (
    <div className="container mx-auto max-w-lg p-10">
      <form encType="multipart/form-data">
        <div className="mb-4">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="px-3 py-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-3 py-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            name="author"
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            className="px-3 py-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="file"
            name="file"
            accept="video/*"
            required
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-br file:from-purple-600 file:to-blue-500 file:text-white hover:file:bg-gradient-to-bl"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          Upload
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
