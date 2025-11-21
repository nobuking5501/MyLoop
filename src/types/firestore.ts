/**
 * TypeScript types for Firestore data models
 * Based on the spec in claude-helper.md section 4
 */

import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  name: string
  email: string
  roles: ('user' | 'admin' | 'superadmin')[]
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface Contact {
  id?: string
  ownerRef: string
  name: string
  lineId?: string
  email?: string
  phone?: string
  tags: string[]
  status: 'active' | 'inactive' | 'unsubscribed'
  customFields?: Record<string, any>
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface ScenarioStep {
  offsetDays: number
  time: string // HH:mm format
  templateId: string
  conditions?: {
    tags?: string[]
    customField?: {
      field: string
      operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan'
      value: any
    }
  }
}

export interface Scenario {
  id?: string
  ownerRef: string
  name: string
  description?: string
  steps: ScenarioStep[]
  active: boolean
  triggerTag?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface TemplateFolder {
  id?: string
  ownerRef: string
  name: string
  description?: string
  color?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface MessageTemplate {
  id?: string
  ownerRef: string
  folderId?: string // Reference to TemplateFolder
  name: string
  body: string
  variables: string[] // e.g., ['{{name}}', '{{date}}']
  channel: 'line' | 'email' | 'sms'
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface Event {
  id?: string
  ownerRef: string
  type: 'booking' | 'webinar' | 'consultation' | 'other'
  title: string
  description?: string
  start: Timestamp
  end: Timestamp
  zoomUrl?: string
  zoomMeetingId?: string
  zoomPassword?: string
  attendeeRef?: string // Contact ID
  attendeeName?: string
  attendeeEmail?: string
  attendeePhone?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  reminderSent?: boolean
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface FunnelDaily {
  id?: string
  ownerRef: string
  date: string // YYYY-MM-DD format
  lpViews: number
  lineRegs: number
  bookings: number
  purchases: number
  revenue?: number
  createdAt: Timestamp
}

export interface Recommendation {
  id?: string
  ownerRef: string
  date: string // YYYY-MM-DD format
  scope: 'ads' | 'scenarios' | 'crm' | 'general'
  issue: string
  suggestion: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'applied' | 'dismissed'
  createdAt: Timestamp
}

export interface Integration {
  id?: string
  ownerRef: string
  provider: 'line' | 'google' | 'zoom' | 'sheets' | 'stripe' | 'meta' | 'google_ads'
  config: Record<string, any>
  active: boolean
  lastSync?: Timestamp
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface AuditLog {
  id?: string
  ownerRef: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Timestamp
}

export interface Student {
  id?: string
  name: string
  email: string
  tasks: {
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'review' | 'done'
    assignedAt: Timestamp
    completedAt?: Timestamp
  }[]
  notes?: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

// ==================== LP (Landing Page) Related Types ====================

/**
 * 画像アセット（画像ライブラリ）
 */
export interface ImageAsset {
  id?: string
  ownerRef: string
  name: string
  url: string // Firebase Storage URL
  category?: 'logo' | 'hero' | 'profile' | 'product' | 'background' | 'other'
  size: number // bytes
  width?: number
  height?: number
  mimeType: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

/**
 * LPセクションのタイプ定義
 */
export type LPSectionType =
  | 'hero' // ヒーロー（ファーストビュー）
  | 'problem' // 問題提起
  | 'benefit' // ベネフィット
  | 'features' // 特徴・機能
  | 'proof' // 実績・証拠
  | 'testimonial' // お客様の声
  | 'profile' // プロフィール
  | 'faq' // よくある質問
  | 'cta' // Call to Action
  | 'pricing' // 価格表
  | 'comparison' // 比較表
  | 'timeline' // タイムライン
  | 'custom' // カスタムセクション

/**
 * LPセクション
 */
export interface LPSection {
  id: string // セクション固有ID
  type: LPSectionType
  order: number // 表示順序（0から始まる）
  title?: string
  subtitle?: string
  body?: string // メインテキスト（Markdown対応）
  imageId?: string // ImageAsset への参照
  imagePosition?: 'left' | 'right' | 'top' | 'bottom' | 'background'
  ctaText?: string // ボタンテキスト
  ctaUrl?: string // ボタンリンク先
  items?: { // リスト形式のコンテンツ（features, faq等）
    title?: string
    description?: string
    icon?: string
    imageId?: string
  }[]
  backgroundColor?: string // 背景色（Tailwind class or hex）
  textColor?: string // テキスト色
  visible: boolean // 表示/非表示
  settings?: Record<string, any> // セクション固有の設定
}

/**
 * ランディングページ
 */
export interface LandingPage {
  id?: string
  ownerRef: string
  title: string // LP名（管理用）
  slug: string // URL用スラッグ（例: "seminar-2024-spring"）
  description?: string // LP説明（管理用）
  sections: LPSection[] // セクションの配列（order順にソート済み）
  status: 'draft' | 'published' | 'archived' // ステータス
  publishedAt?: Timestamp // 公開日時
  seoTitle?: string // SEOタイトル
  seoDescription?: string // SEOディスクリプション
  ogImage?: string // OGP画像URL
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
  settings?: {
    imageMode: 'with-images' | 'text-only' // 画像あり/テキストのみモード
    enableTracking?: boolean // アクセス解析
    trackingId?: string // GA4等のID
  }
  stats?: {
    views: number // 閲覧数
    lineRegistrations: number // LINE登録数
    bookings: number // 予約数
  }
  createdAt: Timestamp
  updatedAt?: Timestamp
}
