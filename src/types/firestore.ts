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
