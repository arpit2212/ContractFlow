package models

import "time"

type ContractStatus string

const (
	StatusDraft   ContractStatus = "draft"
	StatusSent    ContractStatus = "sent"
	StatusSigned  ContractStatus = "signed"
	StatusExpired ContractStatus = "expired"
)

type Contract struct {
	ID          string         `json:"id" db:"id"`
	UserID      string         `json:"user_id" db:"user_id"`
	Title       string         `json:"title" db:"title"`
	Content     string         `json:"content" db:"content"`
	Status      ContractStatus `json:"status" db:"status"`
	PandaDocID  *string        `json:"panda_doc_id" db:"panda_doc_id"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at" db:"updated_at"`
}
