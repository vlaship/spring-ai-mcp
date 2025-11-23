package com.example.assistant.web;

import static com.example.assistant.AssistantConstants.USER_HEADER;

import com.example.assistant.dto.AnswerResponse;
import com.example.assistant.dto.AnswerStreamEvent;
import com.example.assistant.model.Dog;
import com.example.assistant.repository.DogRepository;
import com.example.assistant.service.ChatAssistantService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import reactor.core.publisher.Flux;

@Validated
@NullMarked
@RestController
@RequiredArgsConstructor
public class AssistantController {

    private final DogRepository dogRepository;
    private final ChatAssistantService chatAssistantService;

    @GetMapping("/dogs")
    public List<Dog> dogs() {
        return this.dogRepository.findAll();
    }

    @GetMapping("/ask")
    ResponseEntity<AnswerResponse> ask(
            @RequestHeader(USER_HEADER) @NotNull UUID userId,
            @RequestParam("question") @NotBlank String question,
            @RequestParam(value = "chatId", required = false) UUID chatId
    ) {
        var result = chatAssistantService.ask(userId, question, chatId);
        return ResponseEntity.ok(new AnswerResponse(result.chatId(), result.answer()));
    }

    @GetMapping(value = "/ask/stream", produces = MediaType.APPLICATION_NDJSON_VALUE)
    Flux<AnswerStreamEvent> askStream(
            @RequestHeader(USER_HEADER) @NotNull UUID userId,
            @RequestParam("question") @NotBlank String question,
            @RequestParam(value = "chatId", required = false) UUID chatId
    ) {
        return chatAssistantService.askStream(userId, question, chatId);
    }
}
