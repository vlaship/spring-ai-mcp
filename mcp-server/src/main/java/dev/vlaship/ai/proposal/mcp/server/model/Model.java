package dev.vlaship.ai.proposal.mcp.server.model;

import org.jspecify.annotations.NullMarked;

import java.util.List;

@NullMarked
public record Model(String id, List<Security> securities) {}
