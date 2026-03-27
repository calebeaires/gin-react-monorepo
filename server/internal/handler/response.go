package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ApiResponse is the standard response envelope for all API endpoints.
type ApiResponse struct {
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

// Success sends a 200 response with data.
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, ApiResponse{Data: data})
}

// Created sends a 201 response with data.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, ApiResponse{Data: data})
}

// Msg sends a 200 response with a message.
func Msg(c *gin.Context, message string) {
	c.JSON(http.StatusOK, ApiResponse{Message: message})
}

// Err sends an error response with the given status code.
func Err(c *gin.Context, status int, message string) {
	c.JSON(status, ApiResponse{Error: message})
}
