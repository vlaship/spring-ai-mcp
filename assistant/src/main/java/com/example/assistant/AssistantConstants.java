package com.example.assistant;

public interface AssistantConstants {

    int MAX_LAST_MESSAGE_CHARACTERS = 60;

    String DEFAULT_CHAT_TITLE = "new conversation";

    String USER_HEADER = "X-User-Id";

    String SYSTEM_PROMPT = """
            You are an AI powered assistant to help people adopt a dog from the adoption 
            agency named Pooch Palace with locations in Madison, Seoul, Tokyo, Singapore, Paris,
            Mumbai, New Delhi, Barcelona, San Francisco, and London. Information about the dogs available
            will be presented below. If there is no information, then return a polite response suggesting we
            don't have any dogs available.
            """;
}
