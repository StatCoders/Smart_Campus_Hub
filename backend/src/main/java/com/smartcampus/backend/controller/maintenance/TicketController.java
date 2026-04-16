package com.smartcampus.backend.controller.maintenance;

import com.smartcampus.backend.dto.maintenance.TicketCreateRequest;
import com.smartcampus.backend.dto.maintenance.TicketDto;
import com.smartcampus.backend.service.maintenance.TicketService;
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

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TicketDto> createTicket(@Valid @RequestBody TicketCreateRequest request) {
        TicketDto ticket = ticketService.createTicket(request);
        return new ResponseEntity<>(ticket, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<TicketDto>> getAllTickets() {
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        List<TicketDto> tickets = ticketService.getAllTickets(isAdmin);
        return new ResponseEntity<>(tickets, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<TicketDto> getTicketById(@PathVariable Long id) {
        try {
            TicketDto ticket = ticketService.getTicketById(id);
            return new ResponseEntity<>(ticket, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
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
}
