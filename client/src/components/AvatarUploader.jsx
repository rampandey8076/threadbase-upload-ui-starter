import { useEffect, useRef, useState } from "react";
import apiClient from "../services/apiClient";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(selectedFile) {
    setError("");
    setMessage("");
    setUploadedUrl("");
    setProgress(0);

    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setFile(selectedFile);
  }

  async function uploadAvatar() {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    setError("");
    setMessage("");
    setProgress(0);

    try {
      const response = await apiClient.post("/api/upload", formData, {
        onUploadProgress(event) {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      const data = response.data;
      const url =
        data?.url ??
        data?.avatarUrl ??
        data?.fileUrl ??
        data?.file?.url ??
        "";

      setUploadedUrl(url);
      setProgress(100);
      setMessage("Upload completed successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="avatar-uploader">
      <h2>Upload your avatar</h2>
      <p>Choose a profile image to upload (maximum 5 MB).</p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Choose an avatar image or drop an image here"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectFile(event.dataTransfer.files?.[0]);
        }}
        style={{
          border: `2px dashed ${dragging ? "#2563eb" : "#9ca3af"}`,
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Selected avatar preview"
            style={{
              width: "140px",
              height: "140px",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        ) : (
          <p>Drag and drop an image here, or click to browse.</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(event) => {
            selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {file && (
        <p>
          {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}

      {uploading && (
        <div>
          <progress value={progress} max="100" style={{ width: "100%" }} />
          <p>{progress}% uploaded</p>
        </div>
      )}

      <button
        type="button"
        onClick={uploadAvatar}
        disabled={!file || uploading}
        style={{ marginTop: "16px", padding: "10px 18px" }}
      >
        {uploading ? "Uploading..." : "Upload avatar"}
      </button>

      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {message && <p role="status">{message}</p>}

      {uploadedUrl && (
        <p>
          Uploaded file:{" "}
          <a href={uploadedUrl} target="_blank" rel="noreferrer">
            View image
          </a>
        </p>
      )}
    </section>
  );
}
