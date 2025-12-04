package dev.vlaship.ai.proposal.assistant.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

@Table("users")
public record User(
        @Id @Column("user_id") UUID userId,
        String name
) {
}
