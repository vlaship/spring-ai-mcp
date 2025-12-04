package dev.vlaship.ai.proposal.mcp.server.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record SecurityResponse(String id, String ticker, String cusip, String isin) {
}
