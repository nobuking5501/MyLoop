import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { WebhookEvent, MessageEvent, FollowEvent } from '@line/bot-sdk'

const db = admin.firestore()

/**
 * LINE Webhook Handler
 * LINE MessagingAPIからのWebhookを処理
 */
export const lineWebhook = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    // Signature validation (production環境では必須)
    // const signature = req.headers['x-line-signature'] as string
    // TODO: Implement signature validation

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    try {
      const events: WebhookEvent[] = req.body.events || []

      // 各イベントを並列処理
      await Promise.all(events.map((event) => handleEvent(event)))

      res.status(200).send('OK')
    } catch (error) {
      console.error('Webhook error:', error)
      res.status(500).send('Internal Server Error')
    }
  })

/**
 * イベントタイプごとの処理
 */
async function handleEvent(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case 'follow':
      await handleFollow(event)
      break
    case 'unfollow':
      await handleUnfollow(event)
      break
    case 'message':
      await handleMessage(event)
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

/**
 * フォロー時の処理
 */
async function handleFollow(event: FollowEvent): Promise<void> {
  const userId = event.source.userId
  if (!userId) return

  try {
    // コンタクトを作成または更新
    const contactRef = db.collection('contacts').doc(userId)
    const contactDoc = await contactRef.get()

    if (!contactDoc.exists) {
      // 新規コンタクト作成
      await contactRef.set({
        lineId: userId,
        name: '',
        tags: ['新規登録'],
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // ownerRefは後でLINE設定から取得する必要がある
        ownerRef: '',
      })

      console.log(`New contact created: ${userId}`)

      // トリガータグ「新規登録」のシナリオを検索して開始
      await triggerScenariosByTag(userId, '新規登録')
    } else {
      // 既存コンタクトをアクティブに
      await contactRef.update({
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`Contact reactivated: ${userId}`)
    }
  } catch (error) {
    console.error('Handle follow error:', error)
  }
}

/**
 * アンフォロー時の処理
 */
async function handleUnfollow(event: WebhookEvent): Promise<void> {
  const userId = event.source.userId
  if (!userId) return

  try {
    const contactRef = db.collection('contacts').doc(userId)
    await contactRef.update({
      status: 'inactive',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`Contact deactivated: ${userId}`)
  } catch (error) {
    console.error('Handle unfollow error:', error)
  }
}

/**
 * メッセージ受信時の処理
 */
async function handleMessage(event: MessageEvent): Promise<void> {
  const userId = event.source.userId
  if (!userId) return

  // TODO: メッセージ内容に応じた自動応答
  // TODO: キーワード検出によるタグ付与やシナリオトリガー

  console.log(`Message received from ${userId}:`, event.message)
}

/**
 * タグに基づいてシナリオをトリガー
 */
async function triggerScenariosByTag(
  contactId: string,
  tag: string
): Promise<void> {
  try {
    // タグに一致するアクティブなシナリオを検索
    const scenariosSnapshot = await db
      .collection('scenarios')
      .where('active', '==', true)
      .where('triggerTag', '==', tag)
      .get()

    if (scenariosSnapshot.empty) {
      console.log(`No active scenarios found for tag: ${tag}`)
      return
    }

    // 各シナリオのステップを予約
    const promises = scenariosSnapshot.docs.map(async (scenarioDoc) => {
      const scenario = scenarioDoc.data()
      const steps = scenario.steps || []

      for (const step of steps) {
        const scheduledTime = new Date()
        scheduledTime.setDate(scheduledTime.getDate() + step.offsetDays)
        const [hours, minutes] = step.time.split(':')
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        // メッセージキューに追加
        await db.collection('message_queue').add({
          contactId,
          scenarioId: scenarioDoc.id,
          templateId: step.templateId,
          scheduledAt: admin.firestore.Timestamp.fromDate(scheduledTime),
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }

      console.log(
        `Scenario ${scenarioDoc.id} triggered for contact ${contactId}`
      )
    })

    await Promise.all(promises)
  } catch (error) {
    console.error('Trigger scenarios error:', error)
  }
}
