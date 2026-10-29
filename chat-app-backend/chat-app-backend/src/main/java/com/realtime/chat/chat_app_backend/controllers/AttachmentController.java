
package com.realtime.chat.chat_app_backend.controllers;

import com.realtime.chat.chat_app_backend.services.FileStorageService;
import com.realtime.chat.chat_app_backend.services.FileStorageService.StoredFile;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class AttachmentController {

    private final FileStorageService fileStorageService;

    public AttachmentController(
            FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file) {

        StoredFile stored = fileStorageService.store(file);

        return ResponseEntity.ok(Map.of(
                "id", stored.id(),
                "fileName", stored.originalName(),
                "contentType", stored.contentType(),
                "fileSize", stored.size(),
                "fileUrl", "/api/v1/files/" + stored.id()
        ));
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String fileId) throws IOException {

        Path path = fileStorageService.getPath(fileId);
        Resource resource = new UrlResource(path.toUri());

        String contentType = Files.probeContentType(path);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

        if (contentType != null) {
            try {
                mediaType = MediaType.parseMediaType(contentType);
            } catch (Exception ignored) {
                // Keep the default content type.
            }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"download\"")
                .body(resource);
    }
}
