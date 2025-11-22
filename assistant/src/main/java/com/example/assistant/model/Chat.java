package com.example.assistant.model;

import static com.example.assistant.AssistantConstants.MAX_LAST_MESSAGE_CHARACTERS;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("chats")
public record Chat(
        @Column("chat_id")
        @Id UUID chatId,
        @Column("user_id") UUID userId,
        String title,
        @Column("last_message") String lastMessage,
        @Column("created_at") Instant createdAt
) {
    public Chat withId(UUID generate) {
        return new Chat(generate, this.userId, this.title, this.lastMessage, this.createdAt);
    }

    public Chat withLastMessage(String newMessage) {
        return new Chat(this.chatId, this.userId, this.title, trim(newMessage), this.createdAt);
    }

    public Chat withTitle(String newTitle) {
        return new Chat(this.chatId, this.userId, newTitle, this.lastMessage, this.createdAt);
    }

    public static Chat newChat(
            UUID userId,
            String lastMessage
    ) {
        return new Chat(null, userId, null, trim(lastMessage), Instant.now());
    }

    private static String trim(String text) {
        if (text == null || text.length() <= MAX_LAST_MESSAGE_CHARACTERS) {
            return text;
        }

        return text.substring(0, Math.max(0, MAX_LAST_MESSAGE_CHARACTERS - 3)).trim() + "...";
    }
}
