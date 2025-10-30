import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

type AutoPlaybackConfig = {
  autoPlayback: boolean;
  messages: UIMessage[];
  status: "streaming" | "submitted" | "idle" | "error" | "ready";
  playSpeech: (text: string) => void;
};

export function useAutoPlayback({
  autoPlayback,
  messages,
  status,
  playSpeech,
}: AutoPlaybackConfig) {
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!autoPlayback || messages.length === 0) {
      return;
    }

    const lastMessage = messages.at(-1);
    if (!lastMessage) {
      return;
    }
    if (
      lastMessage.role !== "assistant" ||
      lastMessage.id === lastProcessedMessageIdRef.current
    ) {
      return;
    }

    // Check if message is complete (not streaming)
    if (status === "streaming" && lastMessage.id === messages.at(-1)?.id) {
      return;
    }

    // Find text part
    const textPart = lastMessage.parts.find((part) => part.type === "text");
    if (textPart && textPart.type === "text" && textPart.text) {
      lastProcessedMessageIdRef.current = lastMessage.id;
      playSpeech(textPart.text);
    }
  }, [messages, status, autoPlayback, playSpeech]);
}

