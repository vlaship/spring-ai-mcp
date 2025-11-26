const DEFAULT_ASSISTANT_BASE_URL = "http://localhost:8083/proposal-assistant-service";

const API_BASE_URL = normalizeBaseUrl(
    window.UI_CONFIG?.assistantBaseUrl ?? inferAssistantBaseUrl()
);

const userSelect = document.getElementById("userSelect");
const chatList = document.getElementById("chatList");
const chatCount = document.getElementById("chatCount");
const newChatButton = document.getElementById("newChat");
const chatPanelTitle = document.getElementById("chatPanelTitle");
const chatHistory = document.getElementById("chatHistory");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendMessage");
const themeToggleButton = document.getElementById("themeToggle");
const themeToggleText = document.getElementById("themeToggleText");

const Theme = {
    AUTO: "auto",
    DAY: "day",
    NIGHT: "night",
};

const THEME_STORAGE_KEY = "pooch-palace-theme";

const state = {
    users: [],
    chats: [],
    selectedUserId: null,
    selectedChatId: null,
    historyByChatId: {},
    isSending: false,
    isComposingNewChat: false,
    pendingAssistantByChatId: {},
    pendingAssistantIntervals: {},
};

const DRAFT_CHAT_KEY = "__draft";
const MAX_HISTORY_MESSAGES = 40;
let currentTheme = Theme.DAY;

init();

function init() {
    initializeTheme();
    attachEventListeners();
    resetChatPanel();
    loadUsers();
}

function attachEventListeners() {
    if (themeToggleButton) {
        themeToggleButton.addEventListener("click", handleThemeToggleClick);
    }

    userSelect.addEventListener("change", (event) => {
        const userId = event.target.value;
        state.selectedUserId = userId || null;
        newChatButton.disabled = !state.selectedUserId;

        if (state.selectedUserId) {
            state.historyByChatId = {};
            clearAllPendingAssistantAnimations();
            state.pendingAssistantByChatId = {};
            state.pendingAssistantIntervals = {};
            state.selectedChatId = null;
            state.isComposingNewChat = true;
            state.historyByChatId[DRAFT_CHAT_KEY] = [];
            prepareChatPanelForUser();
            loadChats(state.selectedUserId);
        } else {
            resetChatsView();
            resetChatPanel();
        }
    });

    newChatButton.addEventListener("click", () => {
        if (!state.selectedUserId) {
            return;
        }
        beginNewChatSession();
    });

    chatList.addEventListener("click", (event) => {
        const card = event.target.closest(".chat-card");
        if (!card) {
            return;
        }
        const chatId = card.dataset.chatId;
        if (!chatId) {
            return;
        }
        const chat = state.chats.find((c) => c.chatId === chatId);
        if (chat) {
            selectExistingChat(chat);
        }
    });

    chatHistory.addEventListener("scroll", () => {
        // no-op retained for potential future behavior
    });

    messageForm.addEventListener("submit", handleMessageSubmit);
    messageInput.addEventListener("keydown", handleMessageInputKeydown);
    messageInput.addEventListener("input", updateSendButtonState);
}

async function loadUsers() {
    setUserSelectLoading();

    try {
        const users = await fetchJson("/users");
        state.users = users;
        populateUserSelect(users);
    } catch (error) {
        console.error(error);
        setUserSelectError(error.message);
    }
}

function populateUserSelect(users) {
    userSelect.innerHTML = "";

    if (!users.length) {
        const option = document.createElement("option");
        option.textContent = "No users found";
        option.disabled = true;
        userSelect.appendChild(option);
        userSelect.disabled = true;
        return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a user";
    placeholder.selected = true;
    placeholder.disabled = true;
    userSelect.appendChild(placeholder);

    users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.userId;
        option.textContent = user.name;
        userSelect.appendChild(option);
    });

    userSelect.disabled = false;
}

function setUserSelectLoading() {
    userSelect.innerHTML = "";
    const option = document.createElement("option");
    option.textContent = "Loading users…";
    option.disabled = true;
    option.selected = true;
    userSelect.appendChild(option);
    userSelect.disabled = true;
}

