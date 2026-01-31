import React, { useState } from "react";
import { Heart, Send } from "lucide-react";
import "./CommentSection.css";

function CommentSection({ postId, onComment }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      userId: "current_user",
      username: "You",
      content: newComment,
      parentId: replyingTo,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment("");
    setReplyingTo(null);
    if (onComment) onComment(postId, newComment);
  };

  const handleLike = (commentId) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1,
            }
          : c
      )
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="comment-section">
      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="comment-input"
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          aria-label="Comment input"
        />
        <button
          type="submit"
          className="comment-submit-btn"
          disabled={!newComment.trim()}
          aria-label="Submit comment"
        >
          <Send className="send-icon" />
        </button>
      </form>

      <div className="comments-list">
        {topLevelComments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              onLike={handleLike}
              onReply={(id) => setReplyingTo(id)}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, replies, onLike, onReply, formatDate }) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className="comment-item">
      <div className="comment-content">
        <div className="comment-avatar">
          {comment.username.charAt(0).toUpperCase()}
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <strong className="comment-username">{comment.username}</strong>
            <span className="comment-time">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="comment-text">{comment.content}</p>
          <div className="comment-actions">
            <button
              className={`comment-action-btn ${comment.isLiked ? "liked" : ""}`}
              onClick={() => onLike(comment.id)}
              aria-label={comment.isLiked ? "Unlike" : "Like"}
            >
              <Heart className="comment-icon" fill={comment.isLiked ? "currentColor" : "none"} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>
            <button
              className="comment-action-btn"
              onClick={() => onReply(comment.id)}
              aria-label="Reply"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="comment-replies">
          <button
            className="show-replies-btn"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </button>
          {showReplies && (
            <div className="replies-list">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  onLike={onLike}
                  onReply={onReply}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
