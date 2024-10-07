package middleware

import (
	"net/http"

	"admin-api/config"

	"github.com/auth0-community/go-auth0"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gopkg.in/square/go-jose.v2"
)

func Auth0Middleware(cfg config.Auth0Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger := zap.L()
		client := auth0.NewJWKClient(auth0.JWKClientOptions{URI: cfg.Domain + "/.well-known/jwks.json"}, nil)
		configuration := auth0.NewConfiguration(client, []string{cfg.Audience}, cfg.Domain, jose.RS256)
		validator := auth0.NewValidator(configuration, nil)

		token, err := validator.ValidateRequest(c.Request)

		if err != nil {
			logger.Warn("Invalid token", zap.Error(err))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// logger.Info("Token validated", zap.String("user", token.Claims["sub"].(string)))
		c.Set("token", token)
		c.Next()
	}
}
