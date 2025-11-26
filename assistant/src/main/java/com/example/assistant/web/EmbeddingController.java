package com.example.assistant.web;

import com.example.assistant.dto.EmbeddingDocumentRequest;
import com.example.assistant.service.EmbeddingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@NullMarked
@RestController
@RequiredArgsConstructor
public class EmbeddingController {

    private final EmbeddingService embeddingService;

    @PostMapping("/embeddings")
    public ResponseEntity<Void> embed(@RequestBody @Valid List<@Valid EmbeddingDocumentRequest> documents) {
        embeddingService.embed(documents);
        return ResponseEntity.accepted().build();
    }
}
