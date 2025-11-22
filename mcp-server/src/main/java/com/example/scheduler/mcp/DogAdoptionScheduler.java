package com.example.scheduler.mcp;

import lombok.extern.slf4j.Slf4j;
import org.springaicommunity.mcp.annotation.McpArg;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
public class DogAdoptionScheduler {

    @McpTool(description = """
            schedule an appointment to pick up
            or adopt a dog from a Pooch Palace location
            """
    )
    public String schedule(
            @McpArg(description = "the id (UUID) of the dog") UUID dogId,
            @McpArg(description = "the name of the dog") String dogName
    ) {

        var i = Instant
                .now()
                .plus(3, ChronoUnit.DAYS)
                .toString();

        log.debug("scheduling {}/{} for {}", dogName, dogId, i);

        return i;
    }
}
