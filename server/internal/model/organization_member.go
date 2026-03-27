package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type OrganizationMember struct {
	bun.BaseModel `bun:"table:organization_members"`

	ID             uuid.UUID `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	OrganizationID uuid.UUID `json:"organization_id" bun:"organization_id,notnull,type:uuid"`
	UserID         string    `json:"user_id" bun:"user_id,notnull"`
	Role           string    `json:"role" bun:"role,notnull,default:'member'"`
	CreatedAt      time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt      time.Time `json:"updated_at" bun:"updated_at,nullzero,notnull,default:current_timestamp"`

	Organization *Organization `json:"organization,omitempty" bun:"rel:belongs-to,join:organization_id=id"`
}
