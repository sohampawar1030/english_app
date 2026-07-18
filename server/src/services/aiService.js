const BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://opencode.ai/zen/v1').replace(/\/$/, '');
const OPENCODE_API = `${BASE_URL}/chat/completions`;
const MODEL = process.env.DEEPSEEK_MODEL || 'hy3-free';

class AIService {
  get apiKey() {
    return process.env.DEEPSEEK_API_KEY;
  }

  async generate(prompt, systemPrompt = '', temperature = 0.7, maxTokens = 2000) {
    try {
      const response = await fetch(OPENCODE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (!response.ok) {
        console.error('AI API Error Response:', JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || data.error || `AI API returned ${response.status}`);
      }
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      throw error;
    }
  }

  async generateStory(words, userLevel = 'intermediate') {
    const systemPrompt = `You are an expert English story writer. Create engaging, natural stories that incorporate specific vocabulary words. Always respond in valid JSON format.`;
    const prompt = `Create an English story using these words: ${words.join(', ')}. 
User level: ${userLevel}.

Return JSON:
{
  "title": "Story title",
  "content": "Full story with these words naturally integrated",
  "marathiTranslation": "Full Marathi translation",
  "hindiTranslation": "Full Hindi translation",
  "grammarExplanation": "Key grammar points used in the story",
  "vocabularyHighlight": [{"word": "...", "meaning": "...", "sentence": "..."}],
  "difficultyLevel": "${userLevel}",
  "readingTime": estimated reading time in seconds
}`;
    const result = await this.generate(prompt, systemPrompt, 0.8, 3000);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async correctGrammar(text) {
    const systemPrompt = `You are an expert English grammar teacher. Analyze and correct English text. Always respond in valid JSON.`;
    const prompt = `Correct this English text and provide detailed feedback: "${text}"

Return JSON:
{
  "original": "${text}",
  "corrected": "corrected version",
  "mistakes": [{"original": "...", "corrected": "...", "explanation": "...", "type": "grammar|spelling|vocabulary|style"}],
  "score": overall score out of 100,
  "suggestions": ["suggestion1", "suggestion2"],
  "advancedVersion": "more sophisticated version"
}`;
    const result = await this.generate(prompt, systemPrompt, 0.3, 1500);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async chatWithTeacher(message, history = [], weaknesses = {}) {
    const systemPrompt = `You are a personal AI English teacher. Your role:
- Correct grammar mistakes naturally
- Suggest better vocabulary
- Teach in a conversational way
- Ask questions to keep learning going
- Track weaknesses and focus on them
- Be encouraging but precise
- Adapt to the user's English level

User's known weaknesses: ${JSON.stringify(weaknesses)}`;

    const messages = history.slice(-10);
    messages.push({ role: 'user', content: message });

    try {
      const response = await fetch(OPENCODE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `Chat failed: ${response.status}`);

      const content = data.choices[0].message.content;

      const grammarCheck = await this.correctGrammar(message).catch(() => null);

      return {
        reply: content,
        grammarCorrections: grammarCheck?.mistakes || [],
        suggestions: grammarCheck?.suggestions || []
      };
    } catch (error) {
      console.error('Chat Error:', error.message);
      throw error;
    }
  }

  async generateInterviewQuestions(type, role = '', level = 'intermediate') {
    const systemPrompt = `You are an expert interview coach. Generate realistic interview questions. Always respond in valid JSON.`;
    const prompt = `Generate a mock ${type} interview for a ${role} position at ${level} level.

Return JSON:
{
  "role": "${role}",
  "questions": [
    {
      "question": "question text",
      "expectedKeywords": ["keyword1", "keyword2"],
      "difficulty": "easy|medium|hard",
      "category": "technical|behavioral|hr"
    }
  ]
}`;
    const result = await this.generate(prompt, systemPrompt, 0.7, 2000);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async analyzeSpeaking(transcript, expectedText = '') {
    const systemPrompt = `You are an expert in English pronunciation and speaking analysis. Always respond in valid JSON.`;
    const prompt = `Analyze this English speech transcript: "${transcript}"
${expectedText ? `Expected text: "${expectedText}"` : ''}

Return JSON:
{
  "fluencyScore": score 0-100,
  "confidenceScore": score 0-100,
  "speedAnalysis": {"wordsPerMinute": number, "assessment": "..."},
  "pauseAnalysis": {"naturalPauses": number, "awkwardPauses": number, "assessment": "..."},
  "accentAnalysis": {"noticedAccents": ["..."], "clarity": "..."},
  "suggestions": ["suggestion1", "suggestion2"],
  "grammarMistakes": [{"original": "...", "corrected": "..."}]
}`;
    const result = await this.generate(prompt, systemPrompt, 0.3, 1500);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async improveWriting(text, writingType = 'general') {
    const systemPrompt = `You are an expert English writing coach. Improve writing quality. Always respond in valid JSON.`;
    const prompt = `Improve this ${writingType} writing: "${text}"

Return JSON:
{
  "original": "${text}",
  "improved": "improved version",
  "grammarCheck": [{"issue": "...", "fix": "..."}],
  "vocabularySuggestions": [{"word": "basic", "suggested": "advanced", "context": "..."}],
  "score": score out of 100,
  "suggestions": ["suggestion1", "suggestion2"]
}`;
    const result = await this.generate(prompt, systemPrompt, 0.4, 2000);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async generateReadingContent(type, level = 'intermediate', interests = []) {
    const systemPrompt = `You are an expert content creator for English learners. Create engaging reading material. Always respond in valid JSON.`;
    const prompt = `Create a ${type} reading passage for ${level} level English learner.
${interests.length ? `Topics of interest: ${interests.join(', ')}` : ''}

Return JSON:
{
  "title": "title",
  "content": "reading content (300-500 words)",
  "difficultyLevel": "${level}",
  "vocabularyWords": [{"word": "...", "meaning": "..."}],
  "comprehensionQuestions": [{"question": "...", "answer": "..."}],
  "estimatedReadingTime": number in seconds
}`;
    const result = await this.generate(prompt, systemPrompt, 0.8, 3000);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async analyzeInterviewAnswer(question, answer, type = 'general') {
    const systemPrompt = `You are an expert interview coach. Analyze interview answers. Always respond in valid JSON.`;
    const prompt = `Question: "${question}"
Answer: "${answer}"
Interview type: ${type}

Return JSON:
{
  "feedback": "detailed feedback",
  "score": score 0-100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "suggestedAnswer": "improved version",
  "vocabularyScore": score 0-100,
  "grammarScore": score 0-100,
  "confidenceScore": score 0-100,
  "keywordsUsed": ["keyword1"],
  "missedKeywords": ["keyword1"]
}`;
    const result = await this.generate(prompt, systemPrompt, 0.4, 2000);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async generateWordExplanation(word, context = {}) {
    const systemPrompt = `You are an expert English vocabulary teacher. Create comprehensive word explanations. Always respond in valid JSON.`;
    const prompt = `Explain this English word comprehensively: "${word}"
${Object.entries(context).length ? `Context: ${JSON.stringify(context)}` : ''}

Return JSON:
{
  "word": "${word}",
  "ipaPronunciation": "/.../",
  "marathiMeaning": "मराठी अर्थ",
  "hindiMeaning": "हिंदी अर्थ",
  "englishMeaning": "English definition",
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1", "antonym2"],
  "rootWord": "root word",
  "wordFamily": ["word1", "word2"],
  "partOfSpeech": "noun|verb|adjective|adverb",
  "examples": ["example1", "example2", "example3"],
  "interviewExamples": ["interview example1"],
  "businessExamples": ["business example1"]
}`;
    const result = await this.generate(prompt, systemPrompt, 0.5, 1500);
    return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  }

  async generateComprehensiveWordAnalysis(word) {
    const systemPrompt = `You are an expert English-Marathi bilingual vocabulary teacher. Always respond with ONLY valid JSON. Never use markdown code fences.`;
    const prompt = `Analyze the English word "${word}" and return ONLY valid JSON (no markdown, no \`\`\`).

{
  "word": "${word}",
  "marathiMeaning": "primary Marathi meaning",
  "englishMeaning": "English definition",
  "ipaPronunciation": "/pronunciation/",
  "partOfSpeech": "noun|verb|adjective|adverb",
  "whenToUse": "2-3 sentence explanation of usage contexts",

  "realLifeSentences": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "corporateSentences": [
    {"english": "business sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "presentTense": {
    "usageExplanation": "present tense usage explanation",
    "sentences": [
      {"english": "present tense sentence", "marathi": "मराठी भाषांतर"}
    ]
  },
  "pastTense": {
    "usageExplanation": "past tense usage explanation",
    "sentences": [
      {"english": "past tense sentence", "marathi": "मराठी भाषांतर"}
    ]
  },
  "futureTense": {
    "usageExplanation": "future tense usage explanation",
    "sentences": [
      {"english": "future tense sentence", "marathi": "मराठी भाषांतर"}
    ]
  }
}

Requirements:
- Provide exactly 5 sentences for each of the 5 categories (realLife, corporate, present, past, future)
- Every sentence must use the word "${word}" naturally
- Every sentence must have an accurate Marathi translation
- Keep sentences practical and natural`;

    const result = await this.generate(prompt, systemPrompt, 0.5, 4000);

    const cleaned = result
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error('AI response did not contain valid JSON');

    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }

  async generateWordSentences(word) {
    const systemPrompt = `You are an expert English grammar teacher. Always respond with ONLY valid JSON. Never use markdown code fences.`;
    const prompt = `Generate example sentences for the English word "${word}" across different tenses. Return ONLY valid JSON (no markdown, no \`\`\`).

{
  "word": "${word}",
  "simplePresent": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "presentContinuous": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "presentPerfect": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "simplePast": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "pastContinuous": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "pastPerfect": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "simpleFuture": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "futureContinuous": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ],
  "futurePerfect": [
    {"english": "sentence with ${word}", "marathi": "मराठी भाषांतर"}
  ]
}

Requirements:
- Provide exactly 5 sentences for each of the 9 tenses
- Every sentence must use "${word}" naturally
- Every sentence must have an accurate Marathi translation
- Keep sentences practical, short, and natural`;

    const result = await this.generate(prompt, systemPrompt, 0.5, 5000);

    const cleaned = result
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error('AI response did not contain valid JSON');

    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

export default new AIService();
