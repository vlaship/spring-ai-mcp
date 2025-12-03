package dev.vlaship.ai.proposal.assistant.model;

import java.time.Instant;

public record Message(
        String role,
        String content,
        Instant timestamp
) {
}
