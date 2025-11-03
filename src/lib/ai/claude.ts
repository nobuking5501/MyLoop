import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
})

export interface MessageGenerationParams {
  purpose: string
  tone: 'formal' | 'casual' | 'friendly' | 'professional'
  length: 'short' | 'medium' | 'long'
  context?: string
  targetAudience?: string
}

export async function generateMessage(params: MessageGenerationParams): Promise<string> {
  const { purpose, tone, length, context, targetAudience } = params

  const lengthInstructions = {
    short: '50〜100文字程度の短いメッセージ',
    medium: '150〜250文字程度の中程度のメッセージ',
    long: '300〜500文字程度の詳しいメッセージ',
  }

  const toneInstructions = {
    formal: '丁寧で格式のある',
    casual: 'カジュアルで親しみやすい',
    friendly: '友好的で温かみのある',
    professional: 'プロフェッショナルで信頼感のある',
  }

  const prompt = `
あなたはLINEステップ配信のメッセージライターです。以下の条件に基づいてメッセージを作成してください。

【目的】
${purpose}

【トーン】
${toneInstructions[tone]}

【長さ】
${lengthInstructions[length]}

${targetAudience ? `【対象者】\n${targetAudience}\n` : ''}

${context ? `【追加コンテキスト】\n${context}\n` : ''}

【制約事項】
- 日本語で作成
- 絵文字は適度に使用（1〜3個程度）
- 行動を促す明確なCTA（Call To Action）を含める
- 自然で読みやすい文章
- URLプレースホルダーは {{url}} の形式で表記
- 名前などの変数は {{name}} の形式で表記

上記の条件を満たすLINEメッセージを作成してください。メッセージ本文のみを出力し、説明や前置きは不要です。
`.trim()

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    return textContent.text.trim()
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error('メッセージ生成に失敗しました')
  }
}

export async function improveMessage(originalMessage: string, instruction: string): Promise<string> {
  const prompt = `
以下のLINEメッセージを改善してください。

【元のメッセージ】
${originalMessage}

【改善指示】
${instruction}

【制約事項】
- 日本語で作成
- 元のメッセージの意図を保持
- 絵文字は適度に使用
- 変数（{{name}}, {{url}}など）は保持
- メッセージ本文のみを出力

改善したメッセージを出力してください。
`.trim()

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    return textContent.text.trim()
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error('メッセージ改善に失敗しました')
  }
}
