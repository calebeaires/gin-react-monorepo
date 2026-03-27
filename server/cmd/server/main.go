package main

import (
	"context"
	"embed"
	"io/fs"
	"log"

	"github.com/joho/godotenv"

	"monorepo/server/internal/config"
	"monorepo/server/internal/migrate"
	"monorepo/server/internal/router"
)

//go:embed static/*
var embeddedFiles embed.FS

func main() {
	_ = godotenv.Load() // Load .env if present (no error if missing)

	db := config.NewDB()
	auth := config.NewAuth(db)

	if err := migrate.RunPublicMigrations(context.Background(), db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Serve embedded frontend if static/ was populated at build time
	var staticFiles fs.FS
	if entries, _ := fs.ReadDir(embeddedFiles, "static"); len(entries) > 0 {
		staticFiles, _ = fs.Sub(embeddedFiles, "static")
	}

	r := router.New(auth, db, staticFiles)

	log.Printf("Server starting on %s", config.Port())
	if err := r.Run(config.Port()); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
