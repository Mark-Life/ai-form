import type { ToolUIPart } from "ai";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { getFillManyMessage, getUpdateFieldMessage } from "@/lib/utils";

type ToolMessageProps = {
  part: ToolUIPart;
  messageId: string;
  index: number;
};

export function ToolMessage({ part, messageId, index }: ToolMessageProps) {
  if (
    part.type !== "tool-updateField" &&
    part.type !== "tool-submitForm" &&
    part.type !== "tool-fillMany"
  ) {
    return null;
  }

  const toolPart = part as unknown as {
    type: "tool-updateField" | "tool-submitForm" | "tool-fillMany";
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

  let messageText: string;
  if (toolPart.type === "tool-updateField") {
    messageText = getUpdateFieldMessage(
      toolPart.input,
      toolPart.output,
      toolPart.errorText
    );
  } else if (toolPart.type === "tool-fillMany") {
    messageText = getFillManyMessage(toolPart.output, toolPart.errorText);
  } else {
    messageText = "Form submitted";
  }

  return (
    <Message from="assistant" key={`${messageId}-${index}`}>
      <MessageContent>
        <Response className="text-muted-foreground text-sm">
          {messageText}
        </Response>
      </MessageContent>
    </Message>
  );
}
