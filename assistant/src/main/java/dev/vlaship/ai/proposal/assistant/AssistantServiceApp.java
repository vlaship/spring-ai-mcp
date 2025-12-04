package dev.vlaship.ai.proposal.assistant;

import org.jspecify.annotations.NullMarked;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@NullMarked
public class AssistantServiceApp {

    public static void main(String[] args) {
        SpringApplication.run(AssistantServiceApp.class, args);
    }

}
