package com.example.assistant.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import java.util.UUID;

@Table("dogs")
public record Dog(
        @Id @Column("dog_id") UUID dogId,
        String name,
        String owner,
        String description
) {
}
