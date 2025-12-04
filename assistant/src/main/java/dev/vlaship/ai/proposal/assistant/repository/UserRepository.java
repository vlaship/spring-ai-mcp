package dev.vlaship.ai.proposal.assistant.repository;

import dev.vlaship.ai.proposal.assistant.model.User;
import org.springframework.data.repository.ListCrudRepository;

import java.util.UUID;

public interface UserRepository extends ListCrudRepository<User, UUID> {
}
