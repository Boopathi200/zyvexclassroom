const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

function fallbackReply(message, user) {
  const m = message.toLowerCase();
  const role = user.role;
  const tips = [
    'Tip: Use **Overview** to see your class roster and join code.',
    'Tip: Open **Assignments** to download materials or upload your submission.',
    'Tip: **Quizzes** supports one attempt per quiz — read carefully before submitting.',
    'Tip: Visit **Schedule** (`/dashboard/schedule`) for live sessions across your classes.',
    'Tip: **Analytics** (`/dashboard/analytics`) summarizes your marks and completion (students).',
    'Tip: **Profile** (`/dashboard/settings`) lets you switch light/dark theme.',
  ];
  if (/navigate|where|how do i|how to|link|page|route/.test(m)) {
    return `Here is a quick map for your **${role}** workspace:\n- Dashboard: \`/dashboard\`\n- Notifications: \`/dashboard/notifications\`\n- Schedule & live classes: \`/dashboard/schedule\`\n- Student analytics: \`/dashboard/analytics\`\n- Profile & theme: \`/dashboard/settings\`\n\n${tips[0]}`;
  }
  if (/assignment|submit|upload/.test(m)) {
    return `For assignments: open your class → **Assignments** tab. Teachers upload briefs; students attach a file and it saves as your submission.\n\n${tips[1]}`;
  }
  if (/quiz|test|exam/.test(m)) {
    return `Quizzes live under each class → **Quizzes**. Students see options without correct answers until after submit. You get **one attempt** per quiz.\n\n${tips[2]}`;
  }
  if (/live|video call|meet|jitsi|session/.test(m)) {
    return `Live classes: go to **Schedule** or your class → **Live** tab. Teachers **Start session** to go live; everyone can **Join** the secure meeting room.\n\n${tips[3]}`;
  }
  if (/lecture|recording|video library|watch/.test(m)) {
    return `Lecture videos are under each class → **Videos** tab. Teachers drag-and-drop uploads; use **Subject** to organize the library.\n\n${tips[4]}`;
  }
  if (/mark|grade|score|analytics|performance/.test(m)) {
    return `Marks appear per class under **Marks** (and charts under **Insights**). Students can open **Analytics** for cross-class performance.\n\n${tips[4]}`;
  }
  if (/attendance|present|absent/.test(m)) {
    return `Attendance: teachers mark a date in the **Attendance** tab; **Insights** adds charts (monthly bars + breakdown).\n\n${tips[0]}`;
  }
  if (/theme|dark|light|profile|settings/.test(m)) {
    return `Open **Profile & settings** at \`/dashboard/settings\` to rename your account and toggle **dark / light** luxury theme.\n\n${tips[5]}`;
  }
  return `I am the **Zyvex assistant**. Ask me about assignments, quizzes, live classes, videos, attendance, analytics, or navigation.\n\n${tips.join('\n')}`;
}

async function openAiReply(message, history, user) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const system = `You are Zyvex Classroom, a premium LMS assistant. The user role is "${user.role}". Be concise, friendly, and actionable. When pointing to UI, use short paths like /dashboard, /dashboard/schedule, /dashboard/analytics, /dashboard/settings. Never invent grades; explain where to find them in the app.`;
    const safeHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter((h) => h && typeof h.content === 'string')
          .map((h) => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.content.slice(0, 4000),
          }))
      : [];
    const messages = [
      { role: 'system', content: system },
      ...safeHistory,
      { role: 'user', content: message },
    ];
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.4,
    });
    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('OpenAI chat error', e.message);
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'message is required' });
    }
    const trimmed = message.trim().slice(0, 4000);
    let reply = await openAiReply(trimmed, history, req.user);
    if (!reply) reply = fallbackReply(trimmed, req.user);
    const suggestions = [
      'How do I submit an assignment?',
      'Where are live classes scheduled?',
      'Show me how to read my analytics.',
    ];
    res.json({ reply, suggestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
