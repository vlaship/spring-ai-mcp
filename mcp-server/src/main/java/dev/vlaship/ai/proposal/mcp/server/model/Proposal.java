package dev.vlaship.ai.proposal.mcp.server.model;

import org.jspecify.annotations.NullMarked;

import java.util.List;

@NullMarked
public record Proposal(
        String id,
        String status,
        Client client,
        List<Account> accounts,
        Risk risk,
        List<Security> securities,
        Amount amount
) {}
