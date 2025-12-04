package dev.vlaship.ai.proposal.mcp.server.model;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record Security(String id, String ticker, String cusip, String isin) {}
