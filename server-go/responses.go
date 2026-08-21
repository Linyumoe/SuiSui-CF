package main

// --- Auth responses ---

type authLoginResponse struct {
	Username   string `json:"username"`
	Avatar     string `json:"avatar"`
	Nickname   string `json:"nickname"`
	Role       string `json:"role"`
	ThemeColor string `json:"theme_color"`
	Token      string `json:"token"`
}

type authRegisterResponse struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	Token    string `json:"token"`
}

type authVerifyResponse struct {
	Valid      bool   `json:"valid"`
	Avatar     string `json:"avatar,omitempty"`
	Nickname   string `json:"nickname,omitempty"`
	Role       string `json:"role,omitempty"`
	ThemeColor string `json:"theme_color,omitempty"`
}

type authSuccessResponse struct {
	Success  bool   `json:"success"`
	Nickname string `json:"nickname,omitempty"`
}

type uploadResponse struct {
	Success bool   `json:"success"`
	URL     string `json:"url"`
}

// --- Note responses ---

type noteResponse struct {
	ID        string              `json:"id"`
	Content   string              `json:"content"`
	CreatedAt int64               `json:"createdAt"`
	UpdatedAt int64               `json:"updatedAt"`
	Pinned    bool                `json:"pinned"`
	Tags      []string            `json:"tags"`
	Username  string              `json:"username"`
	Avatar    string              `json:"avatar"`
	Nickname  string              `json:"nickname"`
	Reactions map[string][]string `json:"reactions,omitempty"`
}

// --- Trash responses ---

type trashItemResponse struct {
	ID        string   `json:"id"`
	Content   string   `json:"content"`
	CreatedAt int64    `json:"createdAt"`
	UpdatedAt int64    `json:"updatedAt"`
	Pinned    bool     `json:"pinned"`
	Tags      []string `json:"tags"`
	Username  string   `json:"username"`
	Avatar    string   `json:"avatar"`
	Nickname  string   `json:"nickname"`
	DeletedAt int64    `json:"deletedAt"`
}

// --- Admin responses ---

type adminUserResponse struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	Role      string `json:"role"`
	CreatedAt int64  `json:"createdAt"`
	MemoCount int    `json:"memoCount"`
}

type adminUserListResponse struct {
	Users   []adminUserResponse `json:"users"`
	Total   int                 `json:"total"`
	Page    int                 `json:"page"`
	PerPage int                 `json:"perPage"`
}

// --- Generic ---

type successResponse struct {
	Success string `json:"success"`
}

type healthResponse struct {
	Status          string `json:"status"`
	DBSchemaVersion int    `json:"dbSchemaVersion"`
	Version         string `json:"version"`
	Message         string `json:"message,omitempty"`
}

type errResponse struct {
	Error string `json:"error"`
}

type importResponse struct {
	Imported int `json:"imported"`
}

type paginatedNotesResponse struct {
	Notes  []noteResponse `json:"notes"`
	Total  int            `json:"total"`
	Limit  int            `json:"limit"`
	Offset int            `json:"offset"`
}

type adminStatsResponse struct {
	TotalUsers int `json:"totalUsers"`
	TotalNotes int `json:"totalNotes"`
}
