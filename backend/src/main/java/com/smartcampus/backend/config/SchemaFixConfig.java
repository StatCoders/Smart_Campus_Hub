package com.smartcampus.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class SchemaFixConfig {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    public CommandLineRunner fixSchema() {
        return args -> {
            // Run in a separate thread or just with heavy try-catches to avoid stopping the app
            new Thread(() -> {
                try {
                    // Wait a few seconds for Hibernate to finish its own DDL tasks
                    Thread.sleep(5000);
                    
                    log.info("Starting background schema validation...");
                    
                    String[] queries = {
                        "ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS mute_all BOOLEAN DEFAULT FALSE",
                        "ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS high_priority_only BOOLEAN DEFAULT FALSE",
                        "ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT TRUE",
                        "ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS ticket_enabled BOOLEAN DEFAULT TRUE",
                        "ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS system_enabled BOOLEAN DEFAULT TRUE",
                        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'LOW'"
                    };

                    for (String sql : queries) {
                        try {
                            jdbcTemplate.execute(sql);
                        } catch (Exception e) {
                            log.debug("SQL execution skipped/failed (expected if column exists): {}", e.getMessage());
                        }
                    }
                    
                    log.info("Schema validation completed successfully.");
                } catch (Exception e) {
                    log.error("Background schema fix encountered an error: {}", e.getMessage());
                }
            }).start();
        };
    }
}
