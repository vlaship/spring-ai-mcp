package com.example.assistant.dto;

import java.util.UUID;

public record AnswerResponse(UUID chatId, String answer) {
}
