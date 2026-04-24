package com.smartcampus.backend.repository.maintenance;

import com.smartcampus.backend.model.maintenance.Status;
import com.smartcampus.backend.model.maintenance.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUserId(Long userId);

    Optional<Ticket> findByIdAndUserId(Long id, Long userId);
    
    // For technician dashboard - assigned tickets
    List<Ticket> findByAssignedTechnicianId(Long technicianId);
    
    List<Ticket> findByAssignedTechnicianIdAndStatus(Long technicianId, Status status);
    
    // For filtering and statistics
    @Query("SELECT t FROM Ticket t WHERE t.status = :status")
    List<Ticket> findByStatus(@Param("status") Status status);
    
    @Query("SELECT t FROM Ticket t WHERE t.priority = :priority")
    List<Ticket> findByPriority(@Param("priority") String priority);
    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status")
    long countByStatus(@Param("status") Status status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.assignedTechnicianId = :technicianId AND t.status IN :statuses AND t.id <> :ticketId")
    long countActiveAssignmentsForTechnicianExceptTicket(
            @Param("technicianId") Long technicianId,
            @Param("statuses") List<Status> statuses,
            @Param("ticketId") Long ticketId
    );
}
