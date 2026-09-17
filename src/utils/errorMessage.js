export function extractApiErrorMessage(error, fallbackMessage = "Something went wrong") {
  if (!error) return fallbackMessage;

  const responseData = error?.response?.data;
  if (responseData) {
    if (typeof responseData.message === "string" && responseData.message.trim()) {
      return responseData.message;
    }
    if (typeof responseData.error === "string" && responseData.error.trim()) {
      return responseData.error;
    }
    if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      return responseData.errors.join(", ");
    }
    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
