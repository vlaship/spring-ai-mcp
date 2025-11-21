package com.example.assistant.repository;

import com.example.assistant.model.Chat;
import org.springframework.data.repository.ListCrudRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRepository extends ListCrudRepository<Chat, UUID> {

    List<Chat> findByUserId(UUID userId);

    Optional<Chat> findByChatIdAndUserId(UUID chatId, UUID userId);
}
