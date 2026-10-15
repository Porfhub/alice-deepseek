module.exports = async (req, res) => {
  const { request, version } = req.body || {};
  const userQuery = request?.original_utterance || request?.command || '';

  if (!userQuery.trim()) {
    return res.status(200).json({ response: { text: 'Алиса на базе Qwen готова к работе.', end_session: false }, version: version || '1.0' });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
       return res.status(200).json({ response: { text: 'Ошибка: ключ OPENROUTER не найден.', end_session: false }, version: '1.0' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://alice-skill.com',
        'X-Title': 'Alice Bot'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct:free',
        messages: [
          { role: 'system', content: 'Ты голосовой помощник Алиса. Отвечай кратко, емко, без спецсимволов, звездочек и списков.' },
          { role: 'user', content: userQuery }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ response: { text: `Ошибка OpenRouter: ${data.error?.message || 'Сбой'}`, end_session: false }, version: '1.0' });
    }

    const replyText = data.choices[0].message.content.replace(/[*#`_]/g, '');
    return res.status(200).json({ response: { text: replyText, end_session: false }, version: '1.0' });

  } catch (e) {
    return res.status(200).json({ response: { text: `Сбой сервера: ${e.message}`, end_session: false }, version: '1.0' });
  }
};
