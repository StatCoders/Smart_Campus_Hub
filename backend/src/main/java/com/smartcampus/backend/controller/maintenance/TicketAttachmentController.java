package com.smartcampus.backend.controller.maintenance;

import com.smartcampus.backend.dto.maintenance.TicketAttachmentDto;
import com.smartcampus.backend.model.maintenance.AttachmentCategory;
import com.smartcampus.backend.service.maintenance.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class TicketAttachmentController {

    private final TicketService ticketService;

    @PostMapping("/{ticketId}/attachments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> uploadAttachment(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "attachmentType", defaultValue = "BEFORE") AttachmentCategory attachmentType) {
        try {
            TicketAttachmentDto attachment = ticketService.uploadAttachment(ticketId, file, attachmentType);
            return new ResponseEntity<>(attachment, HttpStatus.CREATED);
        } catch (AccessDeniedException e) {
            return new ResponseEntity<>(new TicketController.ErrorResponse(e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new TicketController.ErrorResponse(e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new TicketController.ErrorResponse("Failed to upload attachment"), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
