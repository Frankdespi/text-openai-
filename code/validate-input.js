const body = $json.body;

const fail = (code, message) => ({
  json: {
    valid: false,
    httpCode: 400,
    body: { status: "error", error: { code, message } }
  }
});

if (body === null || typeof body !== "object" || Array.isArray(body)) {
  return fail("invalid_input", "Send a JSON object, for example {\"text\": \"your text\"}.");
}
if (!("text" in body)) {
  return fail("missing_field", "The field \"text\" is required.");
}
if (typeof body.text !== "string") {
  return fail("wrong_type", "The field \"text\" must be a string.");
}

const text = body.text.trim();

if (text.length === 0) {
  return fail("empty_text", "The field \"text\" must not be empty.");
}
if (text.length > 4000) {
  return fail("text_too_long", "The field \"text\" must be 4000 characters or fewer.");
}

return { json: { valid: true, text } }
