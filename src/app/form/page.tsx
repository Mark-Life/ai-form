"use client";

import { useChat } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { useAutoPlayback } from "@/hooks/use-auto-playback";
import { useFormTools } from "@/hooks/use-form-tools";
import { useSpeech } from "@/hooks/use-speech";
import { formSchema as demoFormSchema } from "@/lib/demo-schema";
import {
  formDefinitionToZodSchema,
  getDefaultValues,
  loadFormFromStorage,
} from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { FormPreview } from "./form-preview";
import { MessageList } from "./message-list";
import { FormResult } from "./result";

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [submittedData, setSubmittedData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [autoPlayback, setAutoPlayback] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { playSpeech, stopSpeech, isPlaying, isLoading } = useSpeech();

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

  const { clearProcessedResults } = useFormTools({
    form,
    formSchema,
    messages,
    setSubmittedData: (data) => {
      setSubmittedData(data);
    },
  });

  useAutoPlayback({
    autoPlayback,
    messages,
    status,
    playSpeech,
  });

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
    clearProcessedResults();
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
              <MessageList
                isLoading={isLoading}
                isPlaying={isPlaying}
                messages={messages}
                playSpeech={playSpeech}
                regenerate={regenerate}
                stopSpeech={stopSpeech}
              />
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <ChatInput
            autoPlayback={autoPlayback}
            input={input}
            onAutoPlaybackToggle={() => setAutoPlayback(!autoPlayback)}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            status={status}
            textareaRef={textareaRef}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatBotDemo;
