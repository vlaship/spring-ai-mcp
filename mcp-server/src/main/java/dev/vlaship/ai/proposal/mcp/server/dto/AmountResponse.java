package dev.vlaship.ai.proposal.mcp.server.dto;

import org.jspecify.annotations.NullMarked;

import java.math.BigDecimal;

@NullMarked
public record AmountResponse(String currency, BigDecimal value) {
}
