package middleware

import (
	"admin-api/config"
	"context"
	"errors"
	"net/http"
	"net/url"
	"time"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/gin-gonic/gin"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.uber.org/zap"
)

type JWTClaims struct {
	Name         string `json:"name"`
	Username     string `json:"username"`
	ShouldReject bool   `json:"shouldReject,omitempty"`
}

// Validate errors out if `ShouldReject` is true.
func (c *JWTClaims) Validate(ctx context.Context) error {
	if c.ShouldReject {
		return errors.New("should reject was set to true")
	}
	return nil
}

func JWTValidationMiddleware(logger *otelzap.Logger, cfg config.Auth0Config) gin.HandlerFunc {
	customClaims := func() validator.CustomClaims {
		return &JWTClaims{}
	}

	issuer := cfg.Domain
	audience := []string{cfg.Audience}

	jwk_uri, err := url.Parse(issuer)
	if err != nil {
		logger.Fatal("failed to parse issuer uri", zap.String("issuer", issuer), zap.Error(err))
	}

	jwk_provider := jwks.NewCachingProvider(jwk_uri, 5*time.Minute)

	jwtValidator, err := validator.New(
		jwk_provider.KeyFunc,
		validator.RS256,
		issuer,
		audience,
		validator.WithCustomClaims(customClaims),
		validator.WithAllowedClockSkew(30*time.Second),
	)
	if err != nil {
		logger.Fatal("failed to set up the validator", zap.Error(err))
	}

	errorHandler := func(w http.ResponseWriter, r *http.Request, err error) {
		logger.Ctx(r.Context()).Error("Encountered error while validating JWT", zap.Error(err))
	}

	middleware := jwtmiddleware.New(
		jwtValidator.ValidateToken,
		jwtmiddleware.WithErrorHandler(errorHandler),
	)

	return func(ctx *gin.Context) {
		encounteredError := true
		var handler http.HandlerFunc = func(w http.ResponseWriter, r *http.Request) {
			encounteredError = false
			ctx.Request = r
			ctx.Next()
		}

		middleware.CheckJWT(handler).ServeHTTP(ctx.Writer, ctx.Request)

		if encounteredError {
			ctx.AbortWithStatusJSON(
				http.StatusUnauthorized,
				map[string]string{"message": "JWT is invalid."},
			)
		}
	}
}
