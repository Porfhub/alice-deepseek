module.exports = async (req, res) => {
  const { request, version } = req.body || {};
  const userQuery = request?.original_utterance || request?.command || '';

  if (!userQuery.trim()) {
    return res.status(200).json({ response: { text: 'Привет! На связи Gemini Pro.', end_session: false }, version: version || '1.0' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       return res.status(200).json({ response: { text: 'Ошибка: Ключ не найден.', end_session: false }, version: '1.0' });
    }

    // Изменили ссылку: теперь используется флагманская стабильная модель gemini-1.5-pro-latest
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Ты ассистент на Станции Алиса. Отвечай кратко, емко и понятным живым языком. Запрещено использовать списки, таблицы, форматирование и спецсимволы, так как ответ зачитывается голосом.' }] },
        contents: [{ parts: [{ text: userQuery }] }],
        generationConfig: { maxOutputTokens: 400 }
      })
    });

    const data = await response.json();

    if (!response.ok || !data.candidates) {
      return res.status(200).json({
        response: { text: `Ошибка Google: ${data.error?.message || 'Сбой'}`, end_session: false },
        version: version || '1.0'
      });
    }

    const replyText = data.candidates[0].content.parts[0].text.replace(/[*#`_]/g, '');
    return res.status(200).json({
      response: { text: replyText, end_session: false },
      version: version || '1.0'
    });
  } catch (e) {
    return res.status(200).json({ response: { text: `Ошибка сервера: ${e.message}`, end_session: false }, version: '1.0' });
  }
};
