package com.smartcampus.backend.service.maintenance;

import com.smartcampus.backend.dto.maintenance.CommentCreateRequest;
import com.smartcampus.backend.dto.maintenance.TicketCommentDto;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.maintenance.Ticket;
import com.smartcampus.backend.model.maintenance.TicketComment;
import com.smartcampus.backend.repository.maintenance.TicketCommentRepository;
import com.smartcampus.backend.repository.maintenance.TicketRepository;
import com.smartcampus.backend.service.auth.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserService userService;

    public TicketCommentDto addComment(Long ticketId, CommentCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        
        // Validate access to ticket
        validateTicketAccess(ticket, currentUser);

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .userId(currentUser.getId())
                .content(request.getContent())
                .build();

        TicketComment savedComment = commentRepository.save(comment);
        return mapToDto(savedComment, currentUser);
    }

    @Transactional(readOnly = true)
    public List<TicketCommentDto> getCommentsByTicketId(Long ticketId) {
        User currentUser = userService.getCurrentUser();
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        
        // All authenticated users can view comments (transparency)
        // No additional access validation needed for read operations
        
        return commentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId).stream()
                .map(c -> mapToDto(c, currentUser))
                .collect(Collectors.toList());
    }

    public TicketCommentDto updateComment(Long commentId, CommentCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        // Only owner or admin can edit
        if (!comment.getUserId().equals(currentUser.getId()) && !currentUser.getRole().equals(Role.ADMIN)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        TicketComment updatedComment = commentRepository.save(comment);
        return mapToDto(updatedComment, currentUser);
    }

    public void deleteComment(Long commentId) {
        User currentUser = userService.getCurrentUser();
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        // Only owner or admin can delete
        if (!comment.getUserId().equals(currentUser.getId()) && !currentUser.getRole().equals(Role.ADMIN)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    private TicketCommentDto mapToDto(TicketComment comment, User currentUser) {
        User commentUser = userService.getUserById(comment.getUserId());
        boolean isEditable = comment.getUserId().equals(currentUser.getId()) || currentUser.getRole().equals(Role.ADMIN);

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
    
    // ==================== ACCESS CONTROL ====================
    
    private void validateTicketAccess(Ticket ticket, User currentUser) {
        // All authenticated users can VIEW tickets and their comments (transparency)
        // ADMIN and TECHNICIAN can access any ticket
        if (currentUser.getRole().equals(Role.ADMIN) || currentUser.getRole().equals(Role.TECHNICIAN)) {
            return;
        }
        
        // Regular users can view all tickets and their comments
        // Comment operations (add/edit/delete) are handled by caller methods
    }
}

