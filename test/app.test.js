import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../app.js';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    '너는 항상 친근한 친구처럼 답변해야 한다. 딱딱하거나 지나치게 공식적인 말투를 피하고, 자연스럽고 편안한 한국어로 대화한다. 사용자를 친한 친구처럼 대하되 무례하거나 과도하게 가볍지는 않게 답변한다.',
};

function startTestApp() {
  const app = createApp({
    createChatCompletion: async () => ({
      choices: [{ message: { content: '테스트 답변입니다.' } }],
    }),
    openaiApiKey: 'test-api-key',
  });
  const server = app.listen(0);
  app.localPort = server.address().port;

  return new Promise((resolve) => {
    server.once('listening', () => resolve({ app, server }));
  });
}

async function stopTestApp({ server }) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('GET /health returns the server status', async (t) => {
  const { app, server } = await startTestApp();
  t.after(() => stopTestApp({ server }));

  const response = await fetch(`http://127.0.0.1:${app.localPort}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('POST /api/chat returns the model response and keeps conversation history', async (t) => {
  const { app, server } = await startTestApp();
  t.after(() => stopTestApp({ server }));

  const firstResponse = await fetch(`http://127.0.0.1:${app.localPort}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '안녕하세요!' }),
  });

  assert.equal(firstResponse.status, 200);
  assert.deepEqual(await firstResponse.json(), { reply: '테스트 답변입니다.' });

  const secondResponse = await fetch(`http://127.0.0.1:${app.localPort}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '이전 답변을 기억하나요?' }),
  });

  assert.equal(secondResponse.status, 200);
  assert.deepEqual(await secondResponse.json(), { reply: '테스트 답변입니다.' });
});

test('POST /api/chat always prepends the system message before chat history', async (t) => {
  let requestMessages;
  const { app, server } = await new Promise((resolve) => {
    const testApp = createApp({
      createChatCompletion: async ({ messages }) => {
        requestMessages = messages;
        return { choices: [{ message: { content: '테스트 답변입니다.' } }] };
      },
      openaiApiKey: 'test-api-key',
    });
    const testServer = testApp.listen(0, () => {
      testApp.localPort = testServer.address().port;
      resolve({ app: testApp, server: testServer });
    });
  });
  t.after(() => stopTestApp({ server }));

  await fetch(`http://127.0.0.1:${app.localPort}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '첫 번째 질문', sessionId: 'system-order-test' }),
  });

  await fetch(`http://127.0.0.1:${app.localPort}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '두 번째 질문', sessionId: 'system-order-test' }),
  });

  assert.deepEqual(requestMessages[0], SYSTEM_PROMPT);
  assert.equal(requestMessages[1].role, 'user');
  assert.equal(requestMessages[2].role, 'assistant');
  assert.equal(requestMessages[3].role, 'user');
});

test('POST /api/chat rejects empty messages', async (t) => {
  const { app, server } = await startTestApp();
  t.after(() => stopTestApp({ server }));

  const response = await fetch(`http://127.0.0.1:${app.localPort}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '   ' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: '메시지를 입력해 주세요.' });
});
