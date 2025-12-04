package dev.vlaship.ai.proposal.mcp.server.web;

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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import lombok.RequiredArgsConstructor;

import java.util.List;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService service;

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResponse>> getClientsByFaId(@Valid @RequestParam("faId") String faId) {
        return ResponseEntity.ok(service.getClientsByFaId(new FaIdRequest(faId)));
    }

    @PostMapping("/accounts")
    public ResponseEntity<List<AccountResponse>> getAccountsByClient(@Valid @RequestBody ClientRequest client) {
        return ResponseEntity.ok(service.getAccountsByClient(client));
    }

    @PostMapping("/risks")
    public ResponseEntity<List<RiskResponse>> getRisksByClient(@Valid @RequestBody ClientRequest client) {
        return ResponseEntity.ok(service.getRisksByClient(client));
    }

    @PostMapping("/models")
    public ResponseEntity<List<ModelResponse>> getModelsByRisk(@Valid @RequestBody RiskRequest risk) {
        return ResponseEntity.ok(service.getModelsByRisk(risk));
    }

    @PostMapping("/proposals")
    public ResponseEntity<ProposalResponse> createProposal(@Valid @RequestBody CreateProposalRequest request) {
        return ResponseEntity.ok(service.createProposal(request));
    }
}
