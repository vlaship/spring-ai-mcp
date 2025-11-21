package com.example.assistant.service;

import com.example.assistant.dto.ChatMessageResponse;
import com.example.assistant.dto.ChatSummaryResponse;
import com.example.assistant.model.Chat;
import com.example.assistant.model.User;
import com.example.assistant.repository.ChatRepository;
import com.example.assistant.repository.ChatMemoryRepository;
import com.example.assistant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@NullMarked
@RequiredArgsConstructor
public class ChatDirectoryService {

    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final ChatMemoryRepository chatMemoryRepository;

    public List<User> findAllUsers() {
        log.debug("Fetching all users");
        return userRepository.findAll();
    }

    public List<ChatSummaryResponse> findChatsByUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw notFound("User", userId);
        }
        log.debug("Fetching chats for user={}", userId);
        return chatRepository
                .findByUserId(userId)
                .stream()
                .map(ChatSummaryResponse::from)
                .toList();
    }

    public List<ChatMessageResponse> findChatHistory(UUID userId, UUID chatId) {
        var chat = findChat(userId, chatId);
        log.debug("Fetching chat history for chatId={} (user={})", chatId, userId);
        return chatMemoryRepository
                .findByConversationId(chat.chatId())
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    private ResponseStatusException notFound(String resource, UUID id) {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "%s %s not found".formatted(resource, id)
        );
    }

    public Chat findChat(UUID userId, UUID chatId) {
        log.debug("Fetching chatId={} for user={}", chatId, userId);
        return chatRepository
                .findByChatIdAndUserId(chatId, userId)
                .orElseThrow(() -> notFound("Chat", chatId));
    }
}
