package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"

	"monorepo/server/internal/model"
)

type orgResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
	Role string `json:"role"`
}

// Me returns a handler that returns the current user and their organizations.
// Requires the Auth middleware to have set user_id in context.
func Me(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		userName := c.GetString("user_name")
		userEmail := c.GetString("user_email")

		var members []model.OrganizationMember
		err := db.NewSelect().
			Model(&members).
			Relation("Organization").
			Where("organization_member.user_id = ?", userID).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusInternalServerError, "failed to fetch organizations")
			return
		}

		orgs := make([]orgResponse, 0, len(members))
		for _, m := range members {
			orgs = append(orgs, orgResponse{
				ID:   m.OrganizationID.String(),
				Name: m.Organization.Name,
				Slug: m.Organization.Slug,
				Role: m.Role,
			})
		}

		Success(c, gin.H{
			"user": gin.H{
				"id":    userID,
				"name":  userName,
				"email": userEmail,
			},
			"organizations": orgs,
		})
	}
}
