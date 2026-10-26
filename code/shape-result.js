try {
  const content = $json.choices[0].message.content;
  const parsed = JSON.parse(content);
  return { json: { httpCode: 200, body: { status: "success", result: parsed } } };
} catch (e) {
  return {
    json: {
      httpCode: 502,
      body: {
        status: "error",
        error: {
          code: "bad_ai_output",
          message: "The AI service returned an answer that could not be read. Please try again."
        }
      }
    }
  };
}
