module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('Alice Webhook for Gemini is running');
  }

  const { request, version } = req.body || {};
  const userQuery = request?.original_utterance || request?.command || '';

  if (!userQuery.trim()) {
    return res.status(200).json({
      response: { text: 'Привет! На связи Gemini. О чем хотите поговорить?', end_session: false },
      version: version || '1.0'
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // Используем самую быструю модель 1.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'Ты — ассистент на Станции Алиса. Отвечай кратко, емко и понятным языком. Запрещено использовать списки, таблицы, форматирование, спецсимволы (*, #, _), так как ответ зачитывается голосом.' }]
        },
        contents: [{ parts: [{ text: userQuery }] }],
        generationConfig: { maxOutputTokens: 400 }
      })
    });

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не удалось получить ответ от Gemini.';
    const cleanReply = replyText.replace(/[*#`_]/g, '');

    return res.status(200).json({
      response: { text: cleanReply, end_session: false },
      version: version || '1.0'
    });
  } catch (error) {
    console.error(error);
    return res.status(200).json({
      response: { text: 'Произошла ошибка при обращении к серверу.', end_session: false },
      version: version || '1.0'
    });
  }
};
