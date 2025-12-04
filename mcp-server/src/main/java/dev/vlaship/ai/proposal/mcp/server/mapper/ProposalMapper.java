package dev.vlaship.ai.proposal.mcp.server.mapper;

import dev.vlaship.ai.proposal.mcp.server.dto.AccountRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.AccountResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.AmountRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.AmountResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.ClientRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.ClientResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.ModelRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.ModelResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.ProposalResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.RiskRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.RiskResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.SecurityRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.SecurityResponse;
import dev.vlaship.ai.proposal.mcp.server.model.Account;
import dev.vlaship.ai.proposal.mcp.server.model.Amount;
import dev.vlaship.ai.proposal.mcp.server.model.Client;
import dev.vlaship.ai.proposal.mcp.server.model.Model;
import dev.vlaship.ai.proposal.mcp.server.model.Proposal;
import dev.vlaship.ai.proposal.mcp.server.model.Risk;
import dev.vlaship.ai.proposal.mcp.server.model.Security;
import org.jspecify.annotations.NullMarked;
import org.mapstruct.InjectionStrategy;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@NullMarked
@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.WARN,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        injectionStrategy = InjectionStrategy.CONSTRUCTOR
)
public interface ProposalMapper {
    Client toModel(ClientRequest dto);
    Account toModel(AccountRequest dto);
    Risk toModel(RiskRequest dto);
    Security toModel(SecurityRequest dto);
    Model toModel(ModelRequest dto);
    Amount toModel(AmountRequest dto);

    ClientResponse toResponse(Client model);
    AccountResponse toResponse(Account model);
    RiskResponse toResponse(Risk model);
    SecurityResponse toResponse(Security model);
    ModelResponse toResponse(Model model);
    AmountResponse toResponse(Amount model);
    ProposalResponse toResponse(Proposal model);
}