function setUserSelectError(message) {
    userSelect.innerHTML = "";
    const option = document.createElement("option");
    option.textContent = `Failed to load users (${message})`;
    option.disabled = true;
    option.selected = true;
    userSelect.appendChild(option);
    userSelect.disabled = true;
}

async function loadChats(userId) {
    renderChatPlaceholder("Loading chats…");

    try {
        const chats = await fetchJson("/chats", {
            headers: {
                "X-User-Id": userId,
            },
        });

        state.chats = chats;
        renderChats(chats);
    } catch (error) {
        console.error(error);
        renderChatPlaceholder(`Failed to load chats: ${error.message}`);
    }
}

function resetChatsView() {
    state.chats = [];
    chatCount.textContent = "0";
    renderChatPlaceholder("Choose a user to view their chats.");
}

function renderChats(chats) {
    chatList.innerHTML = "";
    chatCount.textContent = chats.length;

    if (!chats.length) {
        renderChatPlaceholder("No chats yet. Start one to begin the conversation!");
        return;
    }

    const fragment = document.createDocumentFragment();
    const activeChatId = state.isComposingNewChat ? null : state.selectedChatId;

    chats
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach((chat) => {
            const card = document.createElement("article");
            card.className = "chat-card";
            card.dataset.chatId = chat.chatId;
            if (activeChatId && chat.chatId === activeChatId) {
                card.classList.add("chat-card--active");
            }

            const title = document.createElement("h3");
            title.className = "chat-card__title";
            title.textContent = chat.title || "Untitled chat";

            const timestamp = document.createElement("span");
            timestamp.className = "chat-card__timestamp";
            timestamp.textContent = formatTimestamp(chat.createdAt);

            card.appendChild(title);
            card.appendChild(timestamp);

            fragment.appendChild(card);
        });

    chatList.appendChild(fragment);
}

function renderChatPlaceholder(message) {
    chatList.innerHTML = "";
    const placeholder = document.createElement("div");
    placeholder.className = "empty-state";
    placeholder.textContent = message;
    chatList.appendChild(placeholder);
}

