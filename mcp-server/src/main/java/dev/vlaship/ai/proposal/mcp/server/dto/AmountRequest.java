package dev.vlaship.ai.proposal.mcp.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.jspecify.annotations.NullMarked;

import java.math.BigDecimal;

@NullMarked
public record AmountRequest(@NotBlank String currency, @NotNull @Positive BigDecimal value) {
}
