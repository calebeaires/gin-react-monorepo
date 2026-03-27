package handler

import (
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/uptrace/bun"

	"monorepo/server/internal/migrate"
	"monorepo/server/internal/model"
)

var slugRegex = regexp.MustCompile(`^[a-z][a-z0-9-]{1,48}[a-z0-9]$`)

// CreateOrg creates a new organization, adds the current user as owner,
// and creates the tenant schema.
func CreateOrg(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")

		var req struct {
			Name string `json:"name" binding:"required"`
			Slug string `json:"slug" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			Err(c, http.StatusBadRequest, "name and slug are required")
			return
		}

		if !slugRegex.MatchString(req.Slug) {
			Err(c, http.StatusBadRequest, "slug must be 3-50 chars, lowercase alphanumeric and hyphens, start with letter")
			return
		}

		ctx := c.Request.Context()
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			Err(c, http.StatusInternalServerError, "internal error")
			return
		}
		defer tx.Rollback()

		org := &model.Organization{
			ID:   uuid.New(),
			Name: req.Name,
			Slug: req.Slug,
		}
		_, err = tx.NewInsert().Model(org).Exec(ctx)
		if err != nil {
			Err(c, http.StatusConflict, "organization slug already exists")
			return
		}

		member := &model.OrganizationMember{
			ID:             uuid.New(),
			OrganizationID: org.ID,
			UserID:         userID,
			Role:           "owner",
		}
		_, err = tx.NewInsert().Model(member).Exec(ctx)
		if err != nil {
			Err(c, http.StatusInternalServerError, "failed to add owner")
			return
		}

		if err := migrate.CreateTenantSchema(ctx, tx, req.Slug); err != nil {
			Err(c, http.StatusInternalServerError, "failed to create tenant schema")
			return
		}

		if err := tx.Commit(); err != nil {
			Err(c, http.StatusInternalServerError, "internal error")
			return
		}

		Created(c, gin.H{"organization": org})
	}
}

// ListOrgs returns all organizations the current user belongs to.
func ListOrgs(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")

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

		orgs := make([]gin.H, 0, len(members))
		for _, m := range members {
			orgs = append(orgs, gin.H{
				"id":   m.OrganizationID.String(),
				"name": m.Organization.Name,
				"slug": m.Organization.Slug,
				"role": m.Role,
			})
		}

		Success(c, gin.H{"organizations": orgs})
	}
}

// GetOrg returns a single organization by slug (member only).
func GetOrg(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		slug := c.Param("slug")

		var member model.OrganizationMember
		err := db.NewSelect().
			Model(&member).
			Relation("Organization").
			Where("organization_member.user_id = ?", userID).
			Where("organization.slug = ?", slug).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusNotFound, "organization not found")
			return
		}

		// Fetch all members of this org
		var members []model.OrganizationMember
		err = db.NewSelect().
			Model(&members).
			Where("organization_id = ?", member.OrganizationID).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusInternalServerError, "failed to fetch members")
			return
		}

		memberList := make([]gin.H, 0, len(members))
		for _, m := range members {
			memberList = append(memberList, gin.H{
				"id":      m.ID.String(),
				"user_id": m.UserID,
				"role":    m.Role,
			})
		}

		Success(c, gin.H{
			"organization": gin.H{
				"id":         member.OrganizationID.String(),
				"name":       member.Organization.Name,
				"slug":       member.Organization.Slug,
				"created_at": member.Organization.CreatedAt,
			},
			"members":   memberList,
			"your_role": member.Role,
		})
	}
}

// UpdateOrg updates an organization's name (owner/admin only).
func UpdateOrg(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		slug := c.Param("slug")

		var member model.OrganizationMember
		err := db.NewSelect().
			Model(&member).
			Relation("Organization").
			Where("organization_member.user_id = ?", userID).
			Where("organization.slug = ?", slug).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusNotFound, "organization not found")
			return
		}

		if member.Role != "owner" && member.Role != "admin" {
			Err(c, http.StatusForbidden, "only owners and admins can update the organization")
			return
		}

		var req struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			Err(c, http.StatusBadRequest, "name is required")
			return
		}

		_, err = db.NewUpdate().
			Model((*model.Organization)(nil)).
			Set("name = ?", req.Name).
			Set("updated_at = ?", time.Now()).
			Where("id = ?", member.OrganizationID).
			Exec(c.Request.Context())
		if err != nil {
			Err(c, http.StatusInternalServerError, "failed to update organization")
			return
		}

		Msg(c, "organization updated")
	}
}

// DeleteOrg deletes an organization, its members, and its tenant schema (owner only).
func DeleteOrg(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		slug := c.Param("slug")

		var member model.OrganizationMember
		err := db.NewSelect().
			Model(&member).
			Relation("Organization").
			Where("organization_member.user_id = ?", userID).
			Where("organization.slug = ?", slug).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusNotFound, "organization not found")
			return
		}

		if member.Role != "owner" {
			Err(c, http.StatusForbidden, "only the owner can delete the organization")
			return
		}

		ctx := c.Request.Context()
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			Err(c, http.StatusInternalServerError, "internal error")
			return
		}
		defer tx.Rollback()

		if err := migrate.DropTenantSchema(ctx, tx, slug); err != nil {
			Err(c, http.StatusInternalServerError, "failed to drop tenant schema")
			return
		}

		_, err = tx.NewDelete().
			Model((*model.Organization)(nil)).
			Where("id = ?", member.OrganizationID).
			Exec(ctx)
		if err != nil {
			Err(c, http.StatusInternalServerError, "failed to delete organization")
			return
		}

		if err := tx.Commit(); err != nil {
			Err(c, http.StatusInternalServerError, "internal error")
			return
		}

		Msg(c, "organization deleted")
	}
}

// AddMember adds a user to an organization by email (owner/admin only).
func AddMember(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		slug := c.Param("slug")

		var member model.OrganizationMember
		err := db.NewSelect().
			Model(&member).
			Relation("Organization").
			Where("organization_member.user_id = ?", userID).
			Where("organization.slug = ?", slug).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusNotFound, "organization not found")
			return
		}

		if member.Role != "owner" && member.Role != "admin" {
			Err(c, http.StatusForbidden, "only owners and admins can add members")
			return
		}

		var req struct {
			UserID string `json:"user_id" binding:"required"`
			Role   string `json:"role"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			Err(c, http.StatusBadRequest, "user_id is required")
			return
		}

		role := req.Role
		if role == "" {
			role = "member"
		}
		if role != "member" && role != "admin" {
			Err(c, http.StatusBadRequest, "role must be member or admin")
			return
		}

		newMember := &model.OrganizationMember{
			ID:             uuid.New(),
			OrganizationID: member.OrganizationID,
			UserID:         req.UserID,
			Role:           role,
		}
		_, err = db.NewInsert().Model(newMember).Exec(c.Request.Context())
		if err != nil {
			Err(c, http.StatusConflict, "user is already a member")
			return
		}

		Created(c, gin.H{"member": newMember})
	}
}

