import React, { useState, useEffect, useRef } from "react";
import { User, FileText, Save, Camera, X } from "lucide-react";
import ProfileModal from "./ProfileModal";
import { isAuthenticated, getUserData } from "../api/authApi";
import { getProfile, updateProfile, uploadProfilePhoto } from "../api/profileApi";
import logger from "../utils/logger";
import "./EditProfileModal.css";

function EditProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    profilePhoto: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    try {
      if (isAuthenticated()) {
        // Fetch from API
        try {
          const userProfile = await getProfile();
          setProfile({
            displayName: userProfile.displayName || "",
            bio: userProfile.bio || "",
            profilePhoto: userProfile.profilePhoto || null,
          });
        } catch (apiError) {
          logger.error("Error loading profile from API:", apiError);
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    } catch (error) {
      logger.error("Error loading profile:", error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const userData = getUserData();
      if (userData) {
        setProfile({
          displayName: userData.displayName || "",
          bio: userData.bio || "",
          profilePhoto: userData.profilePhoto || null,
        });
      } else {
        const saved = localStorage.getItem("userProfile");
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile({
            displayName: parsed.displayName || "",
            bio: parsed.bio || "",
            profilePhoto: null,
          });
        }
      }
    } catch (error) {
      logger.error("Error loading from localStorage:", error);
    }
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated()) {
      alert("Please log in to upload a profile photo.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const updatedUser = await uploadProfilePhoto(file);
      setProfile((prev) => ({
        ...prev,
        profilePhoto: updatedUser.profilePhoto,
      }));
    } catch (err) {
      logger.error("Error uploading photo:", err);
      setError(err.error || "Failed to upload photo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      if (isAuthenticated()) {
        // Save to API
        const updatedUser = await updateProfile({
          displayName: profile.displayName,
          bio: profile.bio,
        });
        // Trigger update event
        window.dispatchEvent(new CustomEvent("profileUpdated"));
      } else {
        // Save to localStorage for non-authenticated users
        localStorage.setItem("userProfile", JSON.stringify(profile));
        window.dispatchEvent(new CustomEvent("profileUpdated", { detail: profile }));
      }
      onClose();
    } catch (err) {
      logger.error("Error saving profile:", err);
      setError(err.error || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      ariaLabel="Edit your profile information"
    >
      <div className="edit-profile-modal-content">
        {error && (
          <div className="edit-profile-error">
            {error}
          </div>
        )}

        <div className="edit-profile-intro">
          <User className="edit-profile-intro-icon" />
          <p className="edit-profile-intro-text">
            {isAuthenticated() 
              ? "Customize your profile. Changes are saved to your account."
              : "Customize your profile. This information is stored locally and used in your posts and profile display."}
          </p>
        </div>

        {/* Profile Photo Upload */}
        <div className="edit-profile-photo-section">
          <label className="edit-profile-photo-label">Profile Photo</label>
          <div className="edit-profile-photo-container">
            {profile.profilePhoto ? (
              <div className="edit-profile-photo-preview">
                <img 
                  src={profile.profilePhoto.startsWith('/') ? `${window.location.origin}${profile.profilePhoto}` : profile.profilePhoto}
                  alt="Profile"
                  className="profile-photo-preview-img"
                />
                {isAuthenticated() && (
                  <button
                    type="button"
                    className="change-photo-btn"
                    onClick={handlePhotoSelect}
                    aria-label="Change photo"
                  >
                    <Camera className="camera-icon" />
                    Change Photo
                  </button>
                )}
              </div>
            ) : (
              <div className="edit-profile-photo-placeholder">
                <User className="photo-placeholder-icon" />
                {isAuthenticated() ? (
                  <button
                    type="button"
                    className="upload-photo-btn"
                    onClick={handlePhotoSelect}
                    aria-label="Upload photo"
                  >
                    <Camera className="camera-icon" />
                    Upload Photo
                  </button>
                ) : (
                  <p className="photo-placeholder-text">Log in to upload a photo</p>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
              aria-label="Select profile photo"
            />
          </div>
        </div>

        <div className="edit-profile-form">
          <div className="edit-profile-field">
            <label htmlFor="displayName" className="edit-profile-label">
              <User className="edit-profile-label-icon" />
              <span>Display Name</span>
            </label>
            <input
              id="displayName"
              type="text"
              className="edit-profile-input"
              placeholder="Enter your display name"
              value={profile.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              maxLength={30}
            />
            <p className="edit-profile-hint">
              This name appears on your posts and profile (max 30 characters)
            </p>
          </div>

          <div className="edit-profile-field">
            <label htmlFor="bio" className="edit-profile-label">
              <FileText className="edit-profile-label-icon" />
              <span>Bio</span>
              <span className="edit-profile-optional">(Optional)</span>
            </label>
            <textarea
              id="bio"
              className="edit-profile-textarea"
              placeholder="Tell us about yourself..."
              value={profile.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              maxLength={120}
              rows={4}
            />
            <div className="edit-profile-char-count">
              {profile.bio.length}/120 characters
            </div>
          </div>

        </div>

        <div className="edit-profile-actions">
          <button
            className="edit-profile-save-btn"
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Save profile changes"
          >
            <Save className="save-icon" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
          <button
            className="edit-profile-cancel-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cancel editing"
          >
            Cancel
          </button>
        </div>

        {!isAuthenticated() && (
          <div className="edit-profile-note">
            <p className="edit-profile-note-text">
              <strong>Note:</strong> Profile changes are saved locally. 
              <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("showAuthModal", { detail: { mode: "register" } })); onClose(); }}> Log in or register</a> to sync your profile across devices.
            </p>
          </div>
        )}
      </div>
    </ProfileModal>
  );
}

export default EditProfileModal;
