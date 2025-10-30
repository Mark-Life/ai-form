"use client";

import { useChat } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ToolUIPart } from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Action, Actions } from "@/components/ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { type FormData, formSchema } from "@/lib/demo-schema";
import { FormPreview } from "./form-preview";

const models = [
  {
    name: "GPT 5 nano",
    value: "openai/gpt-5-nano",
  },
  {
    name: "Deepseek R1",
    value: "deepseek/deepseek-r1",
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const { messages, sendMessage, status, regenerate } = useChat();
  const processedToolResultsRef = useRef<Set<string>>(new Set());

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Handle tool results from messages
  useEffect(() => {
    const processToolResult = (result: unknown, toolResultId: string): void => {
      if (processedToolResultsRef.current.has(toolResultId)) {
        return;
      }
      processedToolResultsRef.current.add(toolResultId);

      try {
        const parsedResult =
          typeof result === "string" ? JSON.parse(result) : result;

        if (
          parsedResult &&
          typeof parsedResult === "object" &&
          "success" in parsedResult &&
          parsedResult.success &&
          "fieldName" in parsedResult &&
          "value" in parsedResult
        ) {
          form.setValue(
            parsedResult.fieldName as keyof FormData,
            parsedResult.value as string,
            {
              shouldValidate: true,
            }
          );
        }
      } catch {
        // Silently ignore parsing errors
      }
    };

    for (const message of messages) {
      if (message.role !== "assistant") {
        continue;
      }

      for (const part of message.parts) {
        if (part.type === "tool-updateField") {
          const toolPart = part as {
            type: "tool-updateField";
            toolCallId: string;
            state: string;
            input?: unknown;
            output?: unknown;
            errorText?: string;
          };
          const toolResultId = `${message.id}-${toolPart.toolCallId}`;
          if (toolPart.state === "output-available" && toolPart.output) {
            processToolResult(toolPart.output, toolResultId);
          }
        }
      }
    }
  }, [messages, form]);

  const handleStart = () => {
    sendMessage(
      {
        text: "Start",
      },
      {
        body: {
          model,
        },
      }
    );
  };

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model,
        },
      }
    );
    setInput("");
  };

  return (
    <div className="relative mx-auto size-full h-screen p-6">
      <div className="flex h-full gap-6">
        {/* Form Preview - Left Column */}
        <div className="flex w-1/2 flex-col">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-6 font-semibold text-lg">Form Preview</h2>
            <FormPreview form={form} />
          </div>
        </div>

        {/* Chat - Right Column */}
        <div className="flex w-1/2 flex-col">
          <Conversation className="h-full">
            <ConversationContent>
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <p className="text-center text-muted-foreground text-sm">
                    Click the button below to start the conversation with the AI
                    assistant. They will help you fill out the form.
                  </p>
                  <Button onClick={handleStart} size="lg">
                    Start Conversation
                  </Button>
                </div>
              )}
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
                            {message.role === "assistant" &&
                              i === messages.length - 1 && (
                                <Actions className="mt-2">
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
                                </Actions>
                              )}
                          </Fragment>
                        );
                      case "reasoning":
                        return (
                          <Reasoning
                            className="w-full"
                            isStreaming={
                              status === "streaming" &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                            key={`${message.id}-${i}`}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        if (part.type === "tool-updateField") {
                          const toolPart = part as {
                            type: "tool-updateField";
                            toolCallId: string;
                            state: ToolUIPart["state"];
                            input?: unknown;
                            output?: unknown;
                            errorText?: string;
                          };
                          return (
                            <Tool defaultOpen key={`${message.id}-${i}`}>
                              <ToolHeader
                                state={toolPart.state}
                                title="updateField"
                                type={toolPart.type}
                              />
                              <ToolContent>
                                {"input" in toolPart &&
                                  toolPart.input !== undefined && (
                                    <ToolInput input={toolPart.input} />
                                  )}
                                {(toolPart.output || toolPart.errorText) && (
                                  <ToolOutput
                                    errorText={toolPart.errorText}
                                    output={toolPart.output}
                                  />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                        }
                        return null;
                    }
                  })}
                </div>
              ))}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            className="mt-4"
            globalDrop
            multiple
            onSubmit={handleSubmit}
          >
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value);
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((modelOption) => (
                      <PromptInputModelSelectItem
                        key={modelOption.value}
                        value={modelOption.value}
                      >
                        {modelOption.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!(input || status)}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

export default ChatBotDemo;
