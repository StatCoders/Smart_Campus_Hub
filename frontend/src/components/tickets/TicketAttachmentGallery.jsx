import React, { useId, useState } from 'react';
import { Download, Upload, Loader, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function TicketAttachmentGallery({
  attachments = [],
  onUpload = null,
  isLoading = false,
  emptyMessage = 'No attachments yet',
  helperMessage = 'Upload up to 3 images to document the issue',
  maxAttachments = 3,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const fileInputId = useId();

  const getAttachmentUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (/^(https?:|data:|blob:)/i.test(fileUrl)) return fileUrl;
    return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  };

  const isImage = (attachment) =>
    attachment.fileType?.includes('image') ||
    /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(attachment.fileUrl || '');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (onUpload && e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Images-only list for lightbox navigation
  const imageAttachments = attachments.filter(isImage);

  const openLightbox = (attachmentId) => {
    const idx = imageAttachments.findIndex((a) => a.id === attachmentId || a === attachmentId);
    if (idx !== -1) setLightboxIdx(idx);
  };

  const closeLightbox = () => setLightboxIdx(null);

  const prevImage = (e) => {
    e.stopPropagation();
    setLightboxIdx((i) => (i - 1 + imageAttachments.length) % imageAttachments.length);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLightboxIdx((i) => (i + 1) % imageAttachments.length);
  };

  const renderUploadArea = () => {
    if (!onUpload || attachments.length >= maxAttachments) return null;
    return (
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => { if (e.target.files) onUpload(e.target.files); }}
          className="hidden"
          id={fileInputId}
        />
        <label htmlFor={fileInputId} className="cursor-pointer block">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-slate-600">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className="h-7 w-7 mx-auto text-blue-400 mb-2" />
              <p className="text-sm font-medium text-slate-800">
                Drag images here or click to upload
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {maxAttachments - attachments.length} slot{maxAttachments - attachments.length !== 1 ? 's' : ''} remaining · JPEG, PNG, WebP
              </p>
            </>
          )}
        </label>
      </div>
    );
  };

  if (!attachments || attachments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-10 text-slate-400">
          <Upload className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">{emptyMessage}</p>
          {onUpload && <p className="text-xs mt-1 text-slate-400">{helperMessage}</p>}
        </div>
        {renderUploadArea()}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Attachments Grid */}
        <div className={`grid gap-3 ${attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
          {attachments.map((attachment, idx) => {
            const url = getAttachmentUrl(attachment.fileUrl);
            const img = isImage(attachment);

            return (
              <div
                key={attachment.id || idx}
                className="relative group rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
                style={{ aspectRatio: '4/3' }}
              >
                {img && url ? (
                  <>
                    {/* Full-cover image */}
                    <img
                      src={url}
                      alt={attachment.fileName || `Attachment ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    {/* Fallback (hidden by default, shown on img error) */}
                    <div
                      className="absolute inset-0 bg-gray-100 items-center justify-center text-center p-2"
                      style={{ display: 'none' }}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 truncate">{attachment.fileName}</p>
                    </div>
                  </>
                ) : (
                  /* Non-image file placeholder */
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-center p-3">
                    <div>
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 font-medium truncate">{attachment.fileName || 'File'}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  {img && url && (
                    <button
                      onClick={() => openLightbox(attachment.id || attachment)}
                      className="p-2.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow"
                      title="View full image"
                    >
                      <ZoomIn className="h-4 w-4 text-slate-700" />
                    </button>
                  )}
                  {url && (
                    <a
                      href={url}
                      download={attachment.fileName}
                      className="p-2.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow"
                      title="Download"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-4 w-4 text-blue-600" />
                    </a>
                  )}
                </div>

                {/* File name badge at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="text-white text-xs font-medium truncate">{attachment.fileName || `Image ${idx + 1}`}</p>
                  <p className="text-white/70 text-xs">{formatFileSize(attachment.fileSize)}{attachment.uploadedByName ? ` · ${attachment.uploadedByName}` : ''}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Area */}
        {renderUploadArea()}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && imageAttachments[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          {imageAttachments.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={getAttachmentUrl(imageAttachments[lightboxIdx].fileUrl)}
            alt={imageAttachments[lightboxIdx].fileName}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {imageAttachments.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Caption */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white/80 text-sm">
            <p className="font-medium">{imageAttachments[lightboxIdx].fileName}</p>
            <p className="text-xs text-white/50 mt-0.5">
              {lightboxIdx + 1} / {imageAttachments.length}
              {imageAttachments[lightboxIdx].uploadedByName ? ` · By: ${imageAttachments[lightboxIdx].uploadedByName}` : ''}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
