package dev.vlaship.ai.proposal.mcp.server.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;

import java.util.List;

@NullMarked
public record CreateProposalRequest(
        @NotNull @Valid ClientRequest client,
        @Size(min = 1) List<@Valid AccountRequest> accounts,
        @NotNull @Valid RiskRequest risk,
        @Size(min = 1) List<@Valid SecurityRequest> securities,
        @NotNull @Valid AmountRequest amount
) {
}
