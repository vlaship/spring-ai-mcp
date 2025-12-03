package dev.vlaship.ai.proposal.mcp.server.dto;

import org.jspecify.annotations.NullMarked;

import java.util.List;

@NullMarked
public record ProposalResponse(
        String id,
        String status,
        ClientResponse client,
        List<AccountResponse> accounts,
        RiskResponse risk,
        List<SecurityResponse> securities,
        AmountResponse amount
) {
}
