import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon } from "lucide-react";
import { register, login } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";
import "./AuthModal.css";

function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const { updateUser } = useAuth();
  const [mode, setMode] = useState(initialMode); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      let response;
      if (mode === "register") {
        if (!displayName.trim()) {
          setError("Display name is required");
          setIsLoading(false);
          return;
        }
        response = await register(email, password, displayName);
        setSuccess("Account created successfully! You are now logged in.");
      } else {
        response = await login(email, password);
        setSuccess("Login successful!");
      }
      
      // Update AuthContext with user data
      if (response?.user) {
        updateUser(response.user);
      }
      
      setTimeout(() => {
        onClose();
        // Reload to ensure all components update
        window.location.reload();
      }, 1500);
    } catch (err) {
      // Handle different error structures
      let errorMessage = "An error occurred. Please try again.";
      if (err?.error) {
        errorMessage = err.error;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.status === 400) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (err?.response?.status === 409) {
        errorMessage = "An account with this email already exists.";
      } else if (err?.code === "ECONNREFUSED" || err?.message?.includes("Network Error")) {
        errorMessage = "Unable to connect to server. Please check your internet connection.";
      }
      setError(errorMessage);
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === "login" ? "Login" : "Create Account"}</h2>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">
            <X className="close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success-message">
              {success}
            </div>
          )}

          {mode === "register" && (
            <div className="auth-form-group">
              <label htmlFor="displayName">
                <UserIcon className="label-icon" />
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="auth-form-input"
              />
            </div>
          )}

          <div className="auth-form-group">
            <label htmlFor="email">
              <Mail className="label-icon" />
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="auth-form-input"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">
              <Lock className="label-icon" />
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
              required
              minLength={mode === "register" ? 6 : undefined}
              className="auth-form-input"
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="auth-modal-footer">
          <p>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="auth-switch-link"
              onClick={switchMode}
            >
              {mode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
