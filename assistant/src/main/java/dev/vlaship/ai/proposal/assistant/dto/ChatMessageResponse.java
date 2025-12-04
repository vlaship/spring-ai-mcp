package dev.vlaship.ai.proposal.assistant.dto;

import dev.vlaship.ai.proposal.assistant.model.Message;

import java.time.Instant;

public record ChatMessageResponse(
        String role,
        String content,
        Instant timestamp
) {

    public static ChatMessageResponse from(Message message) {
        return new ChatMessageResponse(message.role(), message.content(), message.timestamp());
    }
}
