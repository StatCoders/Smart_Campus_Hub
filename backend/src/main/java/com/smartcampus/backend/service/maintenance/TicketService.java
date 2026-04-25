package com.smartcampus.backend.service.maintenance;

import com.smartcampus.backend.dto.maintenance.TicketAttachmentDto;
import com.smartcampus.backend.dto.maintenance.TicketCommentDto;
import com.smartcampus.backend.dto.maintenance.TicketCreateRequest;
import com.smartcampus.backend.dto.maintenance.TicketDetailDto;
import com.smartcampus.backend.dto.maintenance.TicketDto;
import com.smartcampus.backend.dto.maintenance.TicketFeedbackRequest;
import com.smartcampus.backend.dto.maintenance.TicketHistoryDto;
import com.smartcampus.backend.dto.maintenance.TicketStatusUpdateRequest;
import com.smartcampus.backend.dto.maintenance.TicketAssignmentRequest;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.maintenance.AttachmentCategory;
import com.smartcampus.backend.model.maintenance.Status;
import com.smartcampus.backend.model.maintenance.Ticket;
import com.smartcampus.backend.model.maintenance.TicketAttachment;
import com.smartcampus.backend.model.maintenance.TicketHistory;
import com.smartcampus.backend.repository.maintenance.TicketAttachmentRepository;
import com.smartcampus.backend.repository.maintenance.TicketCommentRepository;
import com.smartcampus.backend.repository.maintenance.TicketHistoryRepository;
import com.smartcampus.backend.repository.maintenance.TicketRepository;
import com.smartcampus.backend.service.FileUploadService;
import com.smartcampus.backend.service.auth.UserService;
import com.smartcampus.backend.service.notification.NotificationService;
import com.smartcampus.backend.model.notification.NotificationType;
import com.smartcampus.backend.model.notification.ReferenceType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketService {

    private static final int EDIT_WINDOW_MINUTES = 20;
    private static final int MAX_ATTACHMENTS_PER_CATEGORY = 3;

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository historyRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserService userService;
    private final FileUploadService fileUploadService;
    private final com.smartcampus.backend.repository.auth.UserRepository userRepository;
    
    @org.springframework.context.annotation.Lazy
    private final NotificationService notificationService;

    public TicketDto createTicket(TicketCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        validateExpectedDate(request.getExpectedDate());

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
        createHistoryEntry(savedTicket, currentUser.getId(), "TICKET_CREATED", null, Status.OPEN.toString(), "Ticket created");

        // Notify admins about new ticket
        String adminMessage = String.format("New Ticket #%d: %s from %s", 
                savedTicket.getId(), 
                savedTicket.getCategory(), 
                currentUser.getFirstName() + " " + currentUser.getLastName());
        
        userRepository.findByRoleAndIsActiveTrueOrderByFirstName(Role.ADMIN).forEach(admin -> {
            notificationService.createNotification(
                    admin.getId(),
                    adminMessage,
                    NotificationType.TICKET,
                    savedTicket.getId(),
                    ReferenceType.TICKET
            );
        });

        // Notify the reporter (User) that their ticket has been received
        notificationService.createNotification(
                currentUser.getId(),
                "Your ticket #" + savedTicket.getId() + " has been successfully reported",
                NotificationType.TICKET,
                savedTicket.getId(),
                ReferenceType.TICKET
        );

        return mapToDto(savedTicket, currentUser);
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getAllTickets(boolean isAdmin) {
        User currentUser = userService.getCurrentUser();

        if (isAdmin) {
            return ticketRepository.findAll().stream()
                    .map(ticket -> mapToDto(ticket, currentUser))
                    .collect(Collectors.toList());
        }

        return ticketRepository.findByUserId(currentUser.getId()).stream()
                .map(ticket -> mapToDto(ticket, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketDto getTicketById(Long id) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        validateTicketAccess(ticket, currentUser);
        return mapToDto(ticket, currentUser);
    }

    @Transactional(readOnly = true)
    public TicketDetailDto getTicketDetailById(Long id) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        return mapToDetailDto(ticket, currentUser);
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsByAssignedTechnician(Long technicianId) {
        User currentUser = userService.getCurrentUser();
        if (currentUser.getRole() == Role.TECHNICIAN && !currentUser.getId().equals(technicianId)) {
            throw new AccessDeniedException("Technicians can only view their own assigned queue");
        }

        return ticketRepository.findByAssignedTechnicianId(technicianId).stream()
                .map(ticket -> mapToDto(ticket, currentUser))
                .collect(Collectors.toList());
    }

    public TicketDto updateTicket(Long id, TicketCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        validateTicketEditAccess(ticket, currentUser);
        validateExpectedDate(request.getExpectedDate());

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
        createHistoryEntry(updatedTicket, currentUser.getId(), "TICKET_UPDATED", null, null, "Ticket details were updated");
        return mapToDto(updatedTicket, currentUser);
    }

    public void deleteTicket(Long id) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (!ticket.getUserId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN
                && currentUser.getRole() != Role.TECHNICIAN) {
            throw new AccessDeniedException("You can only delete your own tickets");
        }

        ticketRepository.delete(ticket);
    }

    public TicketDetailDto updateTicketStatus(Long id, TicketStatusUpdateRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (currentUser.getRole() == Role.TECHNICIAN) {
            validateTechnicianOwnership(ticket, currentUser);
        }

        validateStatusTransition(ticket.getStatus(), request.getStatus(), currentUser);

        Status oldStatus = ticket.getStatus();
        Status newStatus = request.getStatus();

        if (newStatus == Status.IN_PROGRESS && ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

        if (newStatus == Status.RESOLVED) {
            if (request.getNotes() == null || request.getNotes().trim().isEmpty()) {
                throw new IllegalArgumentException("Resolution notes are mandatory when resolving a ticket");
            }
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolutionNotes(request.getNotes().trim());
        }

        if (newStatus == Status.CLOSED && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        if (newStatus == Status.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Rejection reason is mandatory");
            }
            ticket.setRejectionReason(request.getRejectionReason().trim());
            ticket.setRejectedByRole(currentUser.getRole());
        } else {
            ticket.setRejectionReason(null);
            ticket.setRejectedByRole(null);
        }

        ticket.setStatus(newStatus);
        Ticket updatedTicket = ticketRepository.save(ticket);

        String details = String.format("Status changed from %s to %s", oldStatus, newStatus);
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            details += ". Notes: " + request.getNotes().trim();
        }
        if (request.getRejectionReason() != null && !request.getRejectionReason().trim().isEmpty()) {
            details += ". Rejection reason: " + request.getRejectionReason().trim();
        }
        createHistoryEntry(updatedTicket, currentUser.getId(), "STATUS_CHANGE", oldStatus.toString(), newStatus.toString(), details);

        // Notify user about status change
        String timestamp = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String techName = currentUser.getRole() == Role.TECHNICIAN ? currentUser.getFirstName() + " " + currentUser.getLastName() : "Staff";
        
        if (newStatus == Status.IN_PROGRESS && oldStatus == Status.OPEN) {
            notificationService.createNotification(ticket.getUserId(), "Your ticket #" + ticket.getId() + " is now IN_PROGRESS", NotificationType.TICKET, ticket.getId(), ReferenceType.TICKET);
        } else if (newStatus == Status.RESOLVED) {
            String resolvedMsg = String.format("Your ticket #%d has been RESOLVED by %s at %s", ticket.getId(), techName, timestamp);
            notificationService.createNotification(ticket.getUserId(), resolvedMsg, NotificationType.TICKET_RESOLVED, ticket.getId(), ReferenceType.TICKET);
            
            // Notify admins if technician resolved it
            if (currentUser.getRole() == Role.TECHNICIAN) {
                String adminMsg = String.format("Ticket #%d has been marked as RESOLVED by technician %s at %s", ticket.getId(), techName, timestamp);
                userRepository.findByRoleAndIsActiveTrueOrderByFirstName(Role.ADMIN).forEach(admin -> {
                    notificationService.createNotification(admin.getId(), adminMsg, NotificationType.TICKET_RESOLVED, ticket.getId(), ReferenceType.TICKET);
                });
            }
        } else if (newStatus == Status.CLOSED) {
            String closedMsg = String.format("Your ticket #%d has been CLOSED by %s at %s", ticket.getId(), techName, timestamp);
            notificationService.createNotification(ticket.getUserId(), closedMsg, NotificationType.TICKET_RESOLVED, ticket.getId(), ReferenceType.TICKET);
            
            // Notify admins if technician closed it
            if (currentUser.getRole() == Role.TECHNICIAN) {
                String adminMsg = String.format("Ticket #%d has been marked as CLOSED by technician %s at %s", ticket.getId(), techName, timestamp);
                userRepository.findByRoleAndIsActiveTrueOrderByFirstName(Role.ADMIN).forEach(admin -> {
                    notificationService.createNotification(admin.getId(), adminMsg, NotificationType.TICKET_RESOLVED, ticket.getId(), ReferenceType.TICKET);
                });
            }
        } else if (newStatus == Status.REJECTED) {
            notificationService.createNotification(ticket.getUserId(), "Your ticket #" + ticket.getId() + " has been REJECTED", NotificationType.TICKET, ticket.getId(), ReferenceType.TICKET);
        }

        return mapToDetailDto(updatedTicket, currentUser);
    }

    public TicketDetailDto assignTicket(Long id, TicketAssignmentRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        User technician = userService.getUser(request.getTechnicianId());
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("User must have TECHNICIAN role");
        }

        long activeAssignments = ticketRepository.countActiveAssignmentsForTechnicianExceptTicket(
                technician.getId(),
                List.of(Status.OPEN, Status.IN_PROGRESS),
                ticket.getId()
        );
        if (activeAssignments > 0) {
            throw new IllegalArgumentException("Technician is already assigned to an active ticket");
        }

        if (ticket.getStatus() == Status.REJECTED && ticket.getRejectedByRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin-rejected tickets cannot be reassigned");
        }

        if (ticket.getStatus() == Status.REJECTED && ticket.getRejectedByRole() == Role.TECHNICIAN && currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only an admin can reassign a technician-rejected ticket");
        }

        Long oldTechnicianId = ticket.getAssignedTechnicianId();
        ticket.setAssignedTechnicianId(request.getTechnicianId());
        ticket.setRejectionReason(null);
        ticket.setRejectedByRole(null);

        if (ticket.getStatus() == Status.OPEN || ticket.getStatus() == Status.REJECTED) {
            ticket.setStatus(Status.IN_PROGRESS);
            if (ticket.getFirstResponseAt() == null) {
              ticket.setFirstResponseAt(LocalDateTime.now());
            }
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        String details = String.format("Assigned to technician %s", technician.getFirstName() + " " + technician.getLastName());
        if (request.getNote() != null && !request.getNote().trim().isEmpty()) {
            details += ". Note: " + request.getNote().trim();
        }
        createHistoryEntry(
                updatedTicket,
                currentUser.getId(),
                "ASSIGNMENT",
                oldTechnicianId != null ? oldTechnicianId.toString() : "UNASSIGNED",
                request.getTechnicianId().toString(),
                details
        );

        String descriptionPreview = ticket.getDescription() != null 
                ? (ticket.getDescription().length() > 50 ? ticket.getDescription().substring(0, 47) + "..." : ticket.getDescription())
                : "No description";
        
        String assignmentMessage = String.format("Ticket #%d assigned to you: %s. Assigned by admin %s on %s.",
                ticket.getId(),
                descriptionPreview,
                currentUser.getFirstName() + " " + currentUser.getLastName(),
                LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

        notificationService.createNotification(
                request.getTechnicianId(),
                assignmentMessage,
                NotificationType.ASSIGN_TICKET,
                ticket.getId(),
                ReferenceType.TICKET
        );

        // Notify ticket owner (Student)
        String userMessage = String.format("Your ticket #%d has been assigned to technician %s and is now IN_PROGRESS.",
                ticket.getId(),
                technician.getFirstName() + " " + technician.getLastName());
        
        notificationService.createNotification(
                ticket.getUserId(),
                userMessage,
                NotificationType.TICKET,
                ticket.getId(),
                ReferenceType.TICKET
        );

        return mapToDetailDto(updatedTicket, currentUser);
    }

    public TicketAttachmentDto uploadAttachment(Long ticketId, MultipartFile file, AttachmentCategory attachmentCategory) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        validateAttachmentUploadAccess(ticket, currentUser, attachmentCategory);

        long existingCount = attachmentRepository.countByTicketIdAndAttachmentCategory(ticketId, attachmentCategory);
        if (existingCount >= MAX_ATTACHMENTS_PER_CATEGORY) {
            throw new IllegalArgumentException("Only 3 " + attachmentCategory.name().toLowerCase() + " images are allowed");
        }

        try {
            String storedFilename = fileUploadService.saveFile(file);
            TicketAttachment attachment = TicketAttachment.builder()
                    .ticket(ticket)
                    .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : storedFilename)
                    .fileUrl("/uploads/" + storedFilename)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .attachmentCategory(attachmentCategory)
                    .uploadedBy(currentUser.getId())
                    .build();

            TicketAttachment savedAttachment = attachmentRepository.save(attachment);
            createHistoryEntry(
                    ticket,
                    currentUser.getId(),
                    "ATTACHMENT_UPLOADED",
                    null,
                    attachmentCategory.name(),
                    attachmentCategory == AttachmentCategory.AFTER
                            ? "Technician completion image uploaded"
                            : "Issue image uploaded"
            );
            return mapAttachmentToDto(savedAttachment);
        } catch (Exception ex) {
            if (ex instanceof IllegalArgumentException) {
                throw (IllegalArgumentException) ex;
            }
            throw new IllegalArgumentException("Failed to upload attachment");
        }
    }

    public TicketDetailDto addAdminFeedback(Long ticketId, TicketFeedbackRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only admins can submit ticket feedback");
        }

        if (ticket.getStatus() != Status.RESOLVED && ticket.getStatus() != Status.CLOSED) {
            throw new IllegalArgumentException("Feedback can only be submitted for resolved or closed tickets");
        }

        ticket.setAdminFeedback(request.getFeedback().trim());
        ticket.setAdminRating(request.getRating());
        ticket.setAdminFeedbackBy(currentUser.getId());
        ticket.setAdminFeedbackAt(LocalDateTime.now());

        Ticket updatedTicket = ticketRepository.save(ticket);
        createHistoryEntry(updatedTicket, currentUser.getId(), "ADMIN_FEEDBACK", null, String.valueOf(request.getRating()), "Admin feedback recorded");
        return mapToDetailDto(updatedTicket, currentUser);
    }

    private void validateTicketAccess(Ticket ticket, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.TECHNICIAN) {
            return;
        }

        if (!ticket.getUserId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have access to this ticket");
        }
    }

    private void validateTicketEditAccess(Ticket ticket, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.TECHNICIAN) {
            return;
        }

        if (!ticket.getUserId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only edit your own tickets");
        }

        if (ticket.getCreatedAt().plusMinutes(EDIT_WINDOW_MINUTES).isBefore(LocalDateTime.now())) {
            throw new AccessDeniedException("You can't edit ticket now and it's timed out");
        }
    }

    private void validateTechnicianOwnership(Ticket ticket, User currentUser) {
        if (ticket.getAssignedTechnicianId() == null || !ticket.getAssignedTechnicianId().equals(currentUser.getId())) {
            throw new AccessDeniedException("This ticket is not assigned to your technician account");
        }
    }

    private void validateAttachmentUploadAccess(Ticket ticket, User currentUser, AttachmentCategory attachmentCategory) {
        if (attachmentCategory == AttachmentCategory.BEFORE) {
            boolean isOwner = ticket.getUserId().equals(currentUser.getId());
            if (!isOwner && currentUser.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("Only the ticket owner or an admin can upload issue images");
            }
            return;
        }

        if (currentUser.getRole() != Role.TECHNICIAN) {
            throw new AccessDeniedException("Only technicians can upload completion images");
        }

        validateTechnicianOwnership(ticket, currentUser);
        if (ticket.getStatus() != Status.IN_PROGRESS && ticket.getStatus() != Status.RESOLVED && ticket.getStatus() != Status.CLOSED) {
            throw new IllegalArgumentException("Completion images can only be uploaded for active or completed technician work");
        }
    }

    private void validateExpectedDate(LocalDate expectedDate) {
        if (expectedDate != null && expectedDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Expected date cannot be in the past");
        }
    }

    private void validateStatusTransition(Status from, Status to, User user) {
        if (from == to) {
            return;
        }

        boolean isAdminOrTech = user.getRole() == Role.ADMIN || user.getRole() == Role.TECHNICIAN;

        if (to == Status.REJECTED) {
            if (!isAdminOrTech) {
                throw new IllegalArgumentException("Only Admin or Technician can reject tickets");
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
            throw new IllegalArgumentException("Rejected tickets must be reassigned by an admin before work can continue");
        }

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
            default:
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

    private TicketDto mapToDto(Ticket ticket, User viewer) {
        String assignedTechnicianName = null;
        if (ticket.getAssignedTechnicianId() != null) {
            try {
                User assignedTech = userService.getUser(ticket.getAssignedTechnicianId());
                assignedTechnicianName = assignedTech.getFirstName() + " " + assignedTech.getLastName();
            } catch (Exception ignored) {
                assignedTechnicianName = null;
            }
        }

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
                .assignedTechnicianId(ticket.getAssignedTechnicianId())
                .assignedTechnicianName(assignedTechnicianName)
                .rejectionReason(shouldRevealListRejectionReason(ticket, viewer) ? ticket.getRejectionReason() : null)
                .rejectedByRole(ticket.getRejectedByRole())
                .adminFeedback(ticket.getAdminFeedback())
                .adminRating(ticket.getAdminRating())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private TicketDetailDto mapToDetailDto(Ticket ticket, User viewer) {
        User assignedTech = ticket.getAssignedTechnicianId() != null
                ? userService.getUser(ticket.getAssignedTechnicianId())
                : null;
        User creator = userService.getUser(ticket.getUserId());
        User feedbackAdmin = ticket.getAdminFeedbackBy() != null ? userService.getUser(ticket.getAdminFeedbackBy()) : null;

        Long minutesToFirstResponse = ticket.getFirstResponseAt() != null
                ? ChronoUnit.MINUTES.between(ticket.getCreatedAt(), ticket.getFirstResponseAt())
                : null;
        Long minutesToResolution = ticket.getResolvedAt() != null
                ? ChronoUnit.MINUTES.between(ticket.getCreatedAt(), ticket.getResolvedAt())
                : null;

        List<TicketCommentDto> comments = commentRepository.findByTicketIdOrderByCreatedAtDesc(ticket.getId()).stream()
                .map(comment -> mapCommentToDto(comment, viewer))
                .collect(Collectors.toList());

        List<TicketAttachmentDto> beforeAttachments = attachmentRepository
                .findByTicketIdAndAttachmentCategoryOrderByUploadedAtDesc(ticket.getId(), AttachmentCategory.BEFORE)
                .stream()
                .map(this::mapAttachmentToDto)
                .collect(Collectors.toList());

        List<TicketAttachmentDto> technicianAttachments = (viewer.getRole() == Role.ADMIN || viewer.getRole() == Role.TECHNICIAN)
                ? attachmentRepository.findByTicketIdAndAttachmentCategoryOrderByUploadedAtDesc(ticket.getId(), AttachmentCategory.AFTER)
                        .stream()
                        .map(this::mapAttachmentToDto)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        List<TicketHistoryDto> history = historyRepository.findByTicketIdOrderByCreatedAtDesc(ticket.getId()).stream()
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
                .rejectionReason(shouldRevealDetailRejectionReason(ticket, viewer) ? ticket.getRejectionReason() : null)
                .rejectedByRole(ticket.getRejectedByRole())
                .contactEmail(ticket.getContactEmail())
                .contactPhone(ticket.getContactPhone())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .comments(comments)
                .attachments(beforeAttachments)
                .technicianAttachments(technicianAttachments)
                .history(history)
                .adminFeedback(ticket.getAdminFeedback())
                .adminRating(ticket.getAdminRating())
                .feedbackByAdminName(feedbackAdmin != null ? feedbackAdmin.getFirstName() + " " + feedbackAdmin.getLastName() : null)
                .adminFeedbackAt(ticket.getAdminFeedbackAt())
                .minutesToFirstResponse(minutesToFirstResponse)
                .minutesToResolution(minutesToResolution)
                .build();
    }

    private boolean shouldRevealListRejectionReason(Ticket ticket, User viewer) {
        return viewer.getRole() == Role.USER
                && viewer.getId().equals(ticket.getUserId())
                && ticket.getRejectedByRole() == Role.ADMIN;
    }

    private boolean shouldRevealDetailRejectionReason(Ticket ticket, User viewer) {
        if (ticket.getRejectedByRole() == Role.ADMIN) {
            return viewer.getRole() == Role.USER && viewer.getId().equals(ticket.getUserId());
        }

        if (ticket.getRejectedByRole() == Role.TECHNICIAN) {
            return viewer.getRole() == Role.ADMIN;
        }

        return false;
    }

    private TicketCommentDto mapCommentToDto(com.smartcampus.backend.model.maintenance.TicketComment comment, User viewer) {
        User commentUser = userService.getUser(comment.getUserId());
        boolean isEditable = comment.getUserId().equals(viewer.getId()) || viewer.getRole() == Role.ADMIN;

        return TicketCommentDto.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .userId(comment.getUserId())
                .userFullName(commentUser.getFirstName() + " " + commentUser.getLastName())
                .userRole(commentUser.getRole().toString())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isEditable(isEditable)
                .build();
    }

    private TicketAttachmentDto mapAttachmentToDto(TicketAttachment attachment) {
        User uploader = userService.getUser(attachment.getUploadedBy());
        return TicketAttachmentDto.builder()
                .id(attachment.getId())
                .ticketId(attachment.getTicket().getId())
                .fileName(attachment.getFileName())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .uploadedBy(attachment.getUploadedBy())
                .uploadedByName(uploader.getFirstName() + " " + uploader.getLastName())
                .attachmentCategory(attachment.getAttachmentCategory())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }

    private TicketHistoryDto mapHistoryToDto(TicketHistory history) {
        User historyUser = userService.getUser(history.getUserId());
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
