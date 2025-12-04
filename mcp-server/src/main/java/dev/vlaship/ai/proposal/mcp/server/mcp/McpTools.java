package dev.vlaship.ai.proposal.mcp.server.mcp;

import dev.vlaship.ai.proposal.mcp.server.dto.AccountResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.ClientRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.ClientResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.CreateProposalRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.FaIdRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.ModelResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.ProposalResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.RiskRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.RiskResponse;
import dev.vlaship.ai.proposal.mcp.server.service.ProposalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@NullMarked
@RequiredArgsConstructor
public class McpTools {

    private final ProposalService service;

    @McpTool(description = "Get clients by 4-symbol FA ID. Returns a list of clients associated with the financial advisor.")
    public List<ClientResponse> getClientsByFaId(
            @McpToolParam(description = "FA ID (exactly 4 symbols)") String faId
    ) {
        log.debug("MCP Tool called: getClientsByFaId with faId={}", faId);
        if (faId.length() != 4) {
            throw new IllegalArgumentException("FA ID must be exactly 4 characters long");
        }
        return service.getClientsByFaId(new FaIdRequest(faId));
    }

    @McpTool(description = "List all accounts for a specific client. Returns account details including balances and types.")
    public List<AccountResponse> getAccountsByClient(
            @McpToolParam(description = "Client object with id and name") ClientRequest client
    ) {
        log.debug("MCP Tool called: getAccountsByClient with client={}", client);
        return service.getAccountsByClient(client);
    }

    @McpTool(description = "List available risk profiles for a client. Returns risk options suitable for the client.")
    public List<RiskResponse> getRisksByClient(
            @McpToolParam(description = "Client object with id and name") ClientRequest client
    ) {
        log.debug("MCP Tool called: getRisksByClient with client={}", client);
        return service.getRisksByClient(client);
    }

    @McpTool(description = "List investment models for a given risk profile. Returns models matching the risk tolerance.")
    public List<ModelResponse> getModelsByRisk(
            @McpToolParam(description = "Risk object with id and name") RiskRequest risk
    ) {
        log.debug("MCP Tool called: getModelsByRisk with risk={}", risk);
        return service.getModelsByRisk(risk);
    }

    @McpTool(description = "Create a new investment proposal for a client. Combines client accounts, risk profile, securities, and investment amount into a complete proposal.")
    public ProposalResponse createProposal(
            @McpToolParam(description = "Complete proposal request with client, accounts, risk, securities and amount") CreateProposalRequest request
    ) {
        log.debug("MCP Tool called: createProposal with request={}", request);
        return service.createProposal(request);
    }
}
