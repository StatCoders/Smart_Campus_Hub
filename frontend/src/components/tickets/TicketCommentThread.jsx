import React, { useState } from 'react';
import { Edit2, Trash2, Send, Loader } from 'lucide-react';
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from '../../hooks/useComments';

export default function TicketCommentThread({ ticketId }) {
  const { data: comments, isLoading } = useComments(ticketId);
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addCommentMutation.mutateAsync({ ticketId, content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      await updateCommentMutation.mutateAsync({ commentId, content: editCommentText });
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteCommentMutation.mutateAsync(commentId);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-4 py-3 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
          rows="3"
        />
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim() || addCommentMutation.isPending}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
        >
          <Send className="h-4 w-4" />
          {addCommentMutation.isPending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {!comments || comments.length === 0 ? (
          <p className="text-center text-slate-500 py-8 text-sm">No comments yet</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    {comment.userFullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{comment.userFullName || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {comment.userRole || 'User'}
                </span>
              </div>

              {/* Comment Content or Edit Form */}
              {editingCommentId === comment.id ? (
                <div className="mt-3">
                  <textarea
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    rows="2"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={updateCommentMutation.isPending}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditCommentText('');
                      }}
                      className="px-3 py-1 bg-gray-300 text-slate-900 rounded text-xs hover:bg-gray-400 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 text-sm leading-relaxed">{comment.content}</p>
                  {comment.isEditable && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditCommentText(comment.content);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
