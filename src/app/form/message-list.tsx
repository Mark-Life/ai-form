import type { UIMessage } from "ai";
import { CopyIcon, PlayIcon, RefreshCcwIcon } from "lucide-react";
import { Fragment } from "react";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { ToolMessage } from "./tool-message";

type MessageListProps = {
  messages: UIMessage[];
  regenerate: () => void;
  playSpeech: (text: string) => void;
  stopSpeech: () => void;
  isPlaying: boolean;
  isLoading: boolean;
};

export function MessageList({
  messages,
  regenerate,
  playSpeech,
  stopSpeech,
  isPlaying,
  isLoading,
}: MessageListProps) {
  return (
    <>
      {messages.map((message) => (
        <div key={message.id}>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return (
                  <Fragment key={`${message.id}-${i}`}>
                    <Message from={message.role}>
                      <MessageContent>
                        <Response>{part.text}</Response>
                      </MessageContent>
                    </Message>
                    {message.role === "assistant" && (
                      <Actions className="mt-2">
                        {i === message.parts.length - 1 &&
                          message.id === messages.at(-1)?.id && (
                            <>
                              <Action
                                label="Retry"
                                onClick={() => regenerate()}
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                label="Copy"
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </>
                          )}
                        <Action
                          disabled={isLoading}
                          label="Play"
                          onClick={() => {
                            if (isPlaying) {
                              stopSpeech();
                            } else {
                              playSpeech(part.text);
                            }
                          }}
                        >
                          <PlayIcon className="size-3" />
                        </Action>
                      </Actions>
                    )}
                  </Fragment>
                );
              default:
                if (
                  part.type === "tool-updateField" ||
                  part.type === "tool-submitForm" ||
                  part.type === "tool-fillMany"
                ) {
                  return (
                    <ToolMessage
                      index={i}
                      key={`${message.id}-${i}`}
                      messageId={message.id}
                      part={part}
                    />
                  );
                }
                return null;
            }
          })}
        </div>
      ))}
    </>
  );
}
