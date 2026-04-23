package com.smartcampus.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaUpdateConfig implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            log.info("Checking for missing columns in database...");
            
            // Manually add 'priority' column to 'notifications' table if it doesn't exist
            // This is a safety measure in case Hibernate ddl-auto: update fails
            jdbcTemplate.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(255) DEFAULT 'LOW' NOT NULL");
            
            log.info("Database schema check completed successfully.");
        } catch (Exception e) {
            log.warn("Could not manually update schema: {}. Hibernate will still attempt update.", e.getMessage());
        }
    }
}
