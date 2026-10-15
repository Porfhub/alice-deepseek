module.exports = async (req, res) => {
  const { request, version } = req.body || {};
  const userQuery = request?.original_utterance || request?.command || '';

  // Новая стартовая фраза для проверки обновления кэша
  if (!userQuery.trim()) {
    return res.status(200).json({ response: { text: 'Система обновлена. Слушаю вас.', end_session: false }, version: version || '1.0' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       return res.status(200).json({ response: { text: 'Ошибка: ключ API не задан в настройках Vercel.', end_session: false }, version: '1.0' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Ты голосовой ассистент Алиса. Отвечай кратко, без списков и спецсимволов.' }] },
        contents: [{ parts: [{ text: userQuery }] }],
        generationConfig: { maxOutputTokens: 400 }
      })
    });

    const data = await response.json();

    // Жесткий перехват любых ошибок от Google
    if (!response.ok) {
      return res.status(200).json({ response: { text: `Ошибка API: ${data.error?.message || JSON.stringify(data)}`, end_session: false }, version: '1.0' });
    }

    if (!data.candidates || data.candidates.length === 0) {
       return res.status(200).json({ response: { text: 'Пустой ответ от серверов Google.', end_session: false }, version: '1.0' });
    }

    const replyText = data.candidates[0].content.parts[0].text.replace(/[*#`_]/g, '');
    return res.status(200).json({ response: { text: replyText, end_session: false }, version: '1.0' });

  } catch (e) {
    return res.status(200).json({ response: { text: `Сбой скрипта: ${e.message}`, end_session: false }, version: '1.0' });
  }
};
