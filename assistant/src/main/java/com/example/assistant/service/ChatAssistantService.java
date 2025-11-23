package com.example.assistant.service;

import com.example.assistant.AssistantConstants;
import com.example.assistant.dto.AnswerResponse;
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

import java.util.UUID;

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

        var sanitizedQuestion = StringUtils.trimToEmpty(question);
        var resolvedChat = resolveChat(chatId, userId);

        var answer = dogAssistantChatClient
                .prompt()
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, resolvedChat.chatId().toString()))
                .call()
                .content();

        if (answer == null || answer.isBlank()) {
            return new AnswerResponse(resolvedChat.chatId(), null);
        }

        var chatToSave = resolvedChat;
        if (resolvedChat.title() == null) {
            log.debug("Generating title for userId={} chatId={}", userId, resolvedChat.chatId());
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

    private Chat resolveChat(@Nullable UUID chatId, UUID userId) {
        if (chatId == null) {
            var chat = Chat.newChat(userId);
            log.debug("New chat created for userId={} chatId={}", userId, chat.chatId());
            return chatRepository.save(chat);
        }

        log.debug("Resolving existing userId={} chatId={}", userId, chatId);
        return chatDirectoryService.findChat(userId, chatId);
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
