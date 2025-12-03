package dev.vlaship.ai.proposal.mcp.server.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record AccountResponse(String id, String status) {
}
