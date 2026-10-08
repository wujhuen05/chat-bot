import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';

const app = createApp({ openaiApiKey: process.env.OPENAI_API_KEY });
const port = Number(process.env.PORT) || 3000;

const server = createServer(app);
server.listen(port, () => {
  console.log(`AI chat app is running at http://localhost:${port}`);
});

export { app, server };
