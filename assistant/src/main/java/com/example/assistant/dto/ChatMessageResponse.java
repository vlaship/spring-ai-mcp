package com.example.assistant.dto;

import com.example.assistant.model.Message;

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
