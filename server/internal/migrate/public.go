package migrate

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"

	"monorepo/server/internal/model"
)

// RunPublicMigrations creates the organization tables in the public schema.
func RunPublicMigrations(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*model.Organization)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("creating organizations table: %w", err)
	}

	_, err = db.NewCreateTable().
		Model((*model.OrganizationMember)(nil)).
		IfNotExists().
		ForeignKey(`("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE`).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("creating organization_members table: %w", err)
	}

	// Unique constraint on (organization_id, user_id)
	_, err = db.NewCreateIndex().
		Model((*model.OrganizationMember)(nil)).
		Index("idx_org_members_org_user").
		Column("organization_id", "user_id").
		Unique().
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("creating unique index on organization_members: %w", err)
	}

	return nil
}
