package dev.vlaship.ai.proposal.mcp.server.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.NullMarked;

@NullMarked
public record AccountRequest(
        @NotBlank String id,
        @NotBlank String status
) {
}
