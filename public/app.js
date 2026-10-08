const chat = document.querySelector('#chat');
const form = document.querySelector('#chat-form');
const input = document.querySelector('#message');
const sendButton = document.querySelector('#send-button');
const clearButton = document.querySelector('#clear-chat');
const status = document.querySelector('#status');
const sessionId = crypto.randomUUID();

function addMessage(role, content, loading = false) {
  const wrapper = document.createElement('article');
  wrapper.className = `message ${role}${loading ? ' loading' : ''}`;

  const roleName = role === 'user' ? '나' : 'AI';
  wrapper.innerHTML = `
    <div class="message-role">${roleName}</div>
    <div class="message-content">${content}</div>
  `;

  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
  return wrapper;
}

function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  sendButton.classList.toggle('loading', isLoading);
  input.disabled = isLoading;
}

function showStatus(message) {
  status.textContent = message;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = input.value.trim();

  if (!message) {
    input.focus();
    showStatus('메시지를 입력해 주세요.');
    return;
  }

  addMessage('user', escapeHtml(message));
  input.value = '';
  input.style.height = 'auto';
  setLoading(true);
  showStatus('AI가 답변을 생성하고 있습니다...');

  const loadingMessage = addMessage('assistant', '', true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
    }

    loadingMessage.querySelector('.message-content').textContent = data.reply;
    loadingMessage.classList.remove('loading');
    showStatus('답변을 받았습니다.');
  } catch (error) {
    loadingMessage.querySelector('.message-content').textContent = error.message;
    loadingMessage.classList.remove('loading');
    showStatus(error.message);
  } finally {
    setLoading(false);
    input.focus();
  }
});

clearButton.addEventListener('click', () => {
  chat.replaceChildren();
  showStatus('대화가 초기화되었습니다.');
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

showStatus('대화를 시작해 보세요.');
