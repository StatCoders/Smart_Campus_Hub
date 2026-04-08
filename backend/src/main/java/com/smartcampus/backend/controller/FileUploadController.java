package com.smartcampus.backend.controller;

import com.smartcampus.backend.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @Value("${app.upload.dir:/uploads}")
    private String uploadDir;

    /**
     * Upload an image file
     * Returns the filename/path to be stored in database
     */
    @PostMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(errorResponse("No file provided"));
            }

            String filename = fileUploadService.saveFile(file);

            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("path", "/uploads/" + filename);
            response.put("message", "Image uploaded successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(errorResponse(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Failed to save file"));
        }
    }

    /**
     * Delete an image by filename
     */
    @DeleteMapping("/image/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteImage(@PathVariable String filename) {
        boolean deleted = fileUploadService.deleteFile(filename);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Helper method to create error response
     */
    private Map<String, String> errorResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", message);
        return response;
    }
}

@RestController
@RequestMapping("/uploads")
@CrossOrigin(origins = "*")
class FileServeController {

    @Value("${app.upload.dir:/uploads}")
    private String uploadDir;

    /**
     * Serve uploaded files
     */
    @GetMapping("/{filename}")
    public ResponseEntity<?> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();

            // Security check: ensure path is within upload directory
            if (!filePath.normalize().toString().startsWith(Paths.get(uploadDir).normalize().toString())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = "image/*";
                return ResponseEntity.ok()
                        .contentType(MediaType.valueOf(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
