package com.example.assistant.config;

import com.example.assistant.AssistantConstants;
import com.example.assistant.model.Chat;
import com.example.assistant.repository.DogRepository;
import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.NoArgGenerator;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.PromptChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.document.Document;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.relational.core.mapping.event.BeforeConvertCallback;

import javax.sql.DataSource;
import java.util.List;

@Configuration
public class AssistantConfiguration {

    @Bean("dogAssistantChatClient")
    ChatClient dogAssistantChatClient(
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
    @Profile("embedding")
    ApplicationRunner applicationRunner(DogRepository repository, VectorStore vectorStore) {
        return _ -> {
            List<Document> dogs = repository.findAll()
                    .stream()
                    .map(dog -> new Document("id: %s, name: %s, description: %s".formatted(
                            dog.dogId(), dog.name(), dog.description()
                    )))
                    .toList();
            vectorStore.add(dogs);
        };
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
