package com.example.assistant.repository;

import com.example.assistant.model.Dog;
import org.springframework.data.repository.ListCrudRepository;

import java.util.UUID;

public interface DogRepository extends ListCrudRepository<Dog, UUID> {
}