function formatTimestamp(value) {
    if (!value) {
        return "Unknown date";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function resetChatPanel() {
    chatPanelTitle.textContent = "Select a user to get started";
    state.historyByChatId[DRAFT_CHAT_KEY] = [];
    clearAllPendingAssistantAnimations();
    state.pendingAssistantByChatId = {};
    state.pendingAssistantIntervals = {};
    renderChatHistory([], {
        placeholder: "Choose a user, then start a new chat or open an existing one.",
    });
    messageInput.value = "";
    state.isSending = false;
    state.isComposingNewChat = false;
    updateComposerState();
}

function prepareChatPanelForUser() {
    chatPanelTitle.textContent = "Pick a chat or start a new one";
    renderChatHistory(getHistory(DRAFT_CHAT_KEY), {
        placeholder: "Type a message to start a new chat or pick one on the left.",
    });
    updateComposerState();
}

function beginNewChatSession() {
    state.selectedChatId = null;
    state.isComposingNewChat = true;
    state.historyByChatId[DRAFT_CHAT_KEY] = [];
    const pendingId = state.pendingAssistantByChatId[DRAFT_CHAT_KEY];
    if (pendingId) {
        stopPendingStatusAnimation(pendingId);
    }
    delete state.pendingAssistantByChatId[DRAFT_CHAT_KEY];
    chatPanelTitle.textContent = "New conversation";
    messageInput.value = "";
    renderChatHistory(state.historyByChatId[DRAFT_CHAT_KEY], {
        placeholder: "Say hello to begin the conversation.",
    });
    updateComposerState();
    messageInput.focus();
}

async function selectExistingChat(chat) {
    state.selectedChatId = chat.chatId;
    state.isComposingNewChat = false;
    chatPanelTitle.textContent = chat.title || "Untitled chat";
    const cachedHistory = getHistory(chat.chatId);
    if (cachedHistory.length) {
        renderChatHistory(cachedHistory);
    } else {
        renderChatHistory([], {
            placeholder: "Loading chat history…",
        });
    }
    updateComposerState();

    try {
        const history = await fetchChatHistory(chat.chatId);
        state.historyByChatId[chat.chatId] = history.map((message, index) => ({
            id: `${chat.chatId}-${index}`,
            role: normalizeRole(message.role),
            content: message.content,
            timestamp: message.timestamp,
            status: "complete",
        }));
        renderChatHistory(getHistory(chat.chatId), {
            placeholder: "No messages yet. Start the conversation!",
        });
    } catch (error) {
        console.error(error);
        renderChatHistory([], {
            placeholder: `Failed to load chat: ${error.message}`,
        });
    } finally {
        focusMessageInput();
    }
}

function focusMessageInput() {
    if (messageInput) {
        messageInput.focus();
    }
}

function normalizeRole(role) {
    if (!role) {
        return "assistant";
    }
    const normalized = role.toLowerCase();
    if (["assistant", "user", "system", "tool"].includes(normalized)) {
        return normalized;
    }
    return "assistant";
}

async function fetchChatHistory(chatId) {
    if (!state.selectedUserId) {
        return [];
    }
    return fetchJson(`/chats/${chatId}`, {
        headers: {
            "X-User-Id": state.selectedUserId,
        },
    });
}

function getHistory(chatKey = getActiveHistoryKey()) {
    if (!state.historyByChatId[chatKey]) {
        state.historyByChatId[chatKey] = [];
    }
    return state.historyByChatId[chatKey];
}

function getActiveHistoryKey() {
    return state.selectedChatId ?? DRAFT_CHAT_KEY;
}

function renderChatHistory(messages, options = {}) {
    chatHistory.innerHTML = "";

    if (!messages.length) {
        const placeholder = document.createElement("div");
        placeholder.className = "empty-state empty-state--light";
        placeholder.textContent = options.placeholder || "No messages yet. Start the conversation!";
        chatHistory.appendChild(placeholder);
        return;
    }

    const visibleMessages = messages.slice(-MAX_HISTORY_MESSAGES);
    const fragment = document.createDocumentFragment();

    visibleMessages.forEach((message) => {
        const bubble = document.createElement("article");
        bubble.className = `chat-bubble chat-bubble--${message.role}`;
        bubble.dataset.messageId = message.id;

        const roleLabel = document.createElement("header");
        roleLabel.className = "chat-bubble__role";
        roleLabel.textContent = formatRole(message.role);

        const body = document.createElement("p");
        body.className = "chat-bubble__text";
        body.textContent = message.content;

        if (message.status === "pending") {
            const inlineStatus = document.createElement("span");
            inlineStatus.className = "chat-bubble__inline-status";

            const statusText = document.createElement("span");
            statusText.className = "chat-bubble__inline-status-text";
            statusText.textContent = "Thinking";

            inlineStatus.appendChild(statusText);
            body.appendChild(inlineStatus);
        }

        bubble.appendChild(roleLabel);
        bubble.appendChild(body);

        if (message.timestamp) {
            const time = document.createElement("time");
            time.className = "chat-bubble__timestamp";
            time.dateTime = message.timestamp;
            time.textContent = formatBubbleTimestamp(message.timestamp);
            bubble.appendChild(time);
        }

        fragment.appendChild(bubble);
    });

    chatHistory.appendChild(fragment);
    scrollHistoryToBottom();
}

function formatRole(role) {
    switch (role) {
        case "assistant":
            return "Assistant";
        case "system":
            return "System";
        default:
            return "You";
    }
}

function formatBubbleTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function scrollHistoryToBottom({ smooth = false } = {}) {
    chatHistory.scrollTo({
        top: chatHistory.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
    });
}

function canSendMessages() {
    return Boolean(state.selectedUserId && (state.selectedChatId || state.isComposingNewChat));
}

function updateComposerState() {
    const enabled = canSendMessages();
    messageInput.disabled = !enabled || state.isSending;
    updateSendButtonState();
}

function updateSendButtonState() {
    const hasText = Boolean(messageInput.value.trim());
    const enabled = canSendMessages() && hasText && !state.isSending;
    sendButton.disabled = !enabled;
}

function handleMessageInputKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        messageForm.requestSubmit();
    }
}

async function handleMessageSubmit(event) {
    event.preventDefault();
    const question = messageInput.value.trim();

    if (!question || state.isSending || !canSendMessages()) {
        return;
    }

    await sendMessage(question);
}

