import type { ToolUIPart, UIMessage } from "ai";
import { useCallback, useEffect, useRef } from "react";
import type { Path, UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { isSuccessfulFieldResult, parseFillManyResults } from "@/lib/utils";

type ToolProcessorConfig<T extends z.ZodObject<z.ZodRawShape>> = {
  form: UseFormReturn<z.infer<T>>;
  formSchema: T;
  messages: UIMessage[];
  setSubmittedData: (data: z.infer<T>) => void;
};

export function useFormTools<T extends z.ZodObject<z.ZodRawShape>>({
  form,
  formSchema,
  messages,
  setSubmittedData,
}: ToolProcessorConfig<T>) {
  const processedToolResultsRef = useRef<Set<string>>(new Set());

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
            parsedResult.fieldName as Path<z.infer<T>>,
            parsedResult.value as never,
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
    [form, formSchema, setSubmittedData]
  );

  const processFillManyResult = useCallback(
    (result: unknown, toolResultId: string): void => {
      if (processedToolResultsRef.current.has(toolResultId)) {
        return;
      }
      processedToolResultsRef.current.add(toolResultId);

      const results = parseFillManyResults(result);
      if (!results) {
        return;
      }

      // Update form fields for successful results
      for (const [fieldName, fieldResult] of Object.entries(results)) {
        if (isSuccessfulFieldResult(fieldResult)) {
          form.setValue(
            fieldName as Path<z.infer<T>>,
            fieldResult.value as never,
            {
              shouldValidate: true,
            }
          );
        }
      }
    },
    [form]
  );

  const handleUpdateFieldTool = useCallback(
    (part: ToolUIPart, messageId: string) => {
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
    },
    [processUpdateFieldResult]
  );

  const handleSubmitFormTool = useCallback(
    (part: ToolUIPart, messageId: string) => {
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
    },
    [processSubmitFormResult]
  );

  const handleFillManyTool = useCallback(
    (part: ToolUIPart, messageId: string) => {
      const toolPart = part as unknown as {
        type: "tool-fillMany";
        toolCallId: string;
        state: string;
        output?: unknown;
      };
      const toolResultId = `${messageId}-${toolPart.toolCallId}`;
      if (toolPart.state === "output-available" && toolPart.output) {
        processFillManyResult(toolPart.output, toolResultId);
      }
    },
    [processFillManyResult]
  );

  const processToolPart = useCallback(
    (part: ToolUIPart, messageId: string) => {
      if (part.type === "tool-updateField") {
        handleUpdateFieldTool(part, messageId);
      } else if (part.type === "tool-submitForm") {
        handleSubmitFormTool(part, messageId);
      } else if (part.type === "tool-fillMany") {
        handleFillManyTool(part, messageId);
      }
    },
    [handleUpdateFieldTool, handleSubmitFormTool, handleFillManyTool]
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
          part.type === "tool-submitForm" ||
          part.type === "tool-fillMany"
        ) {
          processToolPart(part, message.id);
        }
      }
    }
  }, [messages, processToolPart]);

  return {
    clearProcessedResults: () => {
      processedToolResultsRef.current.clear();
    },
  };
}
