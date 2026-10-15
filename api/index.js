module.exports = async (req, res) => {
  const { request, version } = req.body || {};
  const userQuery = request?.original_utterance || request?.command || '';

  if (!userQuery.trim()) {
    return res.status(200).json({
      response: { text: 'Алиса на сверхбыстром движке Groq готова к работе!', end_session: false },
      version: version || '1.0'
    });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ response: { text: 'Ошибка: GROQ_API_KEY не задан в Vercel.', end_session: false }, version: '1.0' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Ультрабыстрая модель (отклик < 0.4 сек)
        messages: [
          { role: 'system', content: 'Ты голосовой помощник Алиса. Отвечай кратко, живым языком, без спецсимволов, звездочек и списков.' },
          { role: 'user', content: userQuery }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();

    // Безопасная проверка: если сервер вернул ошибку, скрипт не упадет
    if (!response.ok || !data.choices || !data.choices[0]) {
      const errMsg = data?.error?.message || 'Неизвестная ошибка API';
      return res.status(200).json({
        response: { text: `Ошибка Groq: ${errMsg}`, end_session: false },
        version: '1.0'
      });
    }

    const replyText = data.choices[0].message?.content || 'Пустой ответ.';
    const cleanReply = replyText.replace(/[*#`_]/g, '');

    return res.status(200).json({
      response: { text: cleanReply, end_session: false },
      version: '1.0'
    });

  } catch (e) {
    return res.status(200).json({ response: { text: `Сбой сервера: ${e.message}`, end_session: false }, version: '1.0' });
  }
};
