"use client";
import React, { useState } from "react";
import axios from "axios";

function UploadForm() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFileUpload(selectedFile);
  };

  const handleFileUpload = async (file) => {
    let uploadId, filename;
    filename = file.name;
    try {
      const formData = new FormData();
      formData.append("filename", file.name);
      console.log("Uploading a file to backend server");

      const initializeRes = await axios.post(
        "http://localhost:8000/upload/initialize",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      uploadId = initializeRes.data.uploadId;
      console.log("Upload id is ", uploadId);

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
          axios.post("http://localhost:8000/upload", chunkFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
        );
      }

      const uploadResponses = await Promise.all(uploads);
      const etags = uploadResponses.map((res, idx) => ({
        etag: res.data.etag,
        chunkIndex: res.data.chunkIndex
      }));
      console.log("Etags", etags);
      const completeRes = await axios.post(
        "http://localhost:8000/upload/complete",
        {
          filename: file.name,
          parts: etags,
          uploadId: uploadId,
        }
      );

      console.log(completeRes.data);
    } catch (error) {
      console.error("Error uploading files: ", error);
      console.log("Aborting multipart upload");
      axios
        .post(
          `http://localhost:8000/upload/abort?upload_id=${uploadId}&filename=${filename}`
        )
        .then((res) => {
          console.log(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Upload
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
