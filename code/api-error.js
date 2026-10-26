return {
  json: {
    httpCode: 502,
    body: {
      status: "error",
      error: {
        code: "api_error",
        message: "The AI service could not process the request. Please try again later."
      }
    }
  }
}
