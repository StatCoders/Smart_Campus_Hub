package com.smartcampus.backend.service.maintenance;

import com.smartcampus.backend.dto.maintenance.*;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.maintenance.Status;
import com.smartcampus.backend.model.maintenance.Ticket;
import com.smartcampus.backend.model.maintenance.TicketHistory;
import com.smartcampus.backend.repository.maintenance.TicketRepository;
import com.smartcampus.backend.repository.maintenance.TicketHistoryRepository;
import com.smartcampus.backend.repository.maintenance.TicketCommentRepository;
import com.smartcampus.backend.repository.maintenance.TicketAttachmentRepository;
import com.smartcampus.backend.service.auth.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserService userService;

    // ==================== TICKET CREATION ====================
    
    public TicketDto createTicket(TicketCreateRequest request) {
        User currentUser = userService.getCurrentUser();

        Ticket ticket = Ticket.builder()
                .resourceId(request.getResourceId())
                .userId(currentUser.getId())
                .category(request.getCategory())
                .building(request.getBuilding())
                .roomNumber(request.getRoomNumber())
                .description(request.getDescription())
                .additionalNotes(request.getAdditionalNotes())
                .expectedDate(request.getExpectedDate())
                .priority(request.getPriority())
                .status(Status.OPEN)
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        
        // Create history entry
        createHistoryEntry(savedTicket, currentUser.getId(), "TICKET_CREATED", null, Status.OPEN.toString(), "Ticket created");
        
        return mapToDto(savedTicket);
    }

    // ==================== TICKET RETRIEVAL ====================
    
    @Transactional(readOnly = true)
    public List<TicketDto> getAllTickets(boolean isAdmin) {
        if (isAdmin) {
            return ticketRepository.findAll().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        User currentUser = userService.getCurrentUser();
        return ticketRepository.findByUserId(currentUser.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketDto getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        
        // Validate access: ADMIN/TECHNICIAN can see all, USER can only see their own
        validateTicketAccess(ticket);
        
        return mapToDto(ticket);
    }

    @Transactional(readOnly = true)
    public TicketDetailDto getTicketDetailById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        
        // All authenticated users can view any ticket (transparency)
        // No additional access validation needed for read operations
        
        return mapToDetailDto(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsByAssignedTechnician(Long technicianId) {
        return ticketRepository.findByAssignedTechnicianId(technicianId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ==================== TICKET UPDATES ====================
    
    public TicketDto updateTicket(Long id, TicketCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Only owner or admin/technician can edit
        if (!ticket.getUserId().equals(currentUser.getId()) && 
            !currentUser.getRole().equals(Role.ADMIN) && 
            !currentUser.getRole().equals(Role.TECHNICIAN)) {
            throw new IllegalArgumentException("Access denied: You can only edit your own tickets");
        }

        ticket.setResourceId(request.getResourceId());
        ticket.setCategory(request.getCategory());
        ticket.setBuilding(request.getBuilding());
        ticket.setRoomNumber(request.getRoomNumber());
        ticket.setDescription(request.getDescription());
        ticket.setAdditionalNotes(request.getAdditionalNotes());
        ticket.setExpectedDate(request.getExpectedDate());
        ticket.setPriority(request.getPriority());
        ticket.setContactEmail(request.getContactEmail());
        ticket.setContactPhone(request.getContactPhone());

        Ticket updatedTicket = ticketRepository.save(ticket);
        return mapToDto(updatedTicket);
    }

    public void deleteTicket(Long id) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Only owner or admin/technician can delete
        if (!ticket.getUserId().equals(currentUser.getId()) && 
            !currentUser.getRole().equals(Role.ADMIN) && 
            !currentUser.getRole().equals(Role.TECHNICIAN)) {
            throw new IllegalArgumentException("Access denied: You can only delete your own tickets");
        }

        ticketRepository.delete(ticket);
    }

    // ==================== TICKET WORKFLOW (Status Machine) ====================
    
    public TicketDetailDto updateTicketStatus(Long id, TicketStatusUpdateRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Validate status transition
        validateStatusTransition(ticket.getStatus(), request.getStatus(), currentUser);

        Status oldStatus = ticket.getStatus();
        Status newStatus = request.getStatus();

        // Handle specific status logic
        if (newStatus == Status.IN_PROGRESS && ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

        if (newStatus == Status.RESOLVED || newStatus == Status.CLOSED) {
            ticket.setResolvedAt(LocalDateTime.now());
            if (request.getNotes() != null) {
                ticket.setResolutionNotes(request.getNotes());
            }
        }

        if (newStatus == Status.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Rejection reason is mandatory");
            }
            ticket.setRejectionReason(request.getRejectionReason());
        }

        ticket.setStatus(newStatus);
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Create history entry
        String details = String.format("Status changed from %s to %s", oldStatus, newStatus);
        if (request.getNotes() != null) {
            details += ". Notes: " + request.getNotes();
        }
        createHistoryEntry(updatedTicket, currentUser.getId(), "STATUS_CHANGE", oldStatus.toString(), newStatus.toString(), details);

        return mapToDetailDto(updatedTicket);
    }

    // ==================== TECHNICIAN ASSIGNMENT ====================
    
    public TicketDetailDto assignTicket(Long id, TicketAssignmentRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Validate technician exists and has appropriate role
        User technician = userService.getUserById(request.getTechnicianId());
        if (!technician.getRole().equals(Role.TECHNICIAN)) {
            throw new IllegalArgumentException("User must have TECHNICIAN role");
        }

        Long oldTechnicianId = ticket.getAssignedTechnicianId();
        ticket.setAssignedTechnicianId(request.getTechnicianId());
        
        // Set status to IN_PROGRESS if still OPEN
        if (ticket.getStatus() == Status.OPEN) {
            ticket.setStatus(Status.IN_PROGRESS);
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        // Create history entry
        String details = String.format("Assigned to technician %s", technician.getFirstName() + " " + technician.getLastName());
        createHistoryEntry(updatedTicket, currentUser.getId(), "ASSIGNMENT", 
            oldTechnicianId != null ? oldTechnicianId.toString() : "UNASSIGNED", 
            request.getTechnicianId().toString(), details);

        return mapToDetailDto(updatedTicket);
    }

    // ==================== ACCESS CONTROL ====================
    
    private void validateTicketAccess(Ticket ticket) {
        User currentUser = userService.getCurrentUser();
        
        // All authenticated users can VIEW tickets (transparency)
        // ADMIN and TECHNICIAN can access any ticket
        if (currentUser.getRole().equals(Role.ADMIN) || currentUser.getRole().equals(Role.TECHNICIAN)) {
            return;
        }
        
        // Regular users can view all tickets but operations are handled by caller
        // Ticket viewing is now allowed for all authenticated users
    }

    // ==================== HELPER METHODS ====================
    
    private void validateStatusTransition(Status from, Status to, User user) {
        // Strict status machine: OPEN → IN_PROGRESS → RESOLVED → CLOSED
        // REJECTED can be set by ADMIN/TECHNICIAN from any state except CLOSED

        if (from == to) {
            return; // No change
        }

        boolean isAdminOrTech = user.getRole().equals(Role.ADMIN) || user.getRole().equals(Role.TECHNICIAN);

        if (to == Status.REJECTED) {
            if (!isAdminOrTech) {
                throw new IllegalArgumentException("Only Admin/Technician can reject tickets");
            }
            if (from == Status.CLOSED) {
                throw new IllegalArgumentException("Cannot reject a closed ticket");
            }
            return;
        }

        if (from == Status.CLOSED) {
            throw new IllegalArgumentException("Cannot change status of a closed ticket");
        }

        if (from == Status.REJECTED) {
            throw new IllegalArgumentException("Cannot change status of a rejected ticket");
        }

        // Standard flow
        switch (from) {
            case OPEN:
                if (to != Status.IN_PROGRESS) {
                    throw new IllegalArgumentException("From OPEN, can only move to IN_PROGRESS");
                }
                break;
            case IN_PROGRESS:
                if (to != Status.RESOLVED) {
                    throw new IllegalArgumentException("From IN_PROGRESS, can only move to RESOLVED");
                }
                break;
            case RESOLVED:
                if (to != Status.CLOSED) {
                    throw new IllegalArgumentException("From RESOLVED, can only move to CLOSED");
                }
                break;
            case CLOSED:
            case REJECTED:
                // These cases are already handled above with exceptions
                break;
        }
    }

    private void createHistoryEntry(Ticket ticket, Long userId, String action, String oldValue, String newValue, String details) {
        TicketHistory history = TicketHistory.builder()
                .ticket(ticket)
                .userId(userId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .details(details)
                .build();
        historyRepository.save(history);
    }

    // ==================== DTO MAPPING ====================
    
    private TicketDto mapToDto(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .resourceId(ticket.getResourceId())
                .userId(ticket.getUserId())
                .category(ticket.getCategory())
                .building(ticket.getBuilding())
                .roomNumber(ticket.getRoomNumber())
                .description(ticket.getDescription())
                .additionalNotes(ticket.getAdditionalNotes())
                .expectedDate(ticket.getExpectedDate())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private TicketDetailDto mapToDetailDto(Ticket ticket) {
        User assignedTech = ticket.getAssignedTechnicianId() != null 
            ? userService.getUserById(ticket.getAssignedTechnicianId()) 
            : null;

        User creator = userService.getUserById(ticket.getUserId());

        // Calculate SLA metrics
        Long minutesToFirstResponse = null;
        if (ticket.getFirstResponseAt() != null) {
            minutesToFirstResponse = java.time.temporal.ChronoUnit.MINUTES.between(
                ticket.getCreatedAt(), 
                ticket.getFirstResponseAt()
            );
        }

        Long minutesToResolution = null;
        if (ticket.getResolvedAt() != null) {
            minutesToResolution = java.time.temporal.ChronoUnit.MINUTES.between(
                ticket.getCreatedAt(), 
                ticket.getResolvedAt()
            );
        }

        List<TicketCommentDto> comments = commentRepository.findByTicketIdOrderByCreatedAtDesc(ticket.getId())
                .stream()
                .map(this::mapCommentToDto)
                .collect(Collectors.toList());

        List<TicketAttachmentDto> attachments = attachmentRepository.findByTicketIdOrderByUploadedAtDesc(ticket.getId())
                .stream()
                .map(this::mapAttachmentToDto)
                .collect(Collectors.toList());

        List<TicketHistoryDto> history = historyRepository.findByTicketIdOrderByCreatedAtDesc(ticket.getId())
                .stream()
                .map(this::mapHistoryToDto)
                .collect(Collectors.toList());

        return TicketDetailDto.builder()
                .id(ticket.getId())
                .resourceId(ticket.getResourceId())
                .userId(ticket.getUserId())
                .userFullName(creator.getFirstName() + " " + creator.getLastName())
                .category(ticket.getCategory())
                .building(ticket.getBuilding())
                .roomNumber(ticket.getRoomNumber())
                .description(ticket.getDescription())
                .additionalNotes(ticket.getAdditionalNotes())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .expectedDate(ticket.getExpectedDate())
                .assignedTechnicianId(ticket.getAssignedTechnicianId())
                .assignedTechnicianName(assignedTech != null ? assignedTech.getFirstName() + " " + assignedTech.getLastName() : null)
                .assignedTechnicianEmail(assignedTech != null ? assignedTech.getEmail() : null)
                .resolutionNotes(ticket.getResolutionNotes())
                .firstResponseAt(ticket.getFirstResponseAt())
                .resolvedAt(ticket.getResolvedAt())
                .rejectionReason(ticket.getRejectionReason())
                .contactEmail(ticket.getContactEmail())
                .contactPhone(ticket.getContactPhone())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .comments(comments)
                .attachments(attachments)
                .history(history)
                .minutesToFirstResponse(minutesToFirstResponse)
                .minutesToResolution(minutesToResolution)
                .build();
    }

    private TicketCommentDto mapCommentToDto(com.smartcampus.backend.model.maintenance.TicketComment comment) {
        User commentUser = userService.getUserById(comment.getUserId());
        return TicketCommentDto.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .userId(comment.getUserId())
                .userFullName(commentUser.getFirstName() + " " + commentUser.getLastName())
                .userRole(commentUser.getRole().toString())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private TicketAttachmentDto mapAttachmentToDto(com.smartcampus.backend.model.maintenance.TicketAttachment attachment) {
        User uploader = userService.getUserById(attachment.getUploadedBy());
        return TicketAttachmentDto.builder()
                .id(attachment.getId())
                .ticketId(attachment.getTicket().getId())
                .fileName(attachment.getFileName())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .uploadedBy(attachment.getUploadedBy())
                .uploadedByName(uploader.getFirstName() + " " + uploader.getLastName())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }

    private TicketHistoryDto mapHistoryToDto(TicketHistory history) {
        User historyUser = userService.getUserById(history.getUserId());
        return TicketHistoryDto.builder()
                .id(history.getId())
                .ticketId(history.getTicket().getId())
                .userId(history.getUserId())
                .userFullName(historyUser.getFirstName() + " " + historyUser.getLastName())
                .action(history.getAction())
                .oldValue(history.getOldValue())
                .newValue(history.getNewValue())
                .details(history.getDetails())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
