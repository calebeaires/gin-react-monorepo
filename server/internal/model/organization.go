package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Organization struct {
	bun.BaseModel `bun:"table:organizations"`

	ID        uuid.UUID `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	Name      string    `json:"name" bun:"name,notnull"`
	Slug      string    `json:"slug" bun:"slug,notnull,unique"`
	CreatedAt time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt time.Time `json:"updated_at" bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}
