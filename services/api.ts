const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

// ========== INTERFACES ==========
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  username: string;
  name: string;
  role: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  role: string;
}


export interface RoomData {
  id?: number;
  no: number;
  fk: string;
  subUnit: string;
  ruangan: string;
  lantai: number;
  gedung: string;
  ukuranR?: number;
  ket?: string;
  created_at?: string;
}

export interface UserData {
  id?: number;
  username: string;
  name: string;
  password: string;
  role: string;
  created_at?: string;
}

export interface UserCreate {
  username: string;
  name: string;
  password: string;
  role: string;
}

export interface UserUpdate {
  username: string;
  name: string;
  password: string;
  role: string;
}



export interface MasterData {
  fakultas: Array<{ value: string; label: string }>;
  subUnits: Record<string, Array<{ value: string; label: string }>>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserStats {
  total: number;
  admins: number;
  regular_users: number;
  role_distribution: Record<string, number>;
}

export interface StatisticsData {
  total_ruangan: number;
  gedung_count: number;
  lantai_distribution: Record<number, number>;
  fakultas_distribution: Record<string, number>;
}
class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userInfo: UserInfo | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        this.userInfo = JSON.parse(userInfoStr);
      }
    }
  }

  // Helper untuk menyimpan token
  private saveTokens(accessToken: string, refreshToken: string, userInfo: UserInfo) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userInfo = userInfo;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user_role', userInfo.role); // Simpan role secara terpisah
    }
  }

  // Helper untuk menghapus token
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.userInfo = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user_role'); // Hapus role juga
    }
  }

  getUserRole(): string | null {
  if (this.userInfo?.role) {
    return this.userInfo.role;
  }
  
  if (typeof window !== 'undefined') {
    const role = localStorage.getItem('user_role');
    if (role) {
      return role;
    }
    
    // Fallback: cek dari user_info
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      return userInfo.role || null;
    }
  }
  
  return null;
}

isAdmin(): boolean {
  const role = this.getUserRole();
  return role === 'admin';
}

isUser(): boolean {
  const role = this.getUserRole();
  return role === 'user' || role === 'viewer';
}

hasRole(requiredRole: string): boolean {
  const role = this.getUserRole();
  return role === requiredRole;
}



  // Get headers with auth token
  getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    return headers;
  }
