/**
 * AI Response Analyzer
 * 
 * Uses OpenAI to analyze email responses and categorize them
 * for automated decision making.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ResponseAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'question' | 'out_of_office';
  category: 'interested' | 'not_interested' | 'needs_info' | 'meeting_request' | 'unsubscribe' | 'bounce' | 'other';
  confidenceScore: number; // 0.0 to 1.0
  summary: string;
  suggestedAction: 'reply_manually' | 'schedule_meeting' | 'send_info' | 'mark_interested' | 'mark_not_interested' | 'no_action';
  reasoning: string;
}

/**
 * Analyze an email response using OpenAI
 */
export async function analyzeEmailResponse(
  originalSubject: string,
  originalBody: string,
  responseSubject: string,
  responseBody: string
): Promise<ResponseAnalysis> {
  try {
    const systemPrompt = `You are an ultra-precise email response analyzer for a cold outreach system. **Accuracy is critical.**

Your task: Analyze email responses and classify them with high precision.

────────────────────────────────────────
OUTPUT FORMAT (JSON only, no markdown)
{
  "sentiment": "positive|negative|neutral|question|out_of_office",
  "category": "interested|not_interested|needs_info|meeting_request|unsubscribe|bounce|other",
  "confidenceScore": 0.85,
  "summary": "Brief 1-2 sentence summary",
  "suggestedAction": "reply_manually|schedule_meeting|send_info|mark_interested|mark_not_interested|no_action",
  "reasoning": "Why you chose this classification"
}
────────────────────────────────────────

### CLASSIFICATION RULES

**SENTIMENT:**
- positive: Interested, enthusiastic, wants to engage
- negative: Not interested, annoyed, wants to stop
- neutral: Informational, no clear emotion
- question: Asking for clarification or more info
- out_of_office: Automated away message

**CATEGORY:**
- interested: Wants to learn more, engage, or continue conversation
- not_interested: Explicitly declining or not interested
- needs_info: Asking questions, needs more details
- meeting_request: Wants to schedule a call/meeting
- unsubscribe: Wants to opt out or stop receiving emails
- bounce: Email bounced or delivery failure
- other: Doesn't fit other categories

**SUGGESTED ACTION:**
- reply_manually: Requires personal response (high priority)
- schedule_meeting: Send calendar link or meeting details
- send_info: Send requested information or materials
- mark_interested: Add to interested leads list
- mark_not_interested: Remove from campaign
- no_action: No follow-up needed

**CONFIDENCE SCORE:**
- 0.9-1.0: Very clear intent, obvious classification
- 0.7-0.89: Clear intent with minor ambiguity
- 0.5-0.69: Some ambiguity, reasonable guess
- 0.0-0.49: Highly ambiguous, uncertain

### PRIORITY PATTERNS

**High Priority (reply_manually):**
- Questions about product/service
- Requests for specific information
- Positive engagement with unclear next step
- Any response showing genuine interest

**Meeting Request:**
- "let's schedule", "can we talk", "set up a call"
- "available for a meeting", "calendar link"
- Any explicit request to meet or speak

**Unsubscribe:**
- "unsubscribe", "opt out", "remove me"
- "stop sending", "don't contact", "take me off"
- "not interested", "please stop"

**Out of Office:**
- "out of office", "away from", "on vacation"
- "will respond when I return"
- Automated reply patterns

### OUTPUT RULES
1. Return ONLY valid JSON—no markdown, no code blocks, no extra text
2. All keys must be present
3. confidenceScore must be 0.0 to 1.0
4. Never output \`\`\`json or any markdown formatting`;

    const userPrompt = `ORIGINAL EMAIL SENT:
Subject: ${originalSubject}
Body: ${originalBody.substring(0, 500)}

RESPONSE RECEIVED:
Subject: ${responseSubject}
Body: ${responseBody.substring(0, 1000)}

Analyze this response and classify it according to the rules above.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.2, // Very low temperature for consistent, precise analysis
      response_format: { type: 'json_object' }
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const analysis: ResponseAnalysis = JSON.parse(result);

    // Validate the response
    if (!analysis.sentiment || !analysis.category || !analysis.suggestedAction) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Ensure confidence score is between 0 and 1
    analysis.confidenceScore = Math.max(0, Math.min(1, analysis.confidenceScore));

    return analysis;

  } catch (error: any) {
    console.error('Error analyzing email response:', error);
    
    // Return a safe default analysis
    return {
      sentiment: 'neutral',
      category: 'other',
      confidenceScore: 0,
      summary: 'Unable to analyze response automatically',
      suggestedAction: 'reply_manually',
      reasoning: `Analysis failed: ${error.message}`
    };
  }
}

/**
 * Batch analyze multiple responses
 */
export async function batchAnalyzeResponses(
  responses: Array<{
    id: string;
    originalSubject: string;
    originalBody: string;
    responseSubject: string;
    responseBody: string;
  }>
): Promise<Map<string, ResponseAnalysis>> {
  const results = new Map<string, ResponseAnalysis>();

  // Process in parallel with rate limiting
  const batchSize = 5; // Process 5 at a time
  for (let i = 0; i < responses.length; i += batchSize) {
    const batch = responses.slice(i, i + batchSize);
    
    const analyses = await Promise.all(
      batch.map(async (response) => {
        const analysis = await analyzeEmailResponse(
          response.originalSubject,
          response.originalBody,
          response.responseSubject,
          response.responseBody
        );
        return { id: response.id, analysis };
      })
    );

    analyses.forEach(({ id, analysis }) => {
      results.set(id, analysis);
    });

    // Small delay between batches to avoid rate limits
    if (i + batchSize < responses.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Get human-readable explanation of analysis
 */
export function getAnalysisExplanation(analysis: ResponseAnalysis): string {
  const sentimentEmoji = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
    question: '❓',
    out_of_office: '🏖️'
  };

  const actionText = {
    reply_manually: 'You should reply to this personally',
    schedule_meeting: 'They want to schedule a meeting',
    send_info: 'Send them more information',
    mark_interested: 'Mark as interested lead',
    mark_not_interested: 'Mark as not interested',
    no_action: 'No action needed'
  };

  return `${sentimentEmoji[analysis.sentiment]} ${analysis.summary}

Category: ${analysis.category}
Confidence: ${(analysis.confidenceScore * 100).toFixed(0)}%
Suggested Action: ${actionText[analysis.suggestedAction]}

Reasoning: ${analysis.reasoning}`;
}

/**
 * Determine if response requires immediate attention
 */
export function requiresImmediateAttention(analysis: ResponseAnalysis): boolean {
  return (
    analysis.category === 'interested' ||
    analysis.category === 'meeting_request' ||
    (analysis.sentiment === 'question' && analysis.confidenceScore > 0.7) ||
    analysis.suggestedAction === 'reply_manually'
  );
}

/**
 * Get priority score for response (higher = more urgent)
 */
export function getResponsePriority(analysis: ResponseAnalysis): number {
  let priority = 0;

  // Sentiment scoring
  if (analysis.sentiment === 'positive') priority += 30;
  if (analysis.sentiment === 'question') priority += 20;
  if (analysis.sentiment === 'negative') priority += 10;

  // Category scoring
  if (analysis.category === 'interested') priority += 40;
  if (analysis.category === 'meeting_request') priority += 50;
  if (analysis.category === 'needs_info') priority += 25;
  if (analysis.category === 'not_interested') priority -= 20;

  // Confidence boost
  priority += analysis.confidenceScore * 10;

  return Math.max(0, priority);
}
