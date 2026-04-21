/**
 * Supabase file upload service for ticket attachments
 * Handles uploading files to the 'ticket-attachments' bucket
 * Upload is handled securely through the backend API
 */

const BUCKET_NAME = 'ticket-attachments';

/**
 * Upload a file to ticket storage
 * @param {File} file - File to upload
 * @param {number} ticketId - Ticket ID for organizing files
 * @param {string} attachmentType - BEFORE or AFTER
 * @returns {Promise<Object>} - Upload result with url and metadata
 */
export const uploadTicketAttachment = async (file, ticketId, attachmentType = 'BEFORE') => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachmentType', attachmentType);

    const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload multiple files to ticket storage
 * @param {FileList} files - Files to upload
 * @param {number} ticketId - Ticket ID for organizing files
 * @param {string} attachmentType - BEFORE or AFTER
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleAttachments = async (files, ticketId, attachmentType = 'BEFORE') => {
  try {
    const uploadPromises = Array.from(files).map(file =>
      uploadTicketAttachment(file, ticketId, attachmentType)
    );

    const results = await Promise.allSettled(uploadPromises);
    
    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    if (failed.length > 0) {
      console.warn(`${failed.length} files failed to upload`);
    }

    return successful;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

/**
 * Delete an attachment from Supabase storage
 * @param {number} attachmentId - Attachment ID to delete
 * @returns {Promise<void>}
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/tickets/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Delete failed');
    }
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};

/**
 * Get signed URL for downloading an attachment
 * @param {string} filePath - File path in Supabase
 * @returns {Promise<string>} - Signed URL for download
 */
export const getDownloadUrl = async (filePath) => {
  try {
    const response = await fetch(`/api/tickets/attachments/download-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

export default {
  uploadTicketAttachment,
  uploadMultipleAttachments,
  deleteAttachment,
  getDownloadUrl,
};
