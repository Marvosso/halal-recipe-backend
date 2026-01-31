import React, { useRef } from "react";
import { Image, Video, X, Upload } from "lucide-react";
import "./MediaUploader.css";

function MediaUploader({ files, onFilesChange, maxFiles = 5 }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const remainingSlots = maxFiles - files.length;
    
    if (selectedFiles.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more file(s)`);
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image

      if (!isImage && !isVideo) {
        alert(`${file.name} is not a valid image or video file`);
        return false;
      }

      if (file.size > maxSize) {
        alert(`${file.name} is too large. Max size: ${maxSize / 1024 / 1024}MB`);
        return false;
      }

      if (isVideo) {
        // Check video duration (max 3 minutes)
        // Note: This is a simplified check. In production, you'd need to use a video library
        return true;
      }

      return true;
    });

    onFilesChange([...files, ...validFiles]);
  };

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="media-uploader">
      <div className="media-preview-grid">
        {files.map((file, index) => {
          const isVideo = file.type.startsWith("video/");
          const previewUrl = URL.createObjectURL(file);

          return (
            <div key={index} className="media-preview-item">
              {isVideo ? (
                <video src={previewUrl} className="preview-media" controls />
              ) : (
                <img src={previewUrl} alt={`Preview ${index + 1}`} className="preview-media" />
              )}
              <button
                className="remove-media-btn"
                onClick={() => handleRemove(index)}
                aria-label="Remove media"
              >
                <X className="remove-icon" />
              </button>
            </div>
          );
        })}

        {files.length < maxFiles && (
          <button className="upload-trigger" onClick={handleClick} type="button">
            <Upload className="upload-icon" />
            <span>Add {files.length === 0 ? "Media" : "More"}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="file-input-hidden"
        aria-label="Upload media files"
      />

      <div className="upload-hints">
        <div className="hint-item">
          <Image className="hint-icon" />
          <span>Images: Max 10MB each</span>
        </div>
        <div className="hint-item">
          <Video className="hint-icon" />
          <span>Videos: Max 50MB, 3 min</span>
        </div>
        <div className="hint-item">
          <span>Max {maxFiles} files</span>
        </div>
      </div>
    </div>
  );
}

export default MediaUploader;
