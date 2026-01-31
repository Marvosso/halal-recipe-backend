import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./ProfileModal.css";

function ProfileModal({ isOpen, onClose, title, children, ariaLabel }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before opening
      previousFocusRef.current = document.activeElement;
      
      // Focus trap: focus the modal
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Handle ESC key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
        
        // Return focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleTabKey);
    return () => modal.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="profile-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
    >
      <div
        ref={modalRef}
        className="profile-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">{title}</h2>
          <button
            className="profile-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="close-icon" />
          </button>
        </div>
        <div className="profile-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default ProfileModal;
