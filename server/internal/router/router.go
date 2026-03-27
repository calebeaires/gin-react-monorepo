package router

import (
	"io/fs"

	authula "github.com/Authula/authula"
	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"

	"monorepo/server/internal/handler"
	"monorepo/server/internal/middleware"
)

// New creates a configured Gin engine with all routes and middleware.
// If staticFiles is provided, the frontend is served from the embedded filesystem.
func New(auth *authula.Auth, db *bun.DB, staticFiles fs.FS) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())

	// Auth routes (Authula handles sign-up, sign-in, sign-out, me)
	r.Any("/auth/*path", gin.WrapH(auth.Handler()))

	// Public API routes
	r.GET("/api/health", handler.Health())
	r.GET("/api/message", handler.Message())

	// Authenticated API routes (Bearer session token)
	authed := r.Group("/api", middleware.Auth(db))
	{
		authed.GET("/me", handler.Me(db))

		// Organization management
		authed.POST("/orgs", handler.CreateOrg(db))
		authed.GET("/orgs", handler.ListOrgs(db))
		authed.GET("/orgs/:slug", handler.GetOrg(db))
		authed.PATCH("/orgs/:slug", handler.UpdateOrg(db))
		authed.DELETE("/orgs/:slug", handler.DeleteOrg(db))
		authed.POST("/orgs/:slug/members", handler.AddMember(db))
		authed.DELETE("/orgs/:slug/members/:userId", handler.RemoveMember(db))
		authed.PATCH("/orgs/:slug/members/:userId", handler.UpdateMemberRole(db))
	}

	// Tenant-scoped API routes (Bearer + tenant middleware)
	tenant := r.Group("/api/t", middleware.Auth(db), middleware.Tenant(db))
	{
		tenant.GET("/status", handler.TenantStatus())
	}

	// Serve embedded frontend in production
	if staticFiles != nil {
		r.NoRoute(handler.Static(staticFiles))
	}

	return r
}