// RemoveMember removes a user from an organization (owner/admin only).
func RemoveMember(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		slug := c.Param("slug")
		targetUserID := c.Param("userId")

		var member model.OrganizationMember
		err := db.NewSelect().
			Model(&member).
			Relation("Organization").
			Where("organization_member.user_id = ?", userID).
			Where("organization.slug = ?", slug).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusNotFound, "organization not found")
			return
		}

		if member.Role != "owner" && member.Role != "admin" {
			Err(c, http.StatusForbidden, "only owners and admins can remove members")
			return
		}

		if targetUserID == userID && member.Role == "owner" {
			Err(c, http.StatusBadRequest, "owner cannot remove themselves")
			return
		}

		result, err := db.NewDelete().
			Model((*model.OrganizationMember)(nil)).
			Where("organization_id = ?", member.OrganizationID).
			Where("user_id = ?", targetUserID).
			Exec(c.Request.Context())
		if err != nil {
			Err(c, http.StatusInternalServerError, "failed to remove member")
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			Err(c, http.StatusNotFound, "member not found")
			return
		}

		Msg(c, "member removed")
	}
}

// UpdateMemberRole changes a member's role (owner only).
func UpdateMemberRole(db *bun.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		slug := c.Param("slug")
		targetUserID := c.Param("userId")

		var member model.OrganizationMember
		err := db.NewSelect().
			Model(&member).
			Relation("Organization").
			Where("organization_member.user_id = ?", userID).
			Where("organization.slug = ?", slug).
			Scan(c.Request.Context())
		if err != nil {
			Err(c, http.StatusNotFound, "organization not found")
			return
		}

		if member.Role != "owner" {
			Err(c, http.StatusForbidden, "only the owner can change roles")
			return
		}

		var req struct {
			Role string `json:"role" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			Err(c, http.StatusBadRequest, "role is required")
			return
		}

		if req.Role != "member" && req.Role != "admin" {
			Err(c, http.StatusBadRequest, "role must be member or admin")
			return
		}

		result, err := db.NewUpdate().
			Model((*model.OrganizationMember)(nil)).
			Set("role = ?", req.Role).
			Set("updated_at = ?", time.Now()).
			Where("organization_id = ?", member.OrganizationID).
			Where("user_id = ?", targetUserID).
			Exec(c.Request.Context())
		if err != nil {
			Err(c, http.StatusInternalServerError, "failed to update role")
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			Err(c, http.StatusNotFound, "member not found")
			return
		}

		Msg(c, "role updated")
	}
}
