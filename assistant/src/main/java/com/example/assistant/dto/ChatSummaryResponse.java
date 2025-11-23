package com.example.assistant.dto;

import com.example.assistant.model.Chat;

import java.time.Instant;
import java.util.UUID;

public record ChatSummaryResponse(
        UUID chatId,
        String title,
        Instant createdAt
) {

    public static ChatSummaryResponse from(Chat chat) {
        return new ChatSummaryResponse(
                chat.chatId(),
                chat.title(),
                chat.createdAt()
        );
    }
}
