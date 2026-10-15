module.exports = async (req, res) => {
  const { request, version } = req.body || {};
  const userQuery = request?.original_utterance || request?.command || '';

  if (!userQuery.trim()) {
    return res.status(200).json({ response: { text: 'Привет! На связи Gemini.', end_session: false }, version: version || '1.0' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       return res.status(200).json({ response: { text: 'Отладка: Ключ GEMINI_API_KEY не найден в настройках Vercel.', end_session: false }, version: '1.0' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }]
      })
    });

    const data = await response.json();

    // Если Google отклонил запрос, выводим причину прямо в чат Алисы
    if (!response.ok || !data.candidates) {
      return res.status(200).json({
        response: { text: `Ошибка Google: ${data.error?.message || JSON.stringify(data)}`, end_session: false },
        version: version || '1.0'
      });
    }

    return res.status(200).json({
      response: { text: data.candidates[0].content.parts[0].text.replace(/[*#`_]/g, ''), end_session: false },
      version: version || '1.0'
    });
  } catch (e) {
    return res.status(200).json({ response: { text: `Системная ошибка сервера: ${e.message}`, end_session: false }, version: '1.0' });
  }
};
