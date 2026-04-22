import React, { useState } from 'react';
import { Download, Upload, Loader } from 'lucide-react';

export default function TicketAttachmentGallery({
  attachments = [],
  onUpload = null,
  isLoading = false,
  emptyMessage = 'No attachments yet',
  helperMessage = 'Upload up to 3 images to document the issue',
  maxAttachments = 3,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (onUpload && e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">{emptyMessage}</p>
        {onUpload && (
          <p className="text-xs mt-2">{helperMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Attachments Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {attachments.map((attachment, idx) => (
          <div
            key={idx}
            className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
          >
            {/* Preview Image */}
            {attachment.fileUrl && attachment.fileType?.includes('image') ? (
              <img
                src={attachment.fileUrl}
                alt={`Attachment ${idx + 1}`}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 truncate px-2">{attachment.fileName || 'File'}</p>
                </div>
              </div>
            )}

            {/* Overlay with Actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {attachment.fileUrl && (
                <a
                  href={attachment.fileUrl}
                  download
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                </a>
              )}
            </div>

            {/* File Info */}
            <div className="p-2 bg-white border-t border-gray-200">
              <p className="text-xs text-slate-900 font-medium truncate">
                {attachment.fileName || `Attachment ${idx + 1}`}
              </p>
              <p className="text-xs text-slate-500">{formatFileSize(attachment.fileSize)}</p>
              {(attachment.uploadedByName || attachment.uploadedBy) && (
                <p className="text-xs text-slate-500 mt-1">By: {attachment.uploadedByName || attachment.uploadedBy}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Area (if callback provided) */}
      {onUpload && attachments.length < maxAttachments && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) onUpload(e.target.files);
            }}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-900">
                  Drag images here or click to upload
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Max {maxAttachments - attachments.length} more images allowed
                </p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
