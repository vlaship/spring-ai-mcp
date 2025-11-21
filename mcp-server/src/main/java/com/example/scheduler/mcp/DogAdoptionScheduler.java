package com.example.scheduler.mcp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springaicommunity.mcp.annotation.McpArg;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class DogAdoptionScheduler {

    private static final Logger log = LoggerFactory.getLogger(DogAdoptionScheduler.class);

    @McpTool(description = """
            schedule an appointment to pick up
            or adopt a dog from a Pooch Palace location
            """)
    public String schedule(
            @McpArg(description = "the id (UUID) of the dog") UUID dogId,
            @McpArg(description = "the name of the dog") String dogName
    ) {

        var i = Instant
                .now()
                .plus(3, ChronoUnit.DAYS)
                .toString();
        log.info("scheduling {}/{} for {}", dogName, dogId, i);

        return i;
    }
}
