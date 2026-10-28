<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'

import kakarotIcon from '@/assets/images/kakarot.png'
import { chatApi } from '@/services/api'

const md = new MarkdownIt({ breaks: true, linkify: true })

const isOpen = ref(false)
const chatbot = ref<HTMLElement | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const messageInput = ref<HTMLInputElement | null>(null)
const message = ref('')
const messages = ref([
  {
    id: 1,
    text: 'Welcome to Collab Farm, How can i assist you.',
    isBot: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
])
const isSending = ref(false)
const sessionId = sessionStorage.getItem('chat_session_id') || createSessionId()
let nextMessageId = 1

watch(
  () => [messages.value.length, isSending.value, isOpen.value],
  async () => {
    await nextTick()
    const container = messagesContainer.value
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  },
  { flush: 'post' },
)

watch(isOpen, async (open) => {
  if (!open) return
  await nextTick()
  messageInput.value?.focus()
})

function createSessionId(): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem('chat_session_id', id)
  return id
}

function addMessage(text: string, isBot: boolean) {
  messages.value.push({
    id: ++nextMessageId,
    text,
    isBot,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })
}

function closeOnOutsideTap(event: PointerEvent) {
  if (isOpen.value && chatbot.value && !chatbot.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', closeOnOutsideTap))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnOutsideTap))

function toggleChat() {
  isOpen.value = !isOpen.value
}

async function sendMessage() {
  const prompt = message.value.trim()
  if (!prompt || isSending.value) return

  addMessage(prompt, false)
  message.value = ''
  isSending.value = true
  try {
    const response = await chatApi.send({ session_id: sessionId, message: prompt })
    const answer =
      response && typeof response === 'object'
        ? (response as { answer?: unknown }).answer
        : undefined

    if (typeof answer === 'string' && answer) {
      addMessage(answer, true)
    } else {
      // Provide a helpful response when AI doesn't have specific information
      addMessage(
        "I understand your question. While I don't have specific information about that right now, I'd be happy to help you with general questions about Collab Farm, funding packages, investment opportunities, or farmer partnerships. Could you please rephrase your question or ask about something else I can assist with?",
        true,
      )
    }
  } catch {
    // Provide a more helpful error response
    addMessage(
      "I apologize, but I'm having trouble connecting right now. Please try again in a moment. In the meantime, feel free to ask me about our funding packages, investment opportunities, or how Collab Farm works.",
      true,
    )
  } finally {
    isSending.value = false
    await nextTick()
    if (isOpen.value) messageInput.value?.focus()
  }
}
</script>

<template>
  <div ref="chatbot" class="chatbot">
    <!-- Chat Button -->
    <button v-if="!isOpen" class="chatbot__button" @click="toggleChat" aria-label="Open chat">
      <img :src="kakarotIcon" alt="Chatbot" class="chatbot__avatar" />
    </button>

    <!-- Chat Window -->
    <div v-if="isOpen" class="chatbot__window">
      <div class="chatbot__header">
        <div class="chatbot__header-content">
          <div class="chatbot__header-avatar-wrapper">
            <img :src="kakarotIcon" alt="Chatbot" class="chatbot__header-avatar" />
            <div class="chatbot__status-indicator"></div>
          </div>
          <div class="chatbot__header-text">
            <h3>Kakarot</h3>
            <p class="chatbot__header-subtitle">Investment assistant</p>
          </div>
        </div>
        <button class="chatbot__close" @click="toggleChat" aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 4l12 12M16 4L4 16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div ref="messagesContainer" class="chatbot__messages">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'chatbot__message',
            msg.isBot ? 'chatbot__message--bot' : 'chatbot__message--user',
          ]"
        >
          <div v-if="msg.isBot" class="markdown-content" v-html="md.render(msg.text)"></div>
          <span v-else>{{ msg.text }}</span>
          <time>{{ msg.time }}</time>
        </div>
        <div
          v-if="isSending"
          class="chatbot__message chatbot__message--bot chatbot__message--typing"
        >
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div class="chatbot__input">
        <input
          ref="messageInput"
          v-model="message"
          type="text"
          placeholder="Ask about agricultural investment..."
          :disabled="isSending"
          @keyup.enter="sendMessage"
        />
        <button
          class="chatbot__send"
          :disabled="isSending"
          @click="sendMessage"
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M18 2 9 21l-2-8-5-3 16-8Zm0 0L7 13"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chatbot {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  cursor: auto;
}

