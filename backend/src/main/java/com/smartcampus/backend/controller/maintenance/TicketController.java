package com.smartcampus.backend.controller.maintenance;

import com.smartcampus.backend.dto.maintenance.CommentCreateRequest;
import com.smartcampus.backend.dto.maintenance.TicketAssignmentRequest;
import com.smartcampus.backend.dto.maintenance.TicketCommentDto;
import com.smartcampus.backend.dto.maintenance.TicketCreateRequest;
import com.smartcampus.backend.dto.maintenance.TicketDetailDto;
import com.smartcampus.backend.dto.maintenance.TicketDto;
import com.smartcampus.backend.dto.maintenance.TicketFeedbackRequest;
import com.smartcampus.backend.dto.maintenance.TicketStatusUpdateRequest;
import com.smartcampus.backend.service.maintenance.CommentService;
import com.smartcampus.backend.service.maintenance.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
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
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse("Ticket not found: " + e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateTicket(@PathVariable Long id, @Valid @RequestBody TicketCreateRequest request) {
        try {
            TicketDto ticket = ticketService.updateTicket(id, request);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse("Ticket not found"), HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        try {
            ticketService.deleteTicket(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse("Ticket not found"), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateTicketStatus(@PathVariable Long id, @Valid @RequestBody TicketStatusUpdateRequest request) {
        try {
            TicketDetailDto ticket = ticketService.updateTicketStatus(id, request);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse("Ticket not found"), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> assignTicket(@PathVariable Long id, @Valid @RequestBody TicketAssignmentRequest request) {
        try {
            TicketDetailDto ticket = ticketService.assignTicket(id, request);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse("Ticket not found"), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addAdminFeedback(@PathVariable Long id, @Valid @RequestBody TicketFeedbackRequest request) {
        try {
            TicketDetailDto ticket = ticketService.addAdminFeedback(id, request);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse("Ticket not found"), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getTechnicianTickets(@PathVariable Long technicianId) {
        try {
            List<TicketDto> tickets = ticketService.getTicketsByAssignedTechnician(technicianId);
            return new ResponseEntity<>(tickets, HttpStatus.OK);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        }
    }

    @PostMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> addComment(@PathVariable Long ticketId, @Valid @RequestBody CommentCreateRequest request) {
        try {
            TicketCommentDto comment = commentService.addComment(ticketId, request);
            return new ResponseEntity<>(comment, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getTicketComments(@PathVariable Long ticketId) {
        try {
            List<TicketCommentDto> comments = commentService.getCommentsByTicketId(ticketId);
            return new ResponseEntity<>(comments, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(new ErrorResponse("Error loading comments: " + e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateComment(@PathVariable Long commentId, @Valid @RequestBody CommentCreateRequest request) {
        try {
            TicketCommentDto comment = commentService.updateComment(commentId, request);
            return new ResponseEntity<>(comment, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
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
            return new ResponseEntity<>(new ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

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
