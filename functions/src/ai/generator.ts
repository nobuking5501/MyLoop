import * as functions from 'firebase-functions'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: functions.config().claude?.api_key || process.env.CLAUDE_API_KEY,
})

/**
 * AI Message Generator (Callable Function)
 * フロントエンドから呼び出されるAI文案生成関数
 */
export const generateAIMessage = functions
  .region('asia-northeast1')
  .https.onCall(async (data, context) => {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required'
      )
    }

    const { purpose, tone, length, context: messageContext, targetAudience } = data

    if (!purpose) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Purpose is required'
      )
    }

    try {
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
${toneInstructions[tone] || toneInstructions.friendly}

【長さ】
${lengthInstructions[length] || lengthInstructions.medium}

${targetAudience ? `【対象者】\n${targetAudience}\n` : ''}

${messageContext ? `【追加コンテキスト】\n${messageContext}\n` : ''}

【制約事項】
- 日本語で作成
- 絵文字は適度に使用（1〜3個程度）
- 行動を促す明確なCTA（Call To Action）を含める
- 自然で読みやすい文章
- URLプレースホルダーは {{url}} の形式で表記
- 名前などの変数は {{name}} の形式で表記

上記の条件を満たすLINEメッセージを作成してください。メッセージ本文のみを出力し、説明や前置きは不要です。
`.trim()

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const textContent = response.content.find((block) => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response')
      }

      return { message: textContent.text.trim() }
    } catch (error: any) {
      console.error('AI generation error:', error)
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to generate message'
      )
    }
  })
