package errors

import "errors"

var (
	ErrNoAuthContext = errors.New("no authentication context found")
	ErrInvalidClaims = errors.New("failed to get user claims from context")
)
