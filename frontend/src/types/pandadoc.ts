export interface PandaDocRecipient {
  email: string
  first_name: string
  last_name: string
  role: string
  has_completed: boolean
}

export interface PandaDocDocument {
  id: string
  name: string
  status: string
  // status values from PandaDoc:
  // document.draft, document.sent, document.viewed, 
  // document.completed, document.declined, document.waiting_approval
  date_created: string
  date_modified: string
  expiration_date: string | null
  recipients?: PandaDocRecipient[]
  created_by?: {
    email: string
    first_name: string
    last_name: string
  }
}

export interface PandaDocTemplate {
  id: string
  name: string
  date_created: string
  date_modified: string
}

export interface PandaDocAnalytics {
  total: number
  draft: number
  sent: number
  viewed: number
  completed: number
  declined: number
}
