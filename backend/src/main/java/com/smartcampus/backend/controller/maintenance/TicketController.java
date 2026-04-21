package com.smartcampus.backend.controller.maintenance;

import com.smartcampus.backend.dto.maintenance.*;
import com.smartcampus.backend.service.maintenance.TicketService;
import com.smartcampus.backend.service.maintenance.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class TicketController {

    private final TicketService ticketService;
    private final CommentService commentService;

    // ==================== TICKET CREATION & RETRIEVAL ====================

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TicketDto> createTicket(@Valid @RequestBody TicketCreateRequest request) {
        TicketDto ticket = ticketService.createTicket(request);
        return new ResponseEntity<>(ticket, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<TicketDto>> getAllTickets() {
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        List<TicketDto> tickets = ticketService.getAllTickets(isAdmin);
        return new ResponseEntity<>(tickets, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getTicketById(@PathVariable Long id) {
        try {
            TicketDetailDto ticket = ticketService.getTicketDetailById(id);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (Exception e) {
            // Ticket not found or other error
            return new ResponseEntity<>(
                    new ErrorResponse("Ticket not found: " + e.getMessage()),
                    HttpStatus.NOT_FOUND
            );
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TicketDto> updateTicket(@PathVariable Long id, @Valid @RequestBody TicketCreateRequest request) {
        try {
            TicketDto ticket = ticketService.updateTicket(id, request);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        try {
            ticketService.deleteTicket(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // ==================== TICKET WORKFLOW (Status Transitions) ====================

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateTicketStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketStatusUpdateRequest request) {
        try {
            TicketDetailDto ticket = ticketService.updateTicketStatus(id, request);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new ErrorResponse(e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // ==================== TECHNICIAN ASSIGNMENT ====================

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> assignTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketAssignmentRequest request) {
        try {
            TicketDetailDto ticket = ticketService.assignTicket(id, request);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new ErrorResponse(e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<TicketDto>> getTechnicianTickets(@PathVariable Long technicianId) {
        List<TicketDto> tickets = ticketService.getTicketsByAssignedTechnician(technicianId);
        return new ResponseEntity<>(tickets, HttpStatus.OK);
    }

    // ==================== COMMENTS ====================

    @PostMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CommentCreateRequest request) {
        try {
            TicketCommentDto comment = commentService.addComment(ticketId, request);
            return new ResponseEntity<>(comment, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            // Access denied error
            return new ResponseEntity<>(
                    new ErrorResponse(e.getMessage()),
                    HttpStatus.FORBIDDEN
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ErrorResponse(e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @GetMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getTicketComments(@PathVariable Long ticketId) {
        try {
            List<TicketCommentDto> comments = commentService.getCommentsByTicketId(ticketId);
            return new ResponseEntity<>(comments, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ErrorResponse("Error loading comments: " + e.getMessage()),
                    HttpStatus.NOT_FOUND
            );
        }
    }

    @PutMapping("/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateRequest request) {
        try {
            TicketCommentDto comment = commentService.updateComment(commentId, request);
            return new ResponseEntity<>(comment, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new ErrorResponse(e.getMessage()),
                    HttpStatus.FORBIDDEN
            );
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        try {
            commentService.deleteComment(commentId);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(
                    new ErrorResponse(e.getMessage()),
                    HttpStatus.FORBIDDEN
            );
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // ==================== ERROR RESPONSE ====================

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
