# MODULE C - COMPREHENSIVE FRONTEND IMPLEMENTATION GUIDE

## Already Implemented Backend ✅
- Enhanced Ticket Model with assignment, SLA tracking, resolution notes
- TicketHistory model for audit trail
- TicketAttachment and TicketComment models
- Enhanced DTOs with all related data
- Request DTOs for workflow operations
- Comprehensive TicketService with:
  - Status machine validation (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
  - Technician assignment logic
  - SLA calculation (minutes to first response, resolution)
  - History tracking for audit trail
- CommentService for comment CRUD with ownership validation
- Enhanced TicketController with ALL endpoints:
  - GET/POST /api/tickets (create, list)
  - GET /api/tickets/{id} (detail with relations)
  - PUT /api/tickets/{id}/status (workflow)
  - POST /api/tickets/{id}/assign (assignment)
  - POST /api/tickets/{ticketId}/comments (add comment)
  - GET /api/tickets/{ticketId}/comments (list comments)
  - PUT/DELETE /api/tickets/comments/{commentId} (edit/delete)
- Updated repositories with all necessary queries

## Frontend Components To Create

### 1. TicketDetailPage.jsx (Shared Full-Screen View)
Location: `frontend/src/pages/TicketDetailPage.jsx`
Features:
- Luxurious full-screen layout with sidebar + main content
- Ticket info section (left panel)
- Actions panel (right sidebar) with role-based buttons
- Comments section with add/edit/delete
- Attachments gallery with preview
- Timeline of status changes and activity
- SLA metrics display
- Responsive design with blue theme

### 2. TicketCommentThread.jsx (Reusable Comment Component)
Location: `frontend/src/components/tickets/TicketCommentThread.jsx`
Features:
- List all comments with user info and timestamps
- Add new comment textarea with submit
- Edit comment (owner/admin only)
- Delete comment (owner/admin only)
- Real-time updates using React Query
- User avatars and role badges

### 3. TicketTimeline.jsx (Activity Timeline)
Location: `frontend/src/components/tickets/TicketTimeline.jsx`
Features:
- Visual timeline of all status changes
- Technician assignments
- Comments added
- Attachments uploaded
- Color-coded by action type
- Shows user and timestamp for each action

### 4. TicketAttachmentGallery.jsx (Preview Gallery)
Location: `frontend/src/components/tickets/TicketAttachmentGallery.jsx`
Features:
- Grid display of attachments
- Image previews
- Download links to Supabase
- Upload new attachments (up to 3)
- Drag & drop upload
- File size display

### 5. Enhanced TicketTable.jsx (Modify Existing)
Location: `frontend/src/components/TicketTable.jsx`
Changes:
- Add columns: Ticket ID, Resource Location, Category, Priority (colored), Status (colored badge), Assigned To, Created Date, Last Updated, Actions
- Make Ticket ID clickable → navigate to detail page
- Role-based action buttons (View/Edit/Delete for student, full control for admin)
- Color-coded Priority: Low(green), Medium(amber), High(orange), Urgent(red)
- Color-coded Status badges
- Hover effects and transitions

### 6. Custom Hooks (Data Fetching & Management)
Location: `frontend/src/hooks/`

#### useTickets.js
```javascript
// Fetch tickets with filtering and pagination
// Use TanStack Query for caching and background updates
```

#### useTicketDetail.js
```javascript
// Fetch single ticket with all relations (comments, attachments, history)
// Real-time updates on status changes
```

#### useComments.js
```javascript
// Manage comments for a ticket
// Add, edit, delete with optimistic updates
```

#### useSLATimer.js
```javascript
// Calculate and display SLA metrics
// Real-time countdown timer for overdue tickets
```

### 7. Enhanced CreateTicket Component (Modify Existing)
Add fields:
- Contact Email input
- Contact Phone input
- Move "Attachments" to accept up to 3 images
- Preview thumbnails for uploaded files
- Drag & drop enhancement

### 8. Dashboard Updates

#### StudentDashboard.jsx (Update)
- Add "My Tickets" section with quick stats
- Display recent ticket updates
- Show SLA status (on-time, overdue)
- Link to create new ticket

#### TechnicianDashboard.jsx (Update)
- "My Assigned Tickets" section
- Quick status update buttons (IN_PROGRESS → RESOLVED → CLOSED)
- Overdue tickets highlighting
- Add resolution notes quick-entry

#### AdminDashboard.jsx (Update)
- "All Tickets" overview with statistics
- Unassigned tickets count and list
- Admin controls for workflow and assignments
- System health metrics

### 9. Supabase Storage Integration
```javascript
// Create function in services/fileUploadService.js
// Upload to bucket: 'ticket-attachments'
// Generate signed URLs for download
// Delete old attachments
```

### 10. Color Scheme (Maintain Luxury Theme)
- Primary: Light Sky Blue #E0F2FE, #BAE6FD
- Dark: Navy #0F172A, #1E40AF
- Status Colors:
  - OPEN: Red #DC2626
  - IN_PROGRESS: Amber #F59E0B
  - RESOLVED: Green #10B981
  - CLOSED: Slate #64748B
  - REJECTED: Rose #E11D48
- Priority Colors:
  - LOW: Green #22C55E
  - MEDIUM: Yellow #EAB308
  - HIGH: Orange #F97316
  - URGENT: Red #EF4444

## API Endpoints Summary

### Tickets
- POST /api/tickets - Create ticket
- GET /api/tickets - List tickets (role-based)
- GET /api/tickets/{id} - Get ticket detail
- PUT /api/tickets/{id} - Update ticket
- DELETE /api/tickets/{id} - Delete ticket
- PUT /api/tickets/{id}/status - Update status
- POST /api/tickets/{id}/assign - Assign technician
- GET /api/tickets/technician/{id} - Get technician's tickets

### Comments
- POST /api/tickets/{ticketId}/comments - Add comment
- GET /api/tickets/{ticketId}/comments - List comments
- PUT /api/tickets/comments/{id} - Edit comment
- DELETE /api/tickets/comments/{id} - Delete comment

### Attachments (Backend Ready)
- Handled via TicketAttachment model
- Supabase bucket: ticket-attachments
- Max 3 per ticket

## Implementation Priority
1. Create TicketDetailPage (critical for navigation)
2. Create TicketCommentThread (support feature)
3. Create TicketTimeline (visualization)
4. Enhance TicketTable with new columns
5. Update three dashboards
6. Create custom hooks for data management
7. Integrate Supabase file uploads

## Testing Checklist
- [ ] Create ticket with attachments
- [ ] View ticket detail with all relations
- [ ] Add/edit/delete comments
- [ ] Update ticket status (validate state machine)
- [ ] Assign technician
- [ ] View timeline of changes
- [ ] Download attachments
- [ ] Test role-based permissions
- [ ] Verify SLA calculations
- [ ] Test on mobile (responsive)

## Notes
- All components use Tailwind CSS with rounded-3xl for luxury feel
- Soft shadows and generous whitespace
- Loading skeletons while fetching
- Error handling with user-friendly messages
- Optimistic updates where appropriate
- Real-time updates where needed
- Accessibility: ARIA labels, keyboard navigation
