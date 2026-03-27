package handler

import (
	"github.com/gin-gonic/gin"
)

// TenantStatus returns the current tenant context.
// Used to verify schema isolation is working correctly.
func TenantStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		Success(c, gin.H{
			"org_id":   c.GetString("org_id"),
			"org_slug": c.GetString("org_slug"),
			"schema":   "tenant_" + c.GetString("org_slug"),
			"role":     c.GetString("org_role"),
		})
	}
}
