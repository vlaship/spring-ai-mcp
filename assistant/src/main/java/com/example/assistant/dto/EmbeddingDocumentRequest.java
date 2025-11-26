package com.example.assistant.dto;

import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

import java.util.Map;

public record EmbeddingDocumentRequest(
        @NonNull Object content,
        @Nullable Map<String, Object> metadata
) {
}
