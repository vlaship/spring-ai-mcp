package dev.vlaship.ai.proposal.assistant.service;

import dev.vlaship.ai.proposal.assistant.dto.EmbeddingDocumentRequest;
import com.fasterxml.uuid.NoArgGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.jspecify.annotations.NullMarked;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@NullMarked
@RequiredArgsConstructor
public class EmbeddingService {

    private final VectorStore vectorStore;
    private final NoArgGenerator uuidGenerator;

    @Async
    public void embed(List<EmbeddingDocumentRequest> requests) {
        var documents = requests.stream()
                .map(this::toDocument)
                .toList();
        log.debug("Storing {} embedding documents", documents.size());

        vectorStore.add(documents);
    }

    private Document toDocument(EmbeddingDocumentRequest request) {
        return new Document(
                uuidGenerator.generate().toString(),
                request.content().toString(),
                MapUtils.emptyIfNull(request.metadata())
        );
    }
}
