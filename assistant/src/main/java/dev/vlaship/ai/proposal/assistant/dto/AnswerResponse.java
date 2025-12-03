package dev.vlaship.ai.proposal.assistant.dto;

import java.util.UUID;

public record AnswerResponse(UUID chatId, String answer) {
}
