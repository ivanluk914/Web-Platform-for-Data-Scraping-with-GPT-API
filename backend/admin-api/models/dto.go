package models

type PaginatedResponse[T any] struct {
	Total int64 `json:"total"`
	Data  []T   `json:"data"`
}

type ListUsersResponse[T any] struct {
	PaginatedResponse[T]
}

type AssignUserRoleRequest struct {
	Role UserRole `json:"role"`
}

type RemoveUserRoleRequest struct {
	Role UserRole `json:"role"`
}