async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      
      // Save tokens and user info
      const userInfo: UserInfo = {
        id: data.user_id,
        username: data.username,
        name: data.name,
        role: data.role,
      };
      
      this.saveTokens(data.access_token, data.refresh_token, userInfo);
      
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  // Refresh token function
  async _refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        // If refresh fails, clear tokens (force re-login)
        this.clearTokens();
        throw new Error('Refresh token expired or invalid');
      }

      const data: RefreshTokenResponse = await response.json();
      this.accessToken = data.access_token;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearTokens();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token',
      };
    }
  }

  // Logout function
  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      if (this.accessToken) {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
          console.warn('Logout API call failed, but clearing local tokens anyway');
        }
      }
      
      this.clearTokens();
      return { success: true, data: { message: 'Logout successful' } };
    } catch (error) {
      console.error('Logout error:', error);
      this.clearTokens(); // Clear tokens even if API call fails
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    try {
      if (!this.accessToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshResult = await this._refreshToken();
        if (refreshResult.success) {
          // Retry with new token
          return this.getCurrentUser();
        } else {
          this.clearTokens();
          return { success: false, error: 'Session expired, please login again' };
        }
      }

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data: UserInfo = await response.json();
      this.userInfo = data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_info', JSON.stringify(data));
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user info',
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current user info
  getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  // Get access token
  getAccessToken(): string | null {
    return this.accessToken;
  }
}


// ========== API SERVICE ==========
class ApiService {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private headers = {
    'Content-Type': 'application/json',
  };

  // Helper untuk fetch dengan error handling
  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnUnauthorized: boolean = true

  ): Promise<ApiResponse<T>> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders(),
        ...options.headers,

      };
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401 && retryOnUnauthorized) {
        // Try to refresh token
        const refreshResult = await this.authService._refreshToken();
        if (refreshResult.success) {
          // Retry the original request with new token
          return this.fetchWithAuth(endpoint, options, false);
        } else {
          // Refresh failed, clear tokens
          this.authService.clearTokens();
          throw new Error('Session expired, please login again');
        }
      }


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  get auth() {
    return {
      login: (username: string, password: string) => 
        this.authService.login(username, password),
      logout: () => this.authService.logout(),
      getCurrentUser: () => this.authService.getCurrentUser(),
      isAuthenticated: () => this.authService.isAuthenticated(),
      getUserInfo: () => this.authService.getUserInfo(),
      getAccessToken: () => this.authService.getAccessToken(),
    };
  }

  // Keep existing methods, they will now use fetchWithAuth


  async getUserById(id: number): Promise<ApiResponse<UserData>> {
    return this.fetchWithAuth<UserData>(`/users/${id}`);
  }


  // ========== FAKULTAS ENDPOINTS ==========
  async getFakultasEkonomi(
    skip: number = 0,
    limit: number = 100,
    filters?: { gedung?: string; lantai?: number; fk?: string }
  ): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_ekonomi?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk) query += `&fk=${encodeURIComponent(filters.fk)}`;
    
    return this.fetchWithAuth<RoomData[]>(query);
  }

  async getFakultasEkonomiById(id: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_ekonomi/${id}`);
  }

  async getFakultasEkonomiByNo(no: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_ekonomi/no/${no}`);
  }

  async createFakultasEkonomi(roomData: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>('/fk_ekonomi', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateFakultasEkonomi(id: number, roomData: Partial<RoomData>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_ekonomi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteFakultasEkonomi(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/fk_ekonomi/${id}`, {
      method: 'DELETE',
    });
  }

  async getFakultasSyariah(
    skip: number = 0,
    limit: number = 100,
    filters?: { gedung?: string; lantai?: number; fk?: string }
  ): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_syariah?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk) query += `&fk=${encodeURIComponent(filters.fk)}`;
    
    return this.fetchWithAuth<RoomData[]>(query);
  }

  async getFakultasSyariahById(id: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_syariah/${id}`);
  }

  async getFakultasSyariahByNo(no: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_syariah/no/${no}`);
  }

  async createFakultasSyariah(roomData: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>('/fk_syariah', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateFakultasSyariah(id: number, roomData: Partial<RoomData>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_syariah/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteFakultasSyariah(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/fk_syariah/${id}`, {
      method: 'DELETE',
    });
  }

// Di dalam class ApiService, perbaiki semua method yang memanggil this.getToken()

async getUsers(skip: number = 0, limit: number = 100, includeStats: boolean = false): Promise<{
    success: boolean;
    data?: UserData[];
    stats?: UserStats;
    error?: string;
  }> {
    try {
      // Gunakan this.authService.getAccessToken() bukan this.getToken()
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const url = includeStats 
        ? `${API_BASE_URL}/users/?skip=${skip}&limit=${limit}&include_stats=true`  // Gunakan API_BASE_URL, bukan this.baseUrl
        : `${API_BASE_URL}/users/?skip=${skip}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to fetch users: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: 'Network error while fetching users' };
    }
  }

  async getUserStats(): Promise<{
    success: boolean;
    data?: UserStats;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to fetch user stats: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, data: data.stats };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { success: false, error: 'Network error while fetching user stats' };
    }
  }

  async createUser(userData: UserCreate): Promise<{
    success: boolean;
    data?: UserData;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken(); // Pastikan ini benar
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      console.log('🔑 Using token:', token.substring(0, 20) + '...');

      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        return { 
          success: false, 
          error: errorData.detail || `Failed to create user: ${response.status}` 
        };
      }

      const data = await response.json();
      console.log('✅ Success response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('🔥 Network error in createUser:', error);
      return { success: false, error: 'Network error while creating user' };
    }
  }

  async updateUser(userId: number, userData: UserUpdate): Promise<{
    success: boolean;
    data?: UserData;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to update user: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Network error while updating user' };
    }
  }

  async deleteUser(userId: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to delete user: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Network error while deleting user' };
    }
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password?new_password=${encodeURIComponent(newPassword)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to reset password: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: 'Network error while resetting password' };
    }
  }

  // ==================== USER PROFILE (SELF SERVICE) ====================
  
  async getCurrentUser(): Promise<{
    success: boolean;
    data?: UserData;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to fetch user profile: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: 'Network error while fetching user profile' };
    }
  }

  async updateCurrentUser(updateData: { name?: string; password?: string }): Promise<{
    success: boolean;
    data?: UserData;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to update profile: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: 'Network error while updating profile' };
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const formData = new URLSearchParams();
      formData.append('old_password', oldPassword);
      formData.append('new_password', newPassword);

      const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Failed to change password: ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Network error while changing password' };
    }
  }


async getFakultasTarbiyah(
    skip: number = 0,
    limit: number = 100,
    filters?: { gedung?: string; lantai?: number; fk?: string }
  ): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_tarbiyah?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk) query += `&fk=${encodeURIComponent(filters.fk)}`;
    
    return this.fetchWithAuth<RoomData[]>(query);
  }

  async getFakultasTarbiyahById(id: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_tarbiyah/${id}`);
  }

  async getFakultaTarbiyahsByNo(no: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_tarbiyah/no/${no}`);
  }

  async createFakultasTarbiyah(roomData: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>('/fk_tarbiyah', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateFakultasTarbiyah(id: number, roomData: Partial<RoomData>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_tarbiyah/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteFakultasTarbiyah(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/fk_tarbiyah/${id}`, {
      method: 'DELETE',
    });
  }