async function sendMessage(question) {
    const historyKey = getActiveHistoryKey();
    addMessageToHistory("user", question, historyKey);
    const placeholder = addAssistantPlaceholder(historyKey);
    messageInput.value = "";
    renderChatHistory(getHistory(historyKey));
    if (placeholder) {
        startPendingStatusAnimation(placeholder.id);
    }
    state.isSending = true;
    updateComposerState();

    try {
        await streamAssistantResponse(question, historyKey);
        refreshActiveChatMetadata();
    } catch (error) {
        console.error(error);
        const targetHistoryKey = error?.historyKey ?? historyKey;
        clearAssistantPlaceholder(targetHistoryKey);
        addMessageToHistory("system", `Failed to send message: ${error.message}`, targetHistoryKey);
        renderChatHistory(getHistory(targetHistoryKey));
    } finally {
        state.isSending = false;
        updateComposerState();
    }
}

async function streamAssistantResponse(question, initialHistoryKey) {
    const params = new URLSearchParams({ question });
    if (state.selectedChatId) {
        params.append("chatId", state.selectedChatId);
    }

    const response = await fetch(`${API_BASE_URL}/ask/stream?${params.toString()}`, {
        headers: {
            Accept: "application/x-ndjson",
            "X-User-Id": state.selectedUserId,
        },
    });

    if (!response.ok) {
        const message = await tryReadError(response);
        throw new Error(message);
    }

    if (!response.body) {
        throw new Error("Streaming not supported in this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let aggregatedAnswer = "";
    let currentHistoryKey = initialHistoryKey;
    let finalResult = null;

    const processEvent = (event) => {
        const { chatId, delta, done, answer, error } = event;

        if (error) {
            throw new Error(error);
        }

        if (chatId && chatId !== currentHistoryKey) {
            currentHistoryKey = ensureChatSelection(chatId, currentHistoryKey);
        }

        if (typeof delta === "string" && delta.length) {
            aggregatedAnswer += delta;
            updateAssistantPlaceholderContent(currentHistoryKey, aggregatedAnswer);
            renderChatHistory(getHistory(currentHistoryKey));
        }

        if (done) {
            const finalAnswer = answer ?? aggregatedAnswer ?? "";
            resolveAssistantPlaceholder(currentHistoryKey, finalAnswer);
            renderChatHistory(getHistory(currentHistoryKey));
            finalResult = {
                chatId: chatId ?? state.selectedChatId ?? currentHistoryKey,
                answer: finalAnswer,
            };
            return true;
        }

        return false;
    };

    try {
        while (true) {
            const { value, done } = await reader.read();

            if (value) {
                buffer += decoder.decode(value, { stream: true });
                let newlineIndex;
                while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
                    const line = buffer.slice(0, newlineIndex);
                    buffer = buffer.slice(newlineIndex + 1);
                    const trimmed = line.trim();
                    if (!trimmed) {
                        continue;
                    }

                    let event;
                    try {
                        event = JSON.parse(trimmed);
                    } catch (parseError) {
                        console.error("Failed to parse stream chunk", parseError, trimmed);
                        continue;
                    }

                    if (processEvent(event)) {
                        await reader.cancel().catch(() => {});
                        return finalResult;
                    }
                }
            }

            if (done) {
                const remaining = buffer.trim();
                if (remaining) {
                    try {
                        const event = JSON.parse(remaining);
                        if (processEvent(event)) {
                            break;
                        }
                    } catch (parseError) {
                        console.error("Failed to parse final stream chunk", parseError, remaining);
                    }
                }
                break;
            }
        }
    } catch (streamError) {
        streamError.historyKey = currentHistoryKey;
        throw streamError;
    } finally {
        try {
            reader.releaseLock();
        } catch (releaseError) {
            // ignore release issues
        }
    }

    if (!finalResult) {
        const error = new Error("Stream ended before completion.");
        error.historyKey = currentHistoryKey;
        throw error;
    }

    return finalResult;
}

function handleAskSuccess(response, previousHistoryKey) {
    const { chatId, answer } = response;
    if (!chatId) {
        return;
    }

    const targetKey = ensureChatSelection(chatId, previousHistoryKey);

    if (!resolveAssistantPlaceholder(targetKey, answer)) {
        addMessageToHistory("assistant", answer, targetKey);
    }
    renderChatHistory(getHistory(targetKey));
    refreshActiveChatMetadata();
}

function ensureChatSelection(chatId, previousHistoryKey) {
    if (!chatId) {
        return previousHistoryKey;
    }

    if (previousHistoryKey !== chatId) {
        const previousHistory = state.historyByChatId[previousHistoryKey] ?? [];
        state.historyByChatId[chatId] = previousHistory;
        delete state.historyByChatId[previousHistoryKey];

        const pendingId = state.pendingAssistantByChatId[previousHistoryKey];
        if (pendingId) {
            state.pendingAssistantByChatId[chatId] = pendingId;
            delete state.pendingAssistantByChatId[previousHistoryKey];
        }
    }

    if (!state.selectedChatId) {
        state.selectedChatId = chatId;
        state.isComposingNewChat = false;
    }

    return chatId;
}

function refreshActiveChatMetadata() {
    if (!state.selectedUserId || !state.selectedChatId) {
        return;
    }

    loadChats(state.selectedUserId).then(() => {
        const activeChat = state.chats.find((chat) => chat.chatId === state.selectedChatId);
        if (activeChat) {
            chatPanelTitle.textContent = activeChat.title || "Untitled chat";
        }
    });
}

function addMessageToHistory(role, content, chatKey, overrides = {}) {
    const history = getHistory(chatKey);
    const entry = {
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${history.length}`,
        role,
        content,
        status: overrides.status ?? "complete",
        timestamp:
            overrides.hasOwnProperty("timestamp") && overrides.timestamp !== undefined
                ? overrides.timestamp
                : new Date().toISOString(),
    };
    history.push(entry);
    return entry;
}

function addAssistantPlaceholder(chatKey) {
    const entry = addMessageToHistory("assistant", "", chatKey, {
        status: "pending",
        timestamp: null,
    });
    state.pendingAssistantByChatId[chatKey] = entry.id;
    return entry;
}

function updateAssistantPlaceholderContent(chatKey, content) {
    const pendingId = state.pendingAssistantByChatId[chatKey];
    if (!pendingId) {
        return;
    }

    const history = getHistory(chatKey);
    const entry = history.find((message) => message.id === pendingId);
    if (!entry) {
        return;
    }

    entry.content = content ?? "";
    if (entry.status === "pending") {
        entry.status = "streaming";
        stopPendingStatusAnimation(pendingId);
    }
}

function resolveAssistantPlaceholder(chatKey, answer) {
    const pendingId = state.pendingAssistantByChatId[chatKey];
    if (!pendingId) {
        return false;
    }

    const history = getHistory(chatKey);
    const entry = history.find((message) => message.id === pendingId);
    if (!entry) {
        delete state.pendingAssistantByChatId[chatKey];
        return false;
    }

    entry.content = answer;
    entry.status = "complete";
    entry.timestamp = new Date().toISOString();
    stopPendingStatusAnimation(entry.id);
    delete state.pendingAssistantByChatId[chatKey];
    return true;
}

function clearAssistantPlaceholder(chatKey) {
    const pendingId = state.pendingAssistantByChatId[chatKey];
    if (!pendingId) {
        return;
    }
    const history = getHistory(chatKey);
    const index = history.findIndex((message) => message.id === pendingId);
    if (index >= 0) {
        history.splice(index, 1);
    }
    stopPendingStatusAnimation(pendingId);
    delete state.pendingAssistantByChatId[chatKey];
}

function startPendingStatusAnimation(messageId) {
    if (!messageId) {
        return;
    }
    stopPendingStatusAnimation(messageId);
    let frame = 0;
    const updateText = () => {
        const statusText = chatHistory.querySelector(
            `[data-message-id="${messageId}"] .chat-bubble__inline-status-text`
        );
        if (!statusText) {
            return;
        }
        const dots = ".".repeat((frame % 3) + 1);
        statusText.textContent = `Thinking${dots}`;
        frame += 1;
    };
    updateText();
    state.pendingAssistantIntervals[messageId] = window.setInterval(updateText, 500);
}

function stopPendingStatusAnimation(messageId) {
    const timerId = state.pendingAssistantIntervals[messageId];
    if (timerId) {
        window.clearInterval(timerId);
        delete state.pendingAssistantIntervals[messageId];
    }
}

function clearAllPendingAssistantAnimations() {
    Object.keys(state.pendingAssistantIntervals).forEach((messageId) => {
        window.clearInterval(state.pendingAssistantIntervals[messageId]);
        delete state.pendingAssistantIntervals[messageId];
    });
}

function handleThemeToggleClick() {
    toggleTheme();
}

function initializeTheme() {
    const storedTheme = readStoredThemePreference();
    if (storedTheme && Object.values(Theme).includes(storedTheme)) {
        setTheme(storedTheme, { skipPersist: true });
    } else {
        setTheme(Theme.AUTO, { skipPersist: true });
    }

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
        if (currentTheme === Theme.AUTO) {
            applyTheme(Theme.AUTO);
        }
    });
}

function toggleTheme() {
    const themeOrder = [Theme.AUTO, Theme.DAY, Theme.NIGHT];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
}

function setTheme(theme, { skipPersist = false } = {}) {
    const validTheme = Object.values(Theme).includes(theme) ? theme : Theme.AUTO;
    currentTheme = validTheme;
    applyTheme(validTheme);

    if (!skipPersist) {
        persistThemePreference(validTheme);
    }
}

function applyTheme(theme) {
    let isDark = false;
    let label = "Auto";

    if (theme === Theme.AUTO) {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        label = "Auto";
    } else if (theme === Theme.NIGHT) {
        isDark = true;
        label = "Night";
    } else {
        isDark = false;
        label = "Day";
    }

    document.body.classList.toggle("theme-dark", isDark);

    if (themeToggleButton) {
        themeToggleButton.setAttribute("data-theme", theme);
        themeToggleButton.setAttribute("aria-pressed", String(isDark));
        const nextTheme = theme === Theme.AUTO ? Theme.DAY : (theme === Theme.DAY ? Theme.NIGHT : Theme.AUTO);
        const nextLabel = nextTheme === Theme.AUTO ? "auto" : (nextTheme === Theme.DAY ? "day" : "night");
        themeToggleButton.setAttribute(
            "aria-label",
            `Switch to ${nextLabel} theme`
        );
    }

    if (themeToggleText) {
        themeToggleText.textContent = label;
    }
}

function readStoredThemePreference() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
        return null;
    }
}

function persistThemePreference(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        // ignore write errors (e.g., storage disabled)
    }
}

function inferAssistantBaseUrl() {
    const { hostname, origin, protocol } = window.location;

    const isFileOrigin = protocol === "file:" || origin?.startsWith("file://");
    if (!origin || origin === "null" || isFileOrigin) {
        return DEFAULT_ASSISTANT_BASE_URL;
    }

    if (isLocalHostname(hostname)) {
        return DEFAULT_ASSISTANT_BASE_URL;
    }

    return `${origin}/proposal-assistant-service`;
}

function isLocalHostname(hostname = "") {
    const normalized = hostname.toLowerCase();

    if (
        normalized === "" ||
        normalized === "localhost" ||
        normalized === "127.0.0.1" ||
        normalized === "::1" ||
        normalized === "0.0.0.0"
    ) {
        return true;
    }

    if (
        normalized.startsWith("192.168.") ||
        normalized.startsWith("10.") ||
        normalized.startsWith("172.") ||
        normalized.endsWith(".local")
    ) {
        return true;
    }

    return false;
}

function normalizeBaseUrl(value) {
    if (!value) {
        return "";
    }

    return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function fetchJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Accept": "application/json",
            ...(options.headers ?? {}),
        },
    });

    if (!response.ok) {
        const message = await tryReadError(response);
        throw new Error(message);
    }

    return response.json();
}

async function tryReadError(response) {
    try {
        const body = await response.json();
        if (body?.message) {
            return body.message;
        }
    } catch (error) {
        // ignore JSON parsing errors
    }
    return `${response.status} ${response.statusText}`;
}
