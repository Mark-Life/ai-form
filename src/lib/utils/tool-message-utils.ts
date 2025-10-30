export function parseFillManyResults(
  result: unknown
): Record<
  string,
  | { success: true; value: string | number | boolean }
  | { success: false; error: string }
> | null {
  try {
    const parsedResult =
      typeof result === "string" ? JSON.parse(result) : result;

    if (
      parsedResult &&
      typeof parsedResult === "object" &&
      "results" in parsedResult &&
      typeof parsedResult.results === "object"
    ) {
      return parsedResult.results as Record<
        string,
        | { success: true; value: string | number | boolean }
        | { success: false; error: string }
      >;
    }
  } catch {
    // Silently ignore parsing errors
  }
  return null;
}

export function isSuccessfulFieldResult(
  fieldResult: unknown
): fieldResult is { success: true; value: string | number | boolean } {
  return (
    fieldResult !== null &&
    typeof fieldResult === "object" &&
    "success" in fieldResult &&
    fieldResult.success === true &&
    "value" in fieldResult
  );
}

export function extractFieldNameFromObject(obj: unknown): string {
  if (obj && typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    if ("fieldName" in record && typeof record.fieldName === "string") {
      return record.fieldName;
    }
  }
  return "";
}

export function parseOutput(output: unknown): unknown {
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
}

export function extractErrorFromOutput(parsedOutput: unknown): string {
  if (
    parsedOutput &&
    typeof parsedOutput === "object" &&
    "error" in parsedOutput &&
    typeof parsedOutput.error === "string"
  ) {
    return parsedOutput.error;
  }
  return "";
}

export function checkOutputHasError(parsedOutput: unknown): boolean {
  return (
    parsedOutput !== null &&
    typeof parsedOutput === "object" &&
    "success" in parsedOutput &&
    parsedOutput.success === false
  );
}

export function getUpdateFieldMessage(
  toolInput: unknown,
  toolOutput: unknown,
  errorText?: string
): string {
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
}

export function extractFillManyResults(
  parsedOutput: unknown
): Record<
  string,
  | { success: true; value: string | number | boolean }
  | { success: false; error: string }
> | null {
  if (
    parsedOutput &&
    typeof parsedOutput === "object" &&
    "results" in parsedOutput &&
    typeof parsedOutput.results === "object"
  ) {
    return parsedOutput.results as Record<
      string,
      | { success: true; value: string | number | boolean }
      | { success: false; error: string }
    >;
  }
  return null;
}

export function buildFillManyStatusMessage(
  results: Record<
    string,
    | { success: true; value: string | number | boolean }
    | { success: false; error: string }
  >
): string {
  const successfulFields = Object.entries(results)
    .filter(([, result]) => result.success)
    .map(([name]) => name);
  const failedFields = Object.entries(results)
    .filter(([, result]) => !result.success)
    .map(([name, result]) => ({
      name,
      error: result.success === false ? result.error : "",
    }));

  if (successfulFields.length > 0 && failedFields.length === 0) {
    return `Updated fields: ${successfulFields.join(", ")}`;
  }
  if (successfulFields.length > 0 && failedFields.length > 0) {
    return `Updated: ${successfulFields.join(", ")}. Failed: ${failedFields.map((f) => `${f.name} (${f.error})`).join(", ")}`;
  }
  if (failedFields.length > 0) {
    return `Failed to update: ${failedFields.map((f) => `${f.name} (${f.error})`).join(", ")}`;
  }
  return "Updated multiple fields";
}

export function getFillManyMessage(
  toolOutput: unknown,
  errorText?: string
): string {
  if (errorText) {
    return `Failed to update multiple fields: ${errorText}`;
  }

  const parsedOutput = parseOutput(toolOutput);
  if (
    parsedOutput &&
    typeof parsedOutput === "object" &&
    "message" in parsedOutput &&
    typeof parsedOutput.message === "string"
  ) {
    return parsedOutput.message;
  }

  const results = extractFillManyResults(parsedOutput);
  if (results) {
    return buildFillManyStatusMessage(results);
  }

  return "Updated multiple fields";
}
