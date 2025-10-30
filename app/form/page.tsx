"use client";

import { useChat } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ToolUIPart } from "ai";
import { CopyIcon, PlayIcon, RefreshCcwIcon, Volume2Icon } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
// import {
//   Reasoning,
//   ReasoningContent,
//   ReasoningTrigger,
// } from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { FormResult } from "@/components/form/result";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSpeech } from "@/hooks/use-speech";
import { formSchema as demoFormSchema } from "@/lib/demo-schema";
import { formDefinitionToZodSchema } from "@/lib/form-builder-utils";
import { loadFormFromStorage } from "@/lib/form-definition";
import { getDefaultValues } from "@/lib/schema-utils";
import { FormPreview } from "./form-preview";

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [submittedData, setSubmittedData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [autoPlayback, setAutoPlayback] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat();
  const processedToolResultsRef = useRef<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { playSpeech, stopSpeech, isPlaying, isLoading } = useSpeech();
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  // Load form definition from localStorage or use demo schema
  const formDefinition = loadFormFromStorage();
  const formSchema = formDefinition
    ? formDefinitionToZodSchema(formDefinition)
    : demoFormSchema;
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(formSchema),
  });

  const processUpdateFieldResult = useCallback(
    (result: unknown, toolResultId: string): void => {
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
            parsedResult.value as FormData[keyof FormData],
            {
              shouldValidate: true,
            }
          );
        }
      } catch {
        // Silently ignore parsing errors
      }
    },
    [form]
  );

  const processSubmitFormResult = useCallback(
    (toolResultId: string): void => {
      if (processedToolResultsRef.current.has(toolResultId)) {
        return;
      }
      processedToolResultsRef.current.add(toolResultId);

      const formValues = form.getValues();
      const validationResult = formSchema.safeParse(formValues);

      if (validationResult.success) {
        setSubmittedData(validationResult.data);
      }
    },
    [form, formSchema]
  );

  const processToolPart = useCallback(
    (part: ToolUIPart, messageId: string) => {
      if (part.type === "tool-updateField") {
        const toolPart = part as unknown as {
          type: "tool-updateField";
          toolCallId: string;
          state: string;
          output?: unknown;
        };
        const toolResultId = `${messageId}-${toolPart.toolCallId}`;
        if (toolPart.state === "output-available" && toolPart.output) {
          processUpdateFieldResult(toolPart.output, toolResultId);
        }
      } else if (part.type === "tool-submitForm") {
        const toolPart = part as unknown as {
          type: "tool-submitForm";
          toolCallId: string;
          state: string;
          output?: unknown;
        };
        const toolResultId = `${messageId}-${toolPart.toolCallId}`;
        if (toolPart.state === "output-available" && toolPart.output) {
          processSubmitFormResult(toolResultId);
        }
      }
    },
    [processUpdateFieldResult, processSubmitFormResult]
  );

  // Handle tool results from messages
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") {
        continue;
      }

      for (const part of message.parts) {
        if (
          part.type === "tool-updateField" ||
          part.type === "tool-submitForm"
        ) {
          processToolPart(part, message.id);
        }
      }
    }
  }, [messages, processToolPart]);

  // Auto-playback logic
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

  const handleStart = () => {
    sendMessage(
      {
        text: "Start",
      },
      {
        body: {},
      }
    );
  };

  const handleFormSubmit = () => {
    const formValues = form.getValues();
    const validationResult = formSchema.safeParse(formValues);

    if (validationResult.success) {
      setSubmittedData(validationResult.data);
    }
  };

  const handleReset = () => {
    form.reset(getDefaultValues(formSchema));
    setSubmittedData(null);
    processedToolResultsRef.current.clear();
  };

  const extractFieldNameFromObject = (obj: unknown): string => {
    if (obj && typeof obj === "object") {
      const record = obj as Record<string, unknown>;
      if ("fieldName" in record && typeof record.fieldName === "string") {
        return record.fieldName;
      }
    }
    return "";
  };

  const parseOutput = (output: unknown): unknown => {
    if (!output) {
      return null;
    }
    if (typeof output === "string") {
      try {
        return JSON.parse(output);
      } catch {
        return null;
      }
    }
    return output;
  };

  const extractErrorFromOutput = (parsedOutput: unknown): string => {
    if (
      parsedOutput &&
      typeof parsedOutput === "object" &&
      "error" in parsedOutput &&
      typeof parsedOutput.error === "string"
    ) {
      return parsedOutput.error;
    }
    return "";
  };

  const checkOutputHasError = (parsedOutput: unknown): boolean =>
    parsedOutput !== null &&
    typeof parsedOutput === "object" &&
    "success" in parsedOutput &&
    parsedOutput.success === false;

  const getUpdateFieldMessage = (
    toolInput: unknown,
    toolOutput: unknown,
    errorText?: string
  ): string => {
    const inputName = extractFieldNameFromObject(toolInput);
    const parsedOutput = parseOutput(toolOutput);
    const outputName = extractFieldNameFromObject(parsedOutput);

    const fieldNameValue = outputName || inputName;
    const hasError = Boolean(errorText) || checkOutputHasError(parsedOutput);

    if (hasError) {
      const errorMsg = errorText || extractErrorFromOutput(parsedOutput);
      return `Failed to update field ${fieldNameValue}${errorMsg ? `: ${errorMsg}` : ""}`;
    }
    if (fieldNameValue) {
      return `Updated field: ${fieldNameValue}`;
    }
    return "Updated field";
  };

  const renderTool = (part: ToolUIPart, messageId: string, index: number) => {
    if (part.type !== "tool-updateField" && part.type !== "tool-submitForm") {
      return null;
    }

    const toolPart = part as unknown as {
      type: "tool-updateField" | "tool-submitForm";
      toolCallId: string;
      state: ToolUIPart["state"];
      input?: unknown;
      output?: unknown;
      errorText?: string;
    };

    // Only show message when output is available or there's an error
    if (
      toolPart.state !== "output-available" &&
      toolPart.state !== "output-error"
    ) {
      return null;
    }

    const messageText =
      toolPart.type === "tool-updateField"
        ? getUpdateFieldMessage(
            toolPart.input,
            toolPart.output,
            toolPart.errorText
          )
        : "Form submitted";

    return (
      <Message from="assistant" key={`${messageId}-${index}`}>
        <MessageContent>
          <Response className="text-muted-foreground text-sm">
            {messageText}
          </Response>
        </MessageContent>
      </Message>
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
          formDefinition: formDefinition ?? null,
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
            <h2 className="mb-6 font-semibold text-lg">Form</h2>
            {submittedData ? (
              <FormResult formData={submittedData} onReset={handleReset} />
            ) : (
              <FormPreview
                form={form}
                formSchema={formSchema}
                onSubmit={handleFormSubmit}
              />
            )}
          </div>
        </div>

        {/* Chat - Right Column */}
        <div className="flex w-1/2 flex-col">
          <Conversation className="h-full rounded-lg border bg-input/30">
            <ConversationContent>
              {messages.length === 0 && (
                <div className="absolute inset-0 mx-auto flex max-w-md flex-col items-center justify-center gap-4">
                  <p className="text-balance text-center text-muted-foreground text-sm">
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
                                          navigator.clipboard.writeText(
                                            part.text
                                          )
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
                      // case "reasoning":
                      //   return (
                      //     <Reasoning
                      //       className="w-full"
                      //       isStreaming={
                      //         status === "streaming" &&
                      //         i === message.parts.length - 1 &&
                      //         message.id === messages.at(-1)?.id
                      //       }
                      //       key={`${message.id}-${i}`}
                      //     >
                      //       <ReasoningTrigger />
                      //       <ReasoningContent>{part.text}</ReasoningContent>
                      //     </Reasoning>
                      //   );
                      default:
                        if (
                          part.type === "tool-updateField" ||
                          part.type === "tool-submitForm"
                        ) {
                          return renderTool(part, message.id, i);
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
                ref={textareaRef}
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PromptInputButton
                      onClick={() => setAutoPlayback(!autoPlayback)}
                      variant={autoPlayback ? "default" : "ghost"}
                    >
                      <Volume2Icon className="size-4" />
                    </PromptInputButton>
                  </TooltipTrigger>
                  <TooltipContent>Audio playback</TooltipContent>
                </Tooltip>
                <PromptInputSpeechButton
                  onTranscriptionChange={(text) => setInput(text)}
                  textareaRef={textareaRef}
                />
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
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
