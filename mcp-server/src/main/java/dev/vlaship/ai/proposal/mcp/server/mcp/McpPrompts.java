package dev.vlaship.ai.proposal.mcp.server.mcp;

import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springaicommunity.mcp.annotation.McpPrompt;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@NullMarked
public class McpPrompts {

    @McpPrompt(
        name = "get-client-accounts",
        description = "Get all accounts for a specific client. Use this prompt to retrieve client information and their associated accounts. Arguments: faId (required, 4-character FA ID), clientName (optional, client name to search for)"
    )
    public String getClientAccountsPrompt() {
        log.debug("MCP Prompt called: get-client-accounts");
        
        return """
            Get all clients for Financial Advisor ID: {{faId}}
            Then find the client named "{{clientName}}" and show all their accounts with balances and types.
            
            If no clientName is provided, show the accounts for the first client in the list.
            """;
    }

    @McpPrompt(
        name = "create-investment-proposal",
        description = "Create a complete investment proposal for a client including risk assessment and model selection. Arguments: faId (required, 4-character FA ID), clientName (required, client name), investmentAmount (required, investment amount in USD)"
    )
    public String createInvestmentProposalPrompt() {
        log.debug("MCP Prompt called: create-investment-proposal");
        
        return """
            Create an investment proposal for the following:
            - Financial Advisor ID: {{faId}}
            - Client Name: {{clientName}}
            - Investment Amount: ${{investmentAmount}}
            
            Please follow these steps:
            1. Get the clients for FA ID {{faId}}
            2. Find the client matching the name "{{clientName}}"
            3. Get the client's accounts
            4. Get risk profiles for the client
            5. Select an appropriate risk profile
            6. Get investment models for the selected risk profile
            7. Create a proposal with appropriate securities from the model
            
            Provide a summary of the proposal created including:
            - Client information
            - Selected accounts
            - Risk profile chosen
            - Investment allocation
            - Total investment amount
            """;
    }

    @McpPrompt(
        name = "analyze-client-risk",
        description = "Analyze available risk profiles and investment models for a client. Arguments: faId (required, 4-character FA ID), clientName (required, client name)"
    )
    public String analyzeClientRiskPrompt() {
        log.debug("MCP Prompt called: analyze-client-risk");
        
        return """
            Analyze risk profiles and investment options for:
            - Financial Advisor ID: {{faId}}
            - Client Name: {{clientName}}
            
            Steps:
            1. Get all clients for FA ID {{faId}}
            2. Find the client named "{{clientName}}"
            3. Get all available risk profiles for this client
            4. For each risk profile, get the available investment models
            5. Provide a summary comparing the different risk profiles and their associated investment models
            
            Include in your analysis:
            - Risk profile names and characteristics
            - Investment models available for each risk level
            - Recommendations based on the client's situation
            """;
    }

    @McpPrompt(
        name = "list-all-clients",
        description = "List all clients for a Financial Advisor with their basic information. Arguments: faId (required, 4-character FA ID)"
    )
    public String listAllClientsPrompt() {
        log.debug("MCP Prompt called: list-all-clients");
        
        return """
            Get all clients for Financial Advisor ID: {{faId}}
            
            For each client, provide:
            - Client ID
            - Client Name
            - Number of accounts (if available)
            
            Format the output as a clear, organized list.
            """;
    }
}

