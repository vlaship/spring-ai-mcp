package dev.vlaship.ai.proposal.assistant.repository;

import dev.vlaship.ai.proposal.assistant.model.Message;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NullMarked;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

@Repository
@NullMarked
@RequiredArgsConstructor
public class ChatMemoryRepository {

    private static final RowMapper<Message> CHAT_MESSAGE_ROW_MAPPER = new ChatMessageRowMapper();

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public List<Message> findByConversationId(UUID conversationId) {
        return jdbcTemplate.query(
                """
                        select type, content, timestamp
                        from spring_ai_chat_memory
                        where conversation_id = :conversationId
                        order by timestamp;
                        """,
                new MapSqlParameterSource("conversationId", conversationId.toString()),
                CHAT_MESSAGE_ROW_MAPPER
        );
    }

    private static final class ChatMessageRowMapper implements RowMapper<Message> {

        @Override
        public Message mapRow(ResultSet rs, int rowNum) throws SQLException {
            var type = rs.getString("type");
            var content = rs.getString("content");
            var timestamp = rs.getTimestamp("timestamp");

            if (type == null || content == null || timestamp == null) {
                throw new SQLException("Chat memory rows must have non-null type, content, and timestamp");
            }

            return new Message(type, content, timestamp.toInstant());
        }
    }
}
