package com.smartcampus.backend.repository.maintenance;

import com.smartcampus.backend.model.maintenance.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUserId(Long userId);

    Optional<Ticket> findByIdAndUserId(Long id, Long userId);
}
