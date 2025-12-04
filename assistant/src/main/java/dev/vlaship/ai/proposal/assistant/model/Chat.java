package dev.vlaship.ai.proposal.assistant.model;

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
        @Column("created_at") Instant createdAt
) {
    public Chat withId(UUID generate) {
        return new Chat(generate, this.userId, this.title, this.createdAt);
    }

    public Chat withTitle(String newTitle) {
        return new Chat(this.chatId, this.userId, newTitle, this.createdAt);
    }

    public static Chat newChat(UUID userId) {
        return new Chat(null, userId, null, Instant.now());
    }
}
