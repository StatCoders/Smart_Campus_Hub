package com.smartcampus.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtUtilTest {

    @Test
    void extractRole_defaultsToUserWhenMissing() throws Exception {
        JwtUtil jwtUtil = new JwtUtil();
        setField(jwtUtil, "jwtSecret", "01234567890123456789012345678901");
        setField(jwtUtil, "jwtExpirationMs", 60_000L);
        setField(jwtUtil, "jwtRefreshExpirationMs", 60_000L);

        UserDetails userDetails = User.withUsername("user@example.com")
                .password("ignored")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        String refreshToken = jwtUtil.generateRefreshToken(userDetails); // no role claim
        assertEquals("USER", jwtUtil.extractRole(refreshToken));
    }

    @Test
    void extractRole_readsRoleFromAccessToken() throws Exception {
        JwtUtil jwtUtil = new JwtUtil();
        setField(jwtUtil, "jwtSecret", "01234567890123456789012345678901");
        setField(jwtUtil, "jwtExpirationMs", 60_000L);
        setField(jwtUtil, "jwtRefreshExpirationMs", 60_000L);

        UserDetails userDetails = User.withUsername("admin@example.com")
                .password("ignored")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();

        String token = jwtUtil.generateToken(userDetails);
        assertEquals("ADMIN", jwtUtil.extractRole(token));
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}

