package config

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"

	authula "github.com/Authula/authula"
	authulaconfig "github.com/Authula/authula/config"
	authulamodels "github.com/Authula/authula/models"
	emailpasswordplugin "github.com/Authula/authula/plugins/email-password"
	emailpasswordtypes "github.com/Authula/authula/plugins/email-password/types"
	emailplugin "github.com/Authula/authula/plugins/email"
	emailtypes "github.com/Authula/authula/plugins/email/types"
	sessionplugin "github.com/Authula/authula/plugins/session"

	_ "github.com/lib/pq"
)

const (
	DefaultPort    = ":8081"
	DefaultBaseURL = "http://localhost:8081"
)

// NewDB creates a Bun database connection to Postgres using DATABASE_URL.
func NewDB() *bun.DB {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	sqlDB, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(10 * time.Minute)

	return bun.NewDB(sqlDB, pgdialect.New())
}

// NewAuth creates and configures an Authula instance with email/password
// and session plugins. Uses the shared Postgres connection for storage.
func NewAuth(db bun.IDB) *authula.Auth {
	cfg := authulaconfig.NewConfig(
		authulaconfig.WithAppName("GinReactMonorepo"),
		authulaconfig.WithBaseURL(BaseURL()),
		authulaconfig.WithBasePath("/auth"),
		authulaconfig.WithSecret(os.Getenv("AUTHULA_SECRET")),
		authulaconfig.WithDatabase(authulamodels.DatabaseConfig{
			Provider: "postgres",
			URL:      os.Getenv("DATABASE_URL"),
		}),
	)

	return authula.New(&authula.AuthConfig{
		Config: cfg,
		DB:     db,
		Plugins: []authulamodels.Plugin{
			emailplugin.New(emailtypes.EmailPluginConfig{
				Enabled:     true,
				Provider:    emailtypes.ProviderSMTP,
				FromAddress: "noreply@localhost",
				SMTP: &emailtypes.SMTPConfig{
					Host: "localhost",
					Port: 1025,
				},
			}),
			emailpasswordplugin.New(emailpasswordtypes.EmailPasswordPluginConfig{
				Enabled:                  true,
				MinPasswordLength:        8,
				MaxPasswordLength:        32,
				RequireEmailVerification: false,
				AutoSignIn:               true,
			}),
			sessionplugin.New(sessionplugin.SessionPluginConfig{
				Enabled: true,
			}),
		},
	})
}

// Port returns the server port from PORT env var or the default.
func Port() string {
	if p := os.Getenv("PORT"); p != "" {
		return ":" + p
	}
	return DefaultPort
}

// BaseURL returns the server base URL from AUTHULA_BASE_URL env var or the default.
func BaseURL() string {
	if url := os.Getenv("AUTHULA_BASE_URL"); url != "" {
		return url
	}
	return DefaultBaseURL
}
