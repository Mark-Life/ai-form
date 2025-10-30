import type { ChatStatus } from "ai";
import { Volume2Icon } from "lucide-react";
import type { RefObject } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
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
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatInputProps = {
  input: string;
  status: ChatStatus;
  autoPlayback: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onAutoPlaybackToggle: () => void;
  onSubmit: (message: PromptInputMessage) => void;
};

export function ChatInput({
  input,
  status,
  autoPlayback,
  textareaRef,
  onInputChange,
  onAutoPlaybackToggle,
  onSubmit,
}: ChatInputProps) {
  return (
    <PromptInput className="mt-4" globalDrop multiple onSubmit={onSubmit}>
      <PromptInputHeader>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => onInputChange(e.target.value)}
          ref={textareaRef}
          value={input}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <Tooltip>
            <TooltipTrigger asChild>
              <PromptInputButton
                onClick={onAutoPlaybackToggle}
                variant={autoPlayback ? "default" : "ghost"}
              >
                <Volume2Icon className="size-4" />
              </PromptInputButton>
            </TooltipTrigger>
            <TooltipContent>Audio playback</TooltipContent>
          </Tooltip>
          <PromptInputSpeechButton
            onTranscriptionChange={(text) => onInputChange(text)}
            textareaRef={textareaRef}
          />
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </PromptInputTools>
        <PromptInputSubmit disabled={!(input || status)} status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}
