package dev.vlaship.ai.proposal.assistant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnswerStreamEvent(
        UUID chatId,
        @Nullable String delta,
        @Nullable String answer,
        boolean done,
        @Nullable String error
) {

    public static AnswerStreamEvent delta(UUID chatId, String chunk) {
        return new AnswerStreamEvent(chatId, chunk, null, false, null);
    }

    public static AnswerStreamEvent completed(UUID chatId, @Nullable String answer) {
        return new AnswerStreamEvent(chatId, null, answer, true, null);
    }

    public static AnswerStreamEvent error(UUID chatId, String message) {
        return new AnswerStreamEvent(chatId, null, null, true, message);
    }
}