async getFakultasTeknik(
    skip: number = 0,
    limit: number = 100,
    filters?: { gedung?: string; lantai?: number; fk?: string }
  ): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_teknik?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk) query += `&fk=${encodeURIComponent(filters.fk)}`;
    
    return this.fetchWithAuth<RoomData[]>(query);
  }

  async getFakultasTeknikById(id: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_teknik/${id}`);
  }

  async getFakultasTeknikByNo(no: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_teknik/no/${no}`);
  }

  async createFakultasTeknik(roomData: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>('/fk_teknik', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateFakultasTeknik(id: number, roomData: Partial<RoomData>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_teknik/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteFakultasTeknik(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/fk_teknik/${id}`, {
      method: 'DELETE',
    });
  }

  async getFakultasFikom(
    skip: number = 0,
    limit: number = 100,
    filters?: { gedung?: string; lantai?: number; fk?: string }
  ): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_fikom?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk) query += `&fk=${encodeURIComponent(filters.fk)}`;
    
    return this.fetchWithAuth<RoomData[]>(query);
  }

  async getFakultasFikomById(id: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_fikom/${id}`);
  }

  async getFakultasFikomByNo(no: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_fikom/no/${no}`);
  }

  async createFakultasFikom(roomData: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>('/fk_fikom', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateFakultasFikom(id: number, roomData: Partial<RoomData>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_fikom/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteFakultasFikom(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/fk_fikom/${id}`, {
      method: 'DELETE',
    });
  }

  async getFakultasHukum(
    skip: number = 0,
    limit: number = 100,
    filters?: { gedung?: string; lantai?: number; fk?: string }
  ): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_hukum?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk) query += `&fk=${encodeURIComponent(filters.fk)}`;
    
    return this.fetchWithAuth<RoomData[]>(query);
  }

  async getFakultasHukumById(id: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_hukum/${id}`);
  }

  async getFakultasHukumByNo(no: number): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_hukum/no/${no}`);
  }

  async createFakultasHukum(roomData: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>('/fk_hukum', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateFakultasHukum(id: number, roomData: Partial<RoomData>): Promise<ApiResponse<RoomData>> {
    return this.fetchWithAuth<RoomData>(`/fk_hukum/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteFakultasHukum(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/fk_hukum/${id}`, {
      method: 'DELETE',
    });
  }


  // ========== MASTER DATA ==========
  async getMasterData(): Promise<MasterData> {
    // Data statis - bisa diganti dengan API endpoint jika tersedia
    return {
      fakultas: [
        { value: "Fakultas Syariah", label: "01. Fakultas Syariah" },
        { value: "Fakultas Dakwah", label: "02. Fakultas Dakwah" },
        { value: "Fakultas Tarbiyah dan Keguruan", label: "03. Fakultas Tarbiyah dan Keguruan" },
        { value: "Fakultas Hukum", label: "04. Fakultas Hukum" },
        { value: "Fakultas Psikologi", label: "05. Fakultas Psikologi" },
        { value: "Fakultas MIPA", label: "06. Fakultas MIPA" },
        { value: "Fakultas Teknik", label: "07. Fakultas Teknik" },
        { value: "Fakultas Ilmu Komunikasi", label: "08. Fakultas Ilmu Komunikasi" },
        { value: "Fakultas Ekonomi dan Bisnis", label: "09. Fakultas Ekonomi dan Bisnis" },
        { value: "Fakultas Kedokteran", label: "10. Fakultas Kedokteran" },
      ],
      subUnits: {
        "Fakultas Ekonomi dan Bisnis": [
          { value: "Prodi Manajemen", label: "01. Prodi Manajemen" },
          { value: "Prodi Akuntansi", label: "02. Prodi Akuntansi" },
          { value: "Prodi Ekonomi Pembangunan", label: "03. Prodi Ekonomi Pembangunan" },
          { value: "Sekertariat Fakultas", label: "04. Sekertariat Fakultas" },
          { value: "Prodi Magister Akuntansi", label: "05. Prodi Magister Akuntansi" },
          { value: "Prodi Magister Manajemen", label: "06. Prodi Magister Manajemen" },
          { value: "Prodi Doktor Manajemen", label: "07. Prodi Doktor Manajemen" },
        ],
        "Fakultas Syariah": [
          { value: "Prodi Hukum Ekonomi Syariah", label: "01. Prodi Hukum Ekonomi Syariah" },
          { value: "Prodi Perbankan Syariah", label: "02. Prodi Perbankan Syariah" },
        ],
        "Fakultas Teknik": [
          { value: "Prodi Teknik Informatika", label: "01. Prodi Teknik Informatika" },
          { value: "Prodi Teknik Sipil", label: "02. Prodi Teknik Sipil" },
          { value: "Prodi Teknik Elektro", label: "03. Prodi Teknik Elektro" },
        ],
        "Fakultas Dakwah": [
          { value: "Prodi Komunikasi Penyiaran Islam", label: "01. Prodi Komunikasi Penyiaran Islam" },
          { value: "Prodi Bimbingan Konseling Islam", label: "02. Prodi Bimbingan Konseling Islam" },
        ],
        "Fakultas Tarbiyah dan Keguruan": [
          { value: "Prodi Pendidikan Agama Islam", label: "01. Prodi Pendidikan Agama Islam" },
          { value: "Prodi Pendidikan Bahasa Arab", label: "02. Prodi Pendidikan Bahasa Arab" },
        ],
        "Fakultas Ilmu Komunikasi": [
          { value: "Prodi Ilmu Komunikasi", label: "01. Prodi Ilmu Komunikasi" },
          { value: "Prodi Jurnalistik", label: "02. Prodi Jurnalistik" },
        ],
      }
    };
  }

  // ========== STATISTICS ==========
  async getStatistics(): Promise<ApiResponse<StatisticsData>> {
    try {
      // Fetch all rooms data first
      const result = await this.getFakultasEkonomi(0, 1000);
      
      if (!result.success || !result.data) {
        return { 
          success: false, 
          error: 'Failed to fetch data for statistics' 
        };
      }

      const data = result.data;
      
      // Calculate statistics
      const statistics: StatisticsData = {
        total_ruangan: data.length,
        gedung_count: new Set(data.map(item => item.gedung)).size,
        lantai_distribution: {},
        fakultas_distribution: {},
      };

      // Calculate distributions
      data.forEach(item => {
        // Lantai distribution
        statistics.lantai_distribution[item.lantai] = 
          (statistics.lantai_distribution[item.lantai] || 0) + 1;
        
        // Fakultas distribution
        statistics.fakultas_distribution[item.fk] = 
          (statistics.fakultas_distribution[item.fk] || 0) + 1;
      });

      return { 
        success: true, 
        data: statistics 
      };
      
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate statistics',
      };
    }
  }

  // ========== SEARCH ==========
  async searchRooms(query: string, filters?: { gedung?: string; lantai?: number }): Promise<ApiResponse<RoomData[]>> {
    let endpoint = `/fakultas/search?query=${encodeURIComponent(query)}`;
    if (filters?.gedung) endpoint += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) endpoint += `&lantai=${filters.lantai}`;
    
    return this.fetchWithAuth<RoomData[]>(endpoint);
  }

  // ========== API TEST ==========
  async testConnection(): Promise<{ success: boolean; message: string; status: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      return {
        success: response.ok,
        message: response.ok ? 'API Connected' : 'API Error',
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection Failed',
        status: 0,
      };
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();