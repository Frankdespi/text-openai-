// Runs the three n8n Code node scripts outside n8n, with sample inputs.
// Usage: node tests/code-nodes.test.js
//
// n8n runs each script once per item and gives it the item as $json.
// Here, each script is wrapped in a function that receives $json the same way.
// The OpenAI call itself is not tested, because it needs a real API credential.

const fs = require("fs");
const path = require("path");
const assert = require("assert");

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, "..", "code", file), "utf8");
  const run = new Function("$json", source);
  return (json) => run(json).json;
}

const validateInput = load("validate-input.js");
const shapeResult = load("shape-result.js");
const apiError = load("api-error.js");

const cases = [];
function test(name, fn) { cases.push({ name, fn }); }

// ---- Validate Input -------------------------------------------------------

test("valid text passes and is trimmed", () => {
  const out = validateInput({ body: { text: "  The service was great.  " } });
  assert.deepStrictEqual(out, { valid: true, text: "The service was great." });
});

test("text of exactly 4000 characters passes", () => {
  const out = validateInput({ body: { text: "a".repeat(4000) } });
  assert.strictEqual(out.valid, true);
});

test("missing body returns 400 invalid_input", () => {
  const out = validateInput({});
  assert.strictEqual(out.valid, false);
  assert.strictEqual(out.httpCode, 400);
  assert.strictEqual(out.body.error.code, "invalid_input");
});

test("array body returns 400 invalid_input", () => {
  const out = validateInput({ body: ["text"] });
  assert.strictEqual(out.httpCode, 400);
  assert.strictEqual(out.body.error.code, "invalid_input");
});

test("object without a text field returns 400 missing_field", () => {
  const out = validateInput({ body: {} });
  assert.strictEqual(out.httpCode, 400);
  assert.strictEqual(out.body.error.code, "missing_field");
});

test("text that is not a string returns 400 wrong_type", () => {
  const out = validateInput({ body: { text: 123 } });
  assert.strictEqual(out.httpCode, 400);
  assert.strictEqual(out.body.error.code, "wrong_type");
});

test("text with only spaces returns 400 empty_text", () => {
  const out = validateInput({ body: { text: "   " } });
  assert.strictEqual(out.httpCode, 400);
  assert.strictEqual(out.body.error.code, "empty_text");
});

test("text of 4001 characters returns 400 text_too_long", () => {
  const out = validateInput({ body: { text: "a".repeat(4001) } });
  assert.strictEqual(out.httpCode, 400);
  assert.strictEqual(out.body.error.code, "text_too_long");
});

// ---- Shape Result ---------------------------------------------------------

test("readable AI answer returns 200 success", () => {
  const answer = { summary: "The customer liked the service.", category: "praise" };
  const out = shapeResult({ choices: [{ message: { content: JSON.stringify(answer) } }] });
  assert.strictEqual(out.httpCode, 200);
  assert.deepStrictEqual(out.body, { status: "success", result: answer });
});

test("AI answer that is not JSON returns 502 bad_ai_output", () => {
  const out = shapeResult({ choices: [{ message: { content: "Sorry, I cannot help." } }] });
  assert.strictEqual(out.httpCode, 502);
  assert.strictEqual(out.body.error.code, "bad_ai_output");
});

test("response without choices returns 502 bad_ai_output", () => {
  const out = shapeResult({});
  assert.strictEqual(out.httpCode, 502);
  assert.strictEqual(out.body.error.code, "bad_ai_output");
});

// ---- API Error ------------------------------------------------------------

test("API Error returns 502 api_error", () => {
  const out = apiError({});
  assert.strictEqual(out.httpCode, 502);
  assert.strictEqual(out.body.status, "error");
  assert.strictEqual(out.body.error.code, "api_error");
});

// ---- Run ------------------------------------------------------------------

let failed = 0;
for (const { name, fn } of cases) {
  try {
    fn();
    console.log("PASS  " + name);
  } catch (e) {
    failed++;
    console.log("FAIL  " + name + "\n      " + e.message.split("\n")[0]);
  }
}
console.log(`\n${cases.length - failed} of ${cases.length} passed`);
process.exit(failed ? 1 : 0);
