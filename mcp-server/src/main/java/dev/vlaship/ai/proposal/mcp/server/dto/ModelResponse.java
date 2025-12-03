package dev.vlaship.ai.proposal.mcp.server.dto;

import org.jspecify.annotations.NullMarked;

import java.util.List;

@NullMarked
public record ModelResponse(String id, List<SecurityResponse> securities) {
}
