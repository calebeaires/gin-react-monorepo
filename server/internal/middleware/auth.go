package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

// authSession represents a row in Authula's sessions table.
type authSession struct {
	bun.BaseModel `bun:"table:sessions"`

	ID        string    `bun:"id,pk"`
	UserID    string    `bun:"user_id"`
	Token     string    `bun:"token"`
	ExpiresAt time.Time `bun:"expires_at"`
}

// authUser represents a row in Authula's users table.
type authUser struct {
	bun.BaseModel `bun:"table:users"`

	ID    string `bun:"id,pk"`
	Name  string `bun:"name"`
	Email string `bun:"email"`
}

// Auth returns middleware that validates a Bearer session token from the
// Authorization header by querying the shared sessions table directly.
// On success, sets user_id, user_name, and user_email in the Gin context.
func Auth(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractBearerToken(c)
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}

		ctx := c.Request.Context()

		// The token from the sign-in response is already the hashed
		// value stored in the DB, so we match it directly.
		var session authSession
		err := db.NewSelect().
			Model(&session).
			Where("token = ?", token).
			Where("expires_at > ?", time.Now()).
			Scan(ctx)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		// Fetch user details
		var user authUser
		err = db.NewSelect().
			Model(&user).
			Where("id = ?", session.UserID).
			Scan(ctx)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		c.Set("user_id", user.ID)
		c.Set("user_name", user.Name)
		c.Set("user_email", user.Email)
		c.Next()
	}
}

func extractBearerToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if header == "" {
		return ""
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}
