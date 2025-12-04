package dev.vlaship.ai.proposal.mcp.server.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;

import java.util.List;

@NullMarked
public record ModelRequest(
        @NotBlank String id, @Size(min = 1) List<@Valid SecurityRequest> securities
) {
}
