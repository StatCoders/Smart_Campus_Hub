package com.smartcampus.backend.service.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.dto.auth.GoogleTokenInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.Map;

@Service
public class GoogleOAuthService {

    @Value("${google.oauth.client-id}")
    private String clientId;

    private final ObjectMapper objectMapper;

    public GoogleOAuthService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public GoogleTokenInfo validateToken(String token) {
        try {
            if (token == null || token.isBlank()) {
                throw new IllegalArgumentException("Google token is required");
            }

            // ID tokens are JWTs (3 parts). Access tokens are opaque strings.
            String[] parts = token.split("\\.");
            if (parts.length == 3) {
                return validateIdToken(token);
            }

            return validateAccessToken(token);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to validate Google token: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private GoogleTokenInfo validateIdToken(String token) throws Exception {
        // Parse JWT payload (without signature verification) and validate audience.
        String[] parts = token.split("\\.");
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
        Map<String, Object> claims = objectMapper.readValue(payload, Map.class);

        GoogleTokenInfo tokenInfo = new GoogleTokenInfo();
        tokenInfo.setAud((String) claims.get("aud"));
        tokenInfo.setEmail((String) claims.get("email"));
        tokenInfo.setEmailVerified((Boolean) claims.getOrDefault("email_verified", false));
        tokenInfo.setSub((String) claims.get("sub"));
        tokenInfo.setName((String) claims.get("name"));
        tokenInfo.setGivenName((String) claims.get("given_name"));
        tokenInfo.setFamilyName((String) claims.get("family_name"));
        tokenInfo.setPicture((String) claims.get("picture"));

        if (tokenInfo.getAud() == null || !tokenInfo.getAud().equals(clientId)) {
            throw new IllegalArgumentException("Invalid token audience. Expected: " + clientId + ", Got: " + tokenInfo.getAud());
        }

        return tokenInfo;
    }

    @SuppressWarnings("unchecked")
    private GoogleTokenInfo validateAccessToken(String accessToken) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IllegalArgumentException("Google userinfo request failed with status " + response.statusCode());
        }

        Map<String, Object> claims = objectMapper.readValue(response.body(), Map.class);

        GoogleTokenInfo tokenInfo = new GoogleTokenInfo();
        tokenInfo.setAud(clientId);
        tokenInfo.setEmail((String) claims.get("email"));
        tokenInfo.setEmailVerified((Boolean) claims.getOrDefault("email_verified", false));
        tokenInfo.setSub((String) claims.get("sub"));
        tokenInfo.setName((String) claims.get("name"));
        tokenInfo.setGivenName((String) claims.get("given_name"));
        tokenInfo.setFamilyName((String) claims.get("family_name"));
        tokenInfo.setPicture((String) claims.get("picture"));

        if (tokenInfo.getEmail() == null || tokenInfo.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email not present in Google user info");
        }

        return tokenInfo;
    }
}