.chatbot__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 82px;
  border: none;
  border-radius: 50%;
  background: var(--color-green-700);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  padding: 0;
  overflow: hidden;
}

.chatbot__button:hover {
  background: var(--color-green-800);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.chatbot__avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chatbot__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.chatbot__window {
  width: min(860px, calc(100vw - 32px));
  height: min(820px, calc(100dvh - 32px));
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chatbot__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  box-sizing: border-box;
  padding: 8px 16px;
  gap: 16px;
  border-bottom: 0.5px solid #d7d7d7;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background: #f6f6f5;
}

.chatbot__header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chatbot__header-avatar-wrapper {
  position: relative;
  width: 36px;
  height: 36px;
  padding: 4px;
  border-radius: 50%;
  background: #e9ece8;
}

.chatbot__header-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.chatbot__status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #fff;
}

.chatbot__header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chatbot__header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #171717;
}

.chatbot__header-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #777;
  font-weight: 400;
}

.chatbot__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-ink-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chatbot__close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-ink);
}

.chatbot__messages {
  flex: 1;
  min-height: 0;
  padding: 12px 16px;
  gap: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chatbot__message {
  max-width: 70%;
  min-width: 64px;
  padding: 12px;
  border-radius: 11px;
  font-size: 1rem;
  line-height: 1.5;
  word-wrap: break-word;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.chatbot__message--bot {
  align-self: flex-start;
  background: #f5f5f5;
  color: #505050;
  border: 1px solid #eeeeee;
  border-bottom-left-radius: 11px;
}

.chatbot__message--user {
  align-self: flex-end;
  background: #2e5e43;
  color: #fff;
  border-bottom-right-radius: 11px;
}

.chatbot__message time {
  align-self: flex-end;
  font-size: 0.72rem;
  opacity: 0.65;
}

.chatbot__message--typing {
  padding: 16px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #505050;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chatbot__input {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 68px;
  box-sizing: border-box;
  padding: 10px;
  border-top: 0.5px solid #d7d7d7;
  background: #fff;
}

.chatbot__input input {
  flex: 1;
  padding: 12px 4px;
  border: 1px solid #e8ebe7;
  border-radius: 0 24px 24px 0;
  background: #f7f7f7;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
}

.chatbot__input input:focus {
  border-color: var(--color-green-700);
  background: #fff;
}

.chatbot__input input::placeholder {
  color: #b3b3b3;
}

.chatbot__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #2e5e43;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.chatbot__send:hover {
  background: var(--color-green-800);
  transform: scale(1.05);
}

@media (max-width: 480px) {
  .chatbot {
    right: 10px;
    bottom: 10px;
  }

  .chatbot__button {
    width: 72px;
    height: 72px;
  }

  .chatbot__window {
    width: calc(100vw - 20px);
    height: calc(100dvh - 20px);
  }
}

/* Markdown Content Styles */
.markdown-content {
  line-height: 1.6;
}

.markdown-content p {
  margin: 0 0 8px 0;
}

.markdown-content p:last-child {
  margin-bottom: 0;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 12px 0 8px 0;
  font-weight: 600;
  color: #333;
}

.markdown-content h1 {
  font-size: 1.3em;
}
.markdown-content h2 {
  font-size: 1.2em;
}
.markdown-content h3 {
  font-size: 1.1em;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-content li {
  margin: 4px 0;
}

.markdown-content ul {
  list-style-type: disc;
}

.markdown-content ol {
  list-style-type: decimal;
}

.markdown-content code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background: #f4f4f4;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-content pre code {
  background: transparent;
  padding: 0;
}

.markdown-content blockquote {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 3px solid #2e5e43;
  color: #666;
}

.markdown-content a {
  color: #2e5e43;
  text-decoration: underline;
}

.markdown-content a:hover {
  color: #1a3a2a;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content hr {
  margin: 12px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}

.markdown-content table {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #e0e0e0;
  padding: 6px 10px;
  text-align: left;
}

.markdown-content th {
  background: #f5f5f5;
  font-weight: 600;
}
</style>
