package dev.vlaship.ai.proposal.mcp.server.service;

import dev.vlaship.ai.proposal.mcp.server.dto.AccountResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.ClientRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.ClientResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.CreateProposalRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.FaIdRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.ModelResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.ProposalResponse;
import dev.vlaship.ai.proposal.mcp.server.dto.RiskRequest;
import dev.vlaship.ai.proposal.mcp.server.dto.RiskResponse;
import dev.vlaship.ai.proposal.mcp.server.mapper.ProposalMapper;
import dev.vlaship.ai.proposal.mcp.server.model.Account;
import dev.vlaship.ai.proposal.mcp.server.model.Amount;
import dev.vlaship.ai.proposal.mcp.server.model.Client;
import dev.vlaship.ai.proposal.mcp.server.model.Model;
import dev.vlaship.ai.proposal.mcp.server.model.Proposal;
import dev.vlaship.ai.proposal.mcp.server.model.Risk;
import dev.vlaship.ai.proposal.mcp.server.model.Security;
import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@NullMarked
@RequiredArgsConstructor
public class ProposalService {

    private final ProposalMapper mapper;

    public List<ClientResponse> getClientsByFaId(FaIdRequest req) {
        log.debug("getClientsByFaId faId={}", req.faId());
        String faId = req.faId();
        List<Client> models = List.of(
                new Client("C-" + faId + "-1", "Client One"),
                new Client("C-" + faId + "-2", "Client Two")
        );
        log.info("getClientsByFaId results={} for faId={}", models.size(), faId);
        return models.stream().map(mapper::toResponse).toList();
    }

    public List<AccountResponse> getAccountsByClient(ClientRequest clientReq) {
        log.debug("getAccountsByClient clientReq={}", clientReq);
        Client client = mapper.toModel(clientReq);
        List<Account> models = List.of(
                new Account(client.id() + "-A1", "OPEN"),
                new Account(client.id() + "-A2", "CLOSED")
        );
        log.info("getAccountsByClient results={} for clientId={}", models.size(), client.id());
        return models.stream().map(mapper::toResponse).toList();
    }

    public List<RiskResponse> getRisksByClient(ClientRequest clientReq) {
        log.debug("getRisksByClient clientReq={}", clientReq);
        List<Risk> models = List.of(
                new Risk("R1", "Conservative"),
                new Risk("R2", "Moderate"),
                new Risk("R3", "Aggressive")
        );
        log.info("getRisksByClient results={} for clientId={}", models.size(), clientReq.id());
        return models.stream().map(mapper::toResponse).toList();
    }

    public List<ModelResponse> getModelsByRisk(RiskRequest riskReq) {
        log.debug("getModelsByRisk riskReq={}", riskReq);
        Risk risk = mapper.toModel(riskReq);
        List<Security> base = List.of(
                new Security("S1", "AAPL", "037833100", "US0378331005"),
                new Security("S2", "MSFT", "594918104", "US5949181045")
        );
        List<Model> models = List.of(
                new Model(risk.id() + "-M1", base),
                new Model(risk.id() + "-M2", List.of(
                        new Security("S3", "GOOGL", "02079K305", "US02079K3059")
                ))
        );
        log.info("getModelsByRisk results={} for riskId={}", models.size(), risk.id());
        return models.stream().map(mapper::toResponse).toList();
    }

    public ProposalResponse createProposal(CreateProposalRequest req) {
        log.debug("createProposal req={}", req);
        Client client = mapper.toModel(req.client());
        Risk risk = mapper.toModel(req.risk());
        Amount amount = mapper.toModel(req.amount());
        List<Account> accounts = req.accounts().stream().map(mapper::toModel).toList();
        List<Security> securities = req.securities().stream().map(mapper::toModel).toList();
        String id = "P-" + UUID.randomUUID();
        Proposal proposal = new Proposal(id, "CREATED", client, accounts, risk, securities, amount);
        log.info("createProposal created id={}", id);
        return mapper.toResponse(proposal);
    }
}
