package com.smartcampus.backend.service.maintenance;

import com.smartcampus.backend.dto.maintenance.TicketCreateRequest;
import com.smartcampus.backend.dto.maintenance.TicketDto;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.maintenance.Status;
import com.smartcampus.backend.model.maintenance.Ticket;
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
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserService userService;

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
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToDto(savedTicket);
    }

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
        return mapToDto(ticket);
    }

    @Transactional(readOnly = true)
    public TicketDto getTicketByIdAndUserId(Long id, Long userId) {
        Ticket ticket = ticketRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        return mapToDto(ticket);
    }

    public TicketDto updateTicket(Long id, TicketCreateRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticket.setResourceId(request.getResourceId());
        ticket.setCategory(request.getCategory());
        ticket.setBuilding(request.getBuilding());
        ticket.setRoomNumber(request.getRoomNumber());
        ticket.setDescription(request.getDescription());
        ticket.setAdditionalNotes(request.getAdditionalNotes());
        ticket.setExpectedDate(request.getExpectedDate());
        ticket.setPriority(request.getPriority());

        Ticket updatedTicket = ticketRepository.save(ticket);
        return mapToDto(updatedTicket);
    }

    public void deleteTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ticketRepository.delete(ticket);
    }

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
}
