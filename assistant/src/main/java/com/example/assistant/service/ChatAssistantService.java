package com.example.assistant.service;

import com.example.assistant.AssistantConstants;
import com.example.assistant.dto.AnswerResponse;
import com.example.assistant.dto.AnswerStreamEvent;
import com.example.assistant.model.Chat;
import com.example.assistant.repository.ChatRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@NullMarked
@RequiredArgsConstructor
public class ChatAssistantService {

    private final ChatClient dogAssistantChatClient;
    private final ChatClient summarizeClient;
    private final ChatRepository chatRepository;
    private final ChatDirectoryService chatDirectoryService;

    @Transactional
    public AnswerResponse ask(UUID userId, String question, @Nullable UUID chatId) {
        log.debug("Processing ask request for userId={} chatId={}", userId, chatId);

        String sanitizedQuestion = Objects.requireNonNull(StringUtils.trimToEmpty(question));
        var resolvedChat = resolveChat(chatId, userId);

        var answer = dogAssistantChatClient
                .prompt()
                .user(sanitizedQuestion)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, Objects.requireNonNull(resolvedChat.chatId()).toString()))
                .call()
                .content();

        return finalizeAnswer(resolvedChat, sanitizedQuestion, answer);
    }

    public Flux<AnswerStreamEvent> askStream(UUID userId, String question, @Nullable UUID chatId) {
        log.debug("Processing streaming ask request for userId={} chatId={}", userId, chatId);

        String sanitizedQuestion = Objects.requireNonNull(StringUtils.trimToEmpty(question));
        var resolvedChat = resolveChat(chatId, userId);
        var builder = new StringBuilder();

        var stream = dogAssistantChatClient
                .prompt()
                .user(sanitizedQuestion)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, Objects.requireNonNull(resolvedChat.chatId()).toString()))
                .stream()
                .content();

        var deltas = stream
                .filter(StringUtils::isNotEmpty)
                .map(chunk -> {
                    builder.append(chunk);
                    return AnswerStreamEvent.delta(resolvedChat.chatId(), chunk);
                });

        var completion = Mono.fromCallable(() -> {
            var finalAnswer = builder.toString();
            finalizeAnswer(resolvedChat, sanitizedQuestion, finalAnswer);
            return AnswerStreamEvent.completed(resolvedChat.chatId(), finalAnswer);
        });

        return Flux
                .concat(
                        Mono.just(AnswerStreamEvent.delta(resolvedChat.chatId(), "")),
                        deltas,
                        completion
                )
                .onErrorResume(ex -> {
                    log.error("Streaming ask request failed for userId={} chatId={}", userId, resolvedChat.chatId(), ex);
                    var message = StringUtils.defaultIfBlank(ex.getMessage(), "Unexpected error while contacting the assistant");
                    return Mono.just(AnswerStreamEvent.error(resolvedChat.chatId(), message));
                });
    }

    private Chat resolveChat(@Nullable UUID chatId, UUID userId) {
        if (chatId == null) {
            var chat = Chat.newChat(userId);
            log.debug("New chat created for userId={} chatId={}", userId, chat.chatId());
            return chatRepository.save(chat);
        }

        log.debug("Resolving existing userId={} chatId={}", userId, chatId);
        return chatDirectoryService.findChat(userId, chatId);
    }

    private AnswerResponse finalizeAnswer(Chat resolvedChat, String sanitizedQuestion, @Nullable String answer) {
        if (StringUtils.isBlank(answer)) {
            return new AnswerResponse(resolvedChat.chatId(), null);
        }

        var chatToSave = resolvedChat;
        if (StringUtils.isBlank(resolvedChat.title())) {
            log.debug("Generating title for userId={} chatId={}", resolvedChat.userId(), resolvedChat.chatId());
            var generatedTitle = summarizeTitle(sanitizedQuestion, answer);
            if (generatedTitle != null) {
                chatToSave = chatToSave.withTitle(generatedTitle);
            }
        }

        if (!chatToSave.equals(resolvedChat)) {
            chatRepository.save(chatToSave);
        }

        return new AnswerResponse(resolvedChat.chatId(), answer);
    }

    @Nullable
    private String summarizeTitle(String userMessage, String assistantMessage) {
        var prompt = AssistantConstants.SUMMARY_PROMPT.formatted(
                StringUtils.trimToEmpty(userMessage),
                StringUtils.trimToEmpty(assistantMessage)
        );

        try {
            var candidate = summarizeClient
                    .prompt(prompt)
                    .call()
                    .content();

            if (StringUtils.isBlank(candidate)) {
                return null;
            }

            return StringUtils.abbreviate(
                    candidate.trim(),
                    AssistantConstants.MAX_TITLE_CHARACTERS
            );
        } catch (RuntimeException ex) {
            log.warn("Failed to generate chat title via model. {}", ex.getMessage());
            return null;
        }
    }
}
