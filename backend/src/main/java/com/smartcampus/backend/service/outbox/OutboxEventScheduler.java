package com.smartcampus.backend.service.outbox;

import com.smartcampus.backend.model.outbox.OutboxEvent;
import com.smartcampus.backend.model.outbox.OutboxStatus;
import com.smartcampus.backend.repository.outbox.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Polls the outbox_events table every 5 seconds for PENDING events and marks
 * them PROCESSED.  Actual notification dispatch will be handled by the
 * Notification module (Module C).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxEventScheduler {

    private final OutboxEventRepository outboxEventRepository;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void processPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findByStatus(OutboxStatus.PENDING);

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Processing {} pending outbox event(s)", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                // TODO (Module C): route event.getEventType() to the notification service
                log.info("Outbox event processed  — id={}, type={}", event.getId(), event.getEventType());

                event.setStatus(OutboxStatus.PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
                outboxEventRepository.save(event);

            } catch (Exception ex) {
                log.error("Failed to process outbox event id={}: {}", event.getId(), ex.getMessage(), ex);
                event.setStatus(OutboxStatus.FAILED);
                outboxEventRepository.save(event);
            }
        }
    }
}
