package com.smartcampus.backend.repository.outbox;

import com.smartcampus.backend.model.outbox.OutboxEvent;
import com.smartcampus.backend.model.outbox.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    /** Find all outbox events waiting to be processed. */
    List<OutboxEvent> findByStatus(OutboxStatus status);
}
