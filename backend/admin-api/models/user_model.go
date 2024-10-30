package models

import (
	"fmt"
	"time"
)

type UserRole int64

const (
	UserRoleUnknown UserRole = iota
	UserRoleUser
	UserRoleMember
	UserRoleAdmin
)

func (ur UserRole) String() string {
	switch ur {
	case UserRoleUnknown:
		return "Unknown"
	case UserRoleUser:
		return "User"
	case UserRoleMember:
		return "Member"
	case UserRoleAdmin:
		return "Admin"
	default:
		return fmt.Sprintf("Unknown user role: %d", ur)
	}
}

type User struct {
	ID         *string    `json:"user_id,omitempty"`
	Connection *string    `json:"connection,omitempty"`
	Email      *string    `json:"email,omitempty"`
	Name       *string    `json:"name,omitempty"`
	GivenName  *string    `json:"given_name,omitempty"`
	FamilyName *string    `json:"family_name,omitempty"`
	Username   *string    `json:"username,omitempty"`
	Nickname   *string    `json:"nickname,omitempty"`
	ScreenName *string    `json:"screen_name,omitempty"`
	Location   *string    `json:"location,omitempty"`
	LastLogin  *time.Time `json:"last_login,omitempty"`
	Picture    *string    `json:"picture,omitempty"`
	Roles      []UserRole `json:"roles,omitempty"`
}
