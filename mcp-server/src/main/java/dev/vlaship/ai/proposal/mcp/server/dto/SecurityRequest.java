package dev.vlaship.ai.proposal.mcp.server.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.NullMarked;

@NullMarked
public record SecurityRequest(
        @NotBlank String id,
        @NotBlank String ticker,
        @NotBlank String cusip,
        @NotBlank String isin
) {
}
