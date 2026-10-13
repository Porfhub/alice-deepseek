module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('Alice Webhook is active');
  }

  const { request, version } = req.body || {};
  const userQuery = request?.original_utterance || request?.command || '';

  if (!userQuery.trim()) {
    return res.status(200).json({
      response: {
        text: 'Привет! На связи DeepSeek. О чем хотите поговорить?',
        end_session: false
      },
      version: version || '1.0'
    });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Ты — ассистент DeepSeek, отвечающий голосом через Станцию Алисы. Отвечай кратко, понятным живым языком. Не используй списки, таблицы, жирный шрифт, спецсимволы, код и формулы, так как твой ответ будет зачитываться голосом.'
          },
          { role: 'user', content: userQuery }
        ],
        max_tokens: 400
      })
    });

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || 'Не удалось получить ответ от нейросети.';
    const cleanReply = replyText.replace(/[*#`_]/g, '');

    return res.status(200).json({
      response: {
        text: cleanReply,
        end_session: false
      },
      version: version || '1.0'
    });
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    return res.status(200).json({
      response: {
        text: 'Произошла ошибка при связи с нейросетью.',
        end_session: false
      },
      version: version || '1.0'
    });
  }
};
