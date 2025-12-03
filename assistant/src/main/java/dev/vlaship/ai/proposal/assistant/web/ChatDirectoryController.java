package dev.vlaship.ai.proposal.assistant.web;

import static dev.vlaship.ai.proposal.assistant.AssistantConstants.USER_HEADER;

import dev.vlaship.ai.proposal.assistant.dto.ChatMessageResponse;
import dev.vlaship.ai.proposal.assistant.dto.ChatSummaryResponse;
import dev.vlaship.ai.proposal.assistant.model.User;
import dev.vlaship.ai.proposal.assistant.service.ChatDirectoryService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NullMarked;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@NullMarked
@RestController
@RequiredArgsConstructor
public class ChatDirectoryController {

    private final ChatDirectoryService chatDirectoryService;

    @GetMapping("/users")
    public List<User> users() {
        return chatDirectoryService.findAllUsers();
    }

    @GetMapping("/chats")
    public List<ChatSummaryResponse> chatsByUser(@RequestHeader(name = USER_HEADER) @NotNull UUID userId) {
        return chatDirectoryService.findChatsByUser(userId);
    }

    @GetMapping("/chats/{chatId}")
    public List<ChatMessageResponse> chatHistory(
            @RequestHeader(name = USER_HEADER) @NotNull UUID userId,
            @PathVariable("chatId") UUID chatId
    ) {
        return chatDirectoryService.findChatHistory(userId, chatId);
    }
}
