
package com.realtime.chat.chat_app_backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDirectory;

    public FileStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir) {

        this.uploadDirectory = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Could not create upload directory", e);
        }
    }

    public StoredFile store(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select a file");
        }

        if (file.getSize() > 10L * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Maximum file size is 10 MB");
        }

        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() == null
                        ? "attachment"
                        : file.getOriginalFilename());

        if (originalName.isBlank()
                || originalName.contains("..")
                || originalName.contains("/")
                || originalName.contains("\\")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid filename");
        }

        String extension = "";
        int dot = originalName.lastIndexOf('.');

        if (dot >= 0) {
            extension = originalName.substring(dot)
                    .toLowerCase(Locale.ROOT);
        }

        // Basic extension allowlist.
        if (!extension.matches(
                "\\.(png|jpg|jpeg|gif|webp|pdf|txt|csv|zip|doc|docx|xls|xlsx)")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File type is not supported");
        }

        String contentType = file.getContentType();

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        String fileId = UUID.randomUUID().toString();
        Path destination = uploadDirectory.resolve(fileId).normalize();

        if (!destination.startsWith(uploadDirectory)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        try {
            Files.copy(file.getInputStream(), destination);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not save file");
        }

        return new StoredFile(
                fileId,
                originalName,
                contentType,
                file.getSize()
        );
    }

    public Path getPath(String fileId) {

        try {
            UUID.fromString(fileId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid file ID");
        }

        Path path = uploadDirectory.resolve(fileId).normalize();

        if (!path.startsWith(uploadDirectory)
                || !Files.isRegularFile(path)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "File not found");
        }

        return path;
    }

    public record StoredFile(
            String id,
            String originalName,
            String contentType,
            long size
    ) {}
}
