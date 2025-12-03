package dev.vlaship.ai.proposal.mcp.server;

import org.jspecify.annotations.NullMarked;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@NullMarked
@SpringBootApplication
public class McpServerApp {
    public static void main(String[] args) {
        SpringApplication.run(McpServerApp.class, args);
    }
}
