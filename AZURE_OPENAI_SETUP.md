# Azure OpenAI Configuration Guide

This guide explains how to configure the Finance Proposal Assistant to use Azure OpenAI instead of OpenAI or Ollama.

## Prerequisites

1. An Azure subscription with Azure OpenAI service enabled
2. A deployed Azure OpenAI resource
3. Chat and embedding model deployments created in your Azure OpenAI resource

## Configuration Steps

### 1. Enable Azure OpenAI Dependency

Uncomment the Azure OpenAI dependency in `assistant/pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-azure-openai</artifactId>
</dependency>
```

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small
```

**Where to find these values:**

- **API Key**: Azure Portal → Your Azure OpenAI Resource → Keys and Endpoint → KEY 1 or KEY 2
- **Endpoint**: Azure Portal → Your Azure OpenAI Resource → Keys and Endpoint → Endpoint
- **Deployment Names**: Azure Portal → Your Azure OpenAI Resource → Model deployments → Deployment name

### 3. Run with Azure Profile

Start the assistant service with the `azure` profile:

```bash
cd assistant
mvn spring-boot:run -Dspring-boot.run.profiles=azure
```

Or if running from an IDE, set the active profile to `azure`.

## Configuration Details

The Azure OpenAI configuration is defined in `assistant/src/main/resources/application-azure.yml`:

```yaml
spring:
  ai:
    azure:
      openai:
        api-key: ${AZURE_OPENAI_API_KEY}
        endpoint: ${AZURE_OPENAI_ENDPOINT}
        chat:
          options:
            deployment-name: ${AZURE_OPENAI_CHAT_DEPLOYMENT_NAME:gpt-4o}
            temperature: 0.7

        embedding:
          options:
            deployment-name: ${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME:text-embedding-3-small}

    vectorstore:
      pgvector:
        dimensions: 1536
        table-name: vector_store_large
```

### Key Configuration Options

- **deployment-name**: The name of your deployed model in Azure OpenAI (not the model name itself)
- **temperature**: Controls randomness in responses (0.0 = deterministic, 1.0 = creative)
- **dimensions**: Must match your embedding model's output dimensions (1536 for text-embedding-3-small)

## Recommended Azure OpenAI Models

### Chat Models
- **gpt-4o**: Latest GPT-4 Omni model, best for complex reasoning
- **gpt-4**: Standard GPT-4, excellent for most use cases
- **gpt-35-turbo**: Cost-effective option for simpler tasks

### Embedding Models
- **text-embedding-3-small**: 1536 dimensions, good balance of performance and cost
- **text-embedding-3-large**: 3072 dimensions, higher quality embeddings
- **text-embedding-ada-002**: 1536 dimensions, legacy model

**Note**: If you change the embedding model, update the `dimensions` property in `application-azure.yml` to match.

## Troubleshooting

### Authentication Errors

If you see authentication errors:
1. Verify your API key is correct
2. Check that your Azure OpenAI resource is active
3. Ensure your subscription has not exceeded quota limits

### Deployment Not Found

If you see "deployment not found" errors:
1. Verify the deployment name matches exactly (case-sensitive)
2. Check that the deployment is in the same region as your endpoint
3. Ensure the deployment is in a "Succeeded" state in Azure Portal

### Rate Limiting

Azure OpenAI has rate limits based on your subscription tier:
- Monitor usage in Azure Portal → Your Resource → Metrics
- Consider implementing retry logic for production use
- Upgrade your tier if you consistently hit limits

## Switching Between Providers

You can easily switch between LLM providers by changing the active profile:

```bash
# Use Azure OpenAI
mvn spring-boot:run -Dspring-boot.run.profiles=azure

# Use OpenAI
mvn spring-boot:run -Dspring-boot.run.profiles=openai

# Use local Ollama
mvn spring-boot:run -Dspring-boot.run.profiles=ollama
```

Each profile uses its own vector store table, so you can maintain separate embeddings for different providers.

## Cost Considerations

Azure OpenAI pricing is based on:
- **Tokens processed** (input + output)
- **Model type** (GPT-4 is more expensive than GPT-3.5)
- **Region** (prices vary by Azure region)

Monitor costs in Azure Portal → Cost Management + Billing

## Additional Resources

- [Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Spring AI Azure OpenAI Documentation](https://docs.spring.io/spring-ai/reference/api/clients/azure-openai-chat.html)
- [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
