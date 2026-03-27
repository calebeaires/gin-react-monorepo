package migrate

import (
	"context"
	"fmt"

	"github.com/lib/pq"
	"github.com/uptrace/bun"
)

// CreateTenantSchema creates a new Postgres schema for the given org slug.
func CreateTenantSchema(ctx context.Context, db bun.IDB, slug string) error {
	schemaName := "tenant_" + slug
	query := fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", pq.QuoteIdentifier(schemaName))
	_, err := db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("creating schema %s: %w", schemaName, err)
	}
	return nil
}

// DropTenantSchema drops the Postgres schema for the given org slug and all its contents.
func DropTenantSchema(ctx context.Context, db bun.IDB, slug string) error {
	schemaName := "tenant_" + slug
	query := fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", pq.QuoteIdentifier(schemaName))
	_, err := db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("dropping schema %s: %w", schemaName, err)
	}
	return nil
}
