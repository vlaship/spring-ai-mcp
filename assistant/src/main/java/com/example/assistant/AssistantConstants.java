package com.example.assistant;

public interface AssistantConstants {

    int MAX_TITLE_CHARACTERS = 60;

    String USER_HEADER = "X-User-Id";

    String ASSISTANT_SYSTEM_PROMPT = """
            You are an AI powered assistant to help people adopt a dog from the adoption
            agency named Pooch Palace with locations in Madison, Seoul, Tokyo, Singapore, Paris,
            Mumbai, New Delhi, Barcelona, San Francisco, and London. Information about the dogs available
            will be presented below. If there is no information, then return a polite response suggesting we
            don't have any dogs available.
            """;

    String SUMMARY_SYSTEM_PROMPT = """
            Produce exactly one output: a single title in Title Case, up to 5 words, no punctuation, no additional sentences.
            Do not add explanations, descriptions, or commentary.
            Respond with title only.
            """;

    String SUMMARY_PROMPT = """
            User:
            %s
            
            Assistant:
            %s
            """;
}
