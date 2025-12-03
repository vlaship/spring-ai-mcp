package dev.vlaship.ai.proposal.assistant.config;

import dev.vlaship.ai.proposal.assistant.AssistantConstants;
import dev.vlaship.ai.proposal.assistant.model.Chat;
import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.NoArgGenerator;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.PromptChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.relational.core.mapping.event.BeforeConvertCallback;
import org.springframework.scheduling.annotation.EnableAsync;

import javax.sql.DataSource;

@EnableAsync
@Configuration
public class AssistantConfiguration {

    @Bean("proposalAssistantChatClient")
    ChatClient proposalAssistantChatClient(
            SyncMcpToolCallbackProvider syncMcpToolCallbackProvider,
            QuestionAnswerAdvisor questionAnswerAdvisor,
            PromptChatMemoryAdvisor promptChatMemoryAdvisor,
            ChatClient.Builder builder
    ) {
        return builder
                .defaultSystem(AssistantConstants.ASSISTANT_SYSTEM_PROMPT)
                .defaultAdvisors(questionAnswerAdvisor, promptChatMemoryAdvisor)
                .defaultToolCallbacks(syncMcpToolCallbackProvider)
                .build();
    }

    @Bean("summarizeClient")
    ChatClient summarizeClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem(AssistantConstants.SUMMARY_SYSTEM_PROMPT)
                .build();
    }

    @Bean
    PromptChatMemoryAdvisor promptChatMemoryAdvisor(DataSource dataSource) {
        var jdbc = JdbcChatMemoryRepository
                .builder()
                .dataSource(dataSource)
                .build();
        var mwa = MessageWindowChatMemory
                .builder()
                .chatMemoryRepository(jdbc)
                .build();
        return PromptChatMemoryAdvisor
                .builder(mwa)
                .build();
    }

    @Bean
    QuestionAnswerAdvisor questionAnswerAdvisor(VectorStore vectorStore) {
        return QuestionAnswerAdvisor
                .builder(vectorStore)
                .build();
    }

    @Bean
    NoArgGenerator uuidGenerator() {
        return Generators.timeBasedEpochGenerator();
    }

    @Bean
    BeforeConvertCallback<Chat> beforeConvertCallback(NoArgGenerator uuidGenerator) {
        return chat -> {
            if (chat.chatId() == null) {
                return chat.withId(uuidGenerator.generate());
            }
            return chat;
        };
    }
}
