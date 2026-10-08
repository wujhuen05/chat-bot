import express from 'express';
import OpenAI from 'openai';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    '너는 항상 친근한 친구처럼 답변해야 한다. 딱딱하거나 지나치게 공식적인 말투를 피하고, 자연스럽고 편안한 한국어로 대화한다. 사용자를 친한 친구처럼 대하되 무례하거나 과도하게 가볍지는 않게 답변한다.',
};

export function createApp({
  createChatCompletion,
  openaiApiKey,
} = {}) {
  const app = express();
  const memory = new Map();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static('public'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/chat', async (req, res) => {
    const message = String(req.body?.message ?? '').trim();

    if (!message) {
      return res.status(400).json({ error: '메시지를 입력해 주세요.' });
    }

    const sessionId = String(req.body?.sessionId ?? 'default');
    const history = memory.get(sessionId) ?? [];
    const messages = [
      SYSTEM_PROMPT,
      ...history,
      { role: 'user', content: message },
    ];

    try {
      const openai = openaiApiKey
        ? new OpenAI({ apiKey: openaiApiKey })
        : new OpenAI();
      const completion = createChatCompletion
        ? await createChatCompletion({ messages })
        : await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
          });

      const reply = completion.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        throw new Error('OpenAI returned an empty response.');
      }

      memory.set(sessionId, [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ]);

      return res.json({ reply });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'AI 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: '요청한 페이지를 찾을 수 없습니다.' });
  });

  app.localPort = 0;
  return app;
}
