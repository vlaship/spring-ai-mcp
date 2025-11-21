package com.example.assistant.dto;

import com.example.assistant.model.Chat;

import java.time.Instant;
import java.util.UUID;

public record ChatSummaryResponse(
        UUID chatId,
        String title,
        String lastMessage,
        Instant createdAt
) {

    public static ChatSummaryResponse from(Chat chat) {
        return new ChatSummaryResponse(
                chat.chatId(),
                chat.title(),
                chat.lastMessage(),
                chat.createdAt()
        );
    }
}
