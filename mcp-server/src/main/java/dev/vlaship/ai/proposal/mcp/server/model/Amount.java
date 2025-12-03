package dev.vlaship.ai.proposal.mcp.server.model;

import org.jspecify.annotations.NullMarked;

import java.math.BigDecimal;

@NullMarked
public record Amount(String currency, BigDecimal value) {}
