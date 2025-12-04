package dev.vlaship.ai.proposal.mcp.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;

@NullMarked
public record FaIdRequest(
        @NotBlank @Size(min = 4, max = 4) String faId
) {
}
