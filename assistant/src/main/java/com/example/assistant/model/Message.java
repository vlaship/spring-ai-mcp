package com.example.assistant.model;

import java.time.Instant;

public record Message(
        String role,
        String content,
        Instant timestamp
) {
}
