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
  username?: string;
  name?: string;
  password?: string;
  role?: string;
}

// ========== HYDRANT & APAR INTERFACE ==========

export type ProteksiType = 'Hydrant' | 'APAR';
export type ProteksiStatus = 'Aktif' | 'Tidak Aktif' | 'Dalam Perbaikan';

export interface HydrantAparData {
  id?: number;
  no: string;
  Proteksi: ProteksiType;
  Lantai: string;
  Gedung: string;
  Kapasitas?: string;
  Tekanan?: string;
  Keterangan?: string;
  Status?: ProteksiStatus;
  created_at?: string;
  updated_at?: string;
}

export interface HydrantAparFilters {
  proteksi?: ProteksiType | '';
  gedung?: string;
  lantai?: string;
  status?: ProteksiStatus | '';
}

export interface HydrantAparStats {
  total: number;
  hydrant_count: number;
  apar_count: number;
  aktif_count: number;
  tidak_aktif_count: number;
  perbaikan_count: number;
  gedung_distribution: Record<string, number>;
  lantai_distribution: Record<string, number>;
}

// ========== HISTORY HYDRANT & APAR ==========

export type KondisiType = 'Baik' | 'Perlu Perbaikan' | 'Rusak';

export interface HistoryHydrantAparData {
  id?: number;
  no: string;                      // Referensi ke tabel hydrant_apar
  Proteksi: ProteksiType;          // 'Hydrant' | 'APAR'
  Tanggal_Pengisian?: string;      // date (nullable)
  Tanggal_Pengecekan: string;      // date (required)
  Kapasitas?: string;
  Tekanan?: string;
  Expired_Date?: string;           // date (nullable)
  Keterangan?: string;
  Pemeriksa?: string;
  Kondisi?: KondisiType;           // default: 'Baik'
  created_at?: string;
}

export interface HistoryHydrantAparFilters {
  proteksi?: ProteksiType | '';
  kondisi?: KondisiType | '';
  no?: string;
}

// ========== LAINNYA ==========

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
  // Tambahan: stats proteksi
  total_proteksi?: number;
  hydrant_count?: number;
  apar_count?: number;
}

// ============================================================
// AUTH SERVICE
// ============================================================

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userInfo: UserInfo | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        try { this.userInfo = JSON.parse(userInfoStr); } catch { /**/ }
      }
    }
  }

  private saveTokens(accessToken: string, refreshToken: string, userInfo: UserInfo) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userInfo = userInfo;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user_role', userInfo.role);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.userInfo = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user_role');
    }
  }

  getUserRole(): string | null {
    if (this.userInfo?.role) return this.userInfo.role;
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('user_role');
      if (role) return role;
      const str = localStorage.getItem('user_info');
      if (str) {
        try { return JSON.parse(str).role || null; } catch { /**/ }
      }
    }
    return null;
  }

  isAdmin(): boolean { return this.getUserRole() === 'admin'; }
  isUser(): boolean { const r = this.getUserRole(); return r === 'user' || r === 'viewer'; }
  hasRole(r: string): boolean { return this.getUserRole() === r; }

  getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;
    return headers;
  }

  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
      }
      const data: LoginResponse = await response.json();
      this.saveTokens(data.access_token, data.refresh_token, {
        id: data.user_id, username: data.username, name: data.name, role: data.role,
      });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async _refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    if (!this.refreshToken) return { success: false, error: 'No refresh token available' };
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });
      if (!response.ok) { this.clearTokens(); throw new Error('Refresh token expired or invalid'); }
      const data: RefreshTokenResponse = await response.json();
      this.accessToken = data.access_token;
      if (typeof window !== 'undefined') localStorage.setItem('access_token', data.access_token);
      return { success: true, data };
    } catch (error) {
      this.clearTokens();
      return { success: false, error: error instanceof Error ? error.message : 'Failed to refresh token' };
    }
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      if (this.accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: this.getAuthHeaders() });
      }
      this.clearTokens();
      return { success: true, data: { message: 'Logout successful' } };
    } catch (error) {
      this.clearTokens();
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    try {
      if (!this.accessToken) return { success: false, error: 'Not authenticated' };
      const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: this.getAuthHeaders() });
      if (response.status === 401) {
        const r = await this._refreshToken();
        if (r.success) return this.getCurrentUser();
        this.clearTokens();
        return { success: false, error: 'Session expired, please login again' };
      }
      if (!response.ok) throw new Error('Failed to get user info');
      const data: UserInfo = await response.json();
      this.userInfo = data;
      if (typeof window !== 'undefined') localStorage.setItem('user_info', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get user info' };
    }
  }

  isAuthenticated(): boolean { return !!this.accessToken; }
  getUserInfo(): UserInfo | null { return this.userInfo; }
  getAccessToken(): string | null { return this.accessToken; }
}

// ============================================================
// API SERVICE
// ============================================================

class ApiService {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // ---- Core fetch helper ----
  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnUnauthorized = true,
  ): Promise<ApiResponse<T>> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders(),
        ...options.headers,
      };
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

      if (response.status === 401 && retryOnUnauthorized) {
        const refreshResult = await this.authService._refreshToken();
        if (refreshResult.success) return this.fetchWithAuth(endpoint, options, false);
        this.authService.clearTokens();
        throw new Error('Session expired, please login again');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  get auth() {
    return {
      login: (u: string, p: string) => this.authService.login(u, p),
      logout: () => this.authService.logout(),
      getCurrentUser: () => this.authService.getCurrentUser(),
      isAuthenticated: () => this.authService.isAuthenticated(),
      getUserInfo: () => this.authService.getUserInfo(),
      getAccessToken: () => this.authService.getAccessToken(),
    };
  }

  // ============================================================
  // ========== HYDRANT & APAR ==========
  // ============================================================

  /**
   * Ambil semua data Hydrant & APAR dengan filter opsional.
   * Endpoint: GET /hydrantApar
   */
  /**
   * Fetch satu halaman hydrantApar (max 100 per request sesuai batasan backend).
   * Untuk internal use — gunakan getHydrantApar() untuk fetch semua data.
   */
  private async fetchHydrantAparPage(
    skip: number,
    filters?: HydrantAparFilters,
  ): Promise<ApiResponse<HydrantAparData[]>> {
    const PAGE_SIZE = 100; // Batas maksimal backend
    let query = `/hydrantApar?skip=${skip}&limit=${PAGE_SIZE}`;
    if (filters?.proteksi) query += `&Proteksi=${encodeURIComponent(filters.proteksi)}`;
    if (filters?.gedung)   query += `&Gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai)   query += `&Lantai=${encodeURIComponent(filters.lantai)}`;
    if (filters?.status)   query += `&Status=${encodeURIComponent(filters.status)}`;
    return this.fetchWithAuth<HydrantAparData[]>(query);
  }

  /**
   * Ambil SEMUA data Hydrant & APAR dengan pagination otomatis.
   * Backend membatasi max 100 per request — method ini loop sampai semua data terkumpul.
   * Endpoint: GET /hydrantApar
   */
  async getHydrantApar(filters?: HydrantAparFilters): Promise<ApiResponse<HydrantAparData[]>> {
    const PAGE_SIZE = 100;
    const allData: HydrantAparData[] = [];
    let skip = 0;

    try {
      while (true) {
        const result = await this.fetchHydrantAparPage(skip, filters);

        if (!result.success || !result.data) {
          // Kalau halaman pertama gagal, return error
          if (skip === 0) return { success: false, error: result.error };
          // Kalau halaman selanjutnya gagal, return data yang sudah terkumpul
          console.warn(`Pagination berhenti di skip=${skip}:`, result.error);
          break;
        }

        allData.push(...result.data);

        // Jika data yang dikembalikan < PAGE_SIZE, berarti ini halaman terakhir
        if (result.data.length < PAGE_SIZE) break;

        skip += PAGE_SIZE;
      }

      return { success: true, data: allData };
    } catch (error) {
      console.error('getHydrantApar pagination error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch hydrant/apar data',
      };
    }
  }

  /**
   * Ambil satu data Hydrant/APAR berdasarkan ID.
   * Endpoint: GET /hydrantApar/{id}
   */
  async getHydrantAparById(id: number): Promise<ApiResponse<HydrantAparData>> {
    return this.fetchWithAuth<HydrantAparData>(`/hydrantApar/${id}`);
  }

  /**
   * Ambil satu data Hydrant/APAR berdasarkan nomor alat.
   * Endpoint: GET /hydrantApar/no/{no}
   */
  async getHydrantAparByNo(no: string): Promise<ApiResponse<HydrantAparData>> {
    return this.fetchWithAuth<HydrantAparData>(`/hydrantApar/no/${encodeURIComponent(no)}`);
  }

  /**
   * Tambah data Hydrant/APAR baru.
   * Endpoint: POST /hydrantApar
   */
  async createHydrantApar(
    data: Omit<HydrantAparData, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ApiResponse<HydrantAparData>> {
    return this.fetchWithAuth<HydrantAparData>('/hydrantApar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update data Hydrant/APAR berdasarkan ID.
   * Endpoint: PUT /hydrantApar/{id}
   */
  async updateHydrantApar(
    id: number,
    data: Partial<Omit<HydrantAparData, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<ApiResponse<HydrantAparData>> {
    return this.fetchWithAuth<HydrantAparData>(`/hydrantApar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Hapus data Hydrant/APAR berdasarkan ID.
   * Endpoint: DELETE /hydrantApar/{id}
   */
  async deleteHydrantApar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/hydrantApar/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // ========== HISTORY HYDRANT & APAR ==========
  // ============================================================

  /**
   * Fetch satu halaman history (max 100 per request).
   */
  private async fetchHistoryPage(
    skip: number,
    filters?: HistoryHydrantAparFilters,
  ): Promise<ApiResponse<HistoryHydrantAparData[]>> {
    const PAGE_SIZE = 100;
    let query = `/history_hydrantApar?skip=${skip}&limit=${PAGE_SIZE}`;
    if (filters?.proteksi) query += `&Proteksi=${encodeURIComponent(filters.proteksi)}`;
    if (filters?.kondisi)  query += `&Kondisi=${encodeURIComponent(filters.kondisi)}`;
    if (filters?.no)       query += `&no=${encodeURIComponent(filters.no)}`;
    return this.fetchWithAuth<HistoryHydrantAparData[]>(query);
  }

  /**
   * Ambil SEMUA history Hydrant & APAR dengan pagination otomatis.
   * Endpoint: GET /history_hydrantApar
   */
  async getHistoryHydrantApar(
    filters?: HistoryHydrantAparFilters,
  ): Promise<ApiResponse<HistoryHydrantAparData[]>> {
    const PAGE_SIZE = 100;
    const allData: HistoryHydrantAparData[] = [];
    let skip = 0;

    try {
      while (true) {
        const result = await this.fetchHistoryPage(skip, filters);
        if (!result.success || !result.data) {
          if (skip === 0) return { success: false, error: result.error };
          console.warn(`History pagination berhenti di skip=${skip}:`, result.error);
          break;
        }
        allData.push(...result.data);
        if (result.data.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
      }
      return { success: true, data: allData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch history data',
      };
    }
  }

  /**
   * Ambil satu history berdasarkan ID.
   * Endpoint: GET /history_hydrantApar/{id}
   */
  async getHistoryHydrantAparById(id: number): Promise<ApiResponse<HistoryHydrantAparData>> {
    return this.fetchWithAuth<HistoryHydrantAparData>(`/history_hydrantApar/${id}`);
  }

  /**
   * Tambah history baru.
   * Endpoint: POST /history_hydrantApar
   */
  async createHistoryHydrantApar(
    data: Omit<HistoryHydrantAparData, 'id' | 'created_at'>,
  ): Promise<ApiResponse<HistoryHydrantAparData>> {
    return this.fetchWithAuth<HistoryHydrantAparData>('/history_hydrantApar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update history berdasarkan ID.
   * Endpoint: PUT /history_hydrantApar/{id}
   */
  async updateHistoryHydrantApar(
    id: number,
    data: Partial<Omit<HistoryHydrantAparData, 'id' | 'created_at'>>,
  ): Promise<ApiResponse<HistoryHydrantAparData>> {
    return this.fetchWithAuth<HistoryHydrantAparData>(`/history_hydrantApar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Hapus history berdasarkan ID.
   * Endpoint: DELETE /history_hydrantApar/{id}
   */
  async deleteHistoryHydrantApar(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/history_hydrantApar/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Hitung statistik Hydrant & APAR secara lokal dari data yang di-fetch.
   * Digunakan untuk dashboard summary tanpa perlu endpoint tambahan di backend.
   */
  async getHydrantAparStats(): Promise<ApiResponse<HydrantAparStats>> {
    const result = await this.getHydrantApar();
    if (!result.success || !result.data) {
      return { success: false, error: result.error ?? 'Failed to fetch hydrant/apar data' };
    }

    const data = result.data;
    const stats: HydrantAparStats = {
      total: data.length,
      hydrant_count: data.filter(d => d.Proteksi === 'Hydrant').length,
      apar_count: data.filter(d => d.Proteksi === 'APAR').length,
      aktif_count: data.filter(d => (d.Status ?? 'Aktif') === 'Aktif').length,
      tidak_aktif_count: data.filter(d => d.Status === 'Tidak Aktif').length,
      perbaikan_count: data.filter(d => d.Status === 'Dalam Perbaikan').length,
      gedung_distribution: {},
      lantai_distribution: {},
    };

    data.forEach(d => {
      stats.gedung_distribution[d.Gedung] = (stats.gedung_distribution[d.Gedung] ?? 0) + 1;
      stats.lantai_distribution[d.Lantai] = (stats.lantai_distribution[d.Lantai] ?? 0) + 1;
    });

    return { success: true, data: stats };
  }

  // ============================================================
  // ========== FAKULTAS ENDPOINTS ==========
  // ============================================================

  async getFakultasEkonomi(skip = 0, limit = 100, filters?: { gedung?: string; lantai?: number; fk?: string }): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_ekonomi?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk)     query += `&fk=${encodeURIComponent(filters.fk)}`;
    return this.fetchWithAuth<RoomData[]>(query);
  }
  async getFakultasEkonomiById(id: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_ekonomi/${id}`); }
  async getFakultasEkonomiByNo(no: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_ekonomi/no/${no}`); }
  async createFakultasEkonomi(d: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>('/fk_ekonomi', { method: 'POST', body: JSON.stringify(d) }); }
  async updateFakultasEkonomi(id: number, d: Partial<RoomData>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_ekonomi/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  async deleteFakultasEkonomi(id: number): Promise<ApiResponse<{ message: string }>> { return this.fetchWithAuth<{ message: string }>(`/fk_ekonomi/${id}`, { method: 'DELETE' }); }

  async getFakultasSyariah(skip = 0, limit = 100, filters?: { gedung?: string; lantai?: number; fk?: string }): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_syariah?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk)     query += `&fk=${encodeURIComponent(filters.fk)}`;
    return this.fetchWithAuth<RoomData[]>(query);
  }
  async getFakultasSyariahById(id: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_syariah/${id}`); }
  async getFakultasSyariahByNo(no: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_syariah/no/${no}`); }
  async createFakultasSyariah(d: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>('/fk_syariah', { method: 'POST', body: JSON.stringify(d) }); }
  async updateFakultasSyariah(id: number, d: Partial<RoomData>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_syariah/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  async deleteFakultasSyariah(id: number): Promise<ApiResponse<{ message: string }>> { return this.fetchWithAuth<{ message: string }>(`/fk_syariah/${id}`, { method: 'DELETE' }); }

  async getFakultasTarbiyah(skip = 0, limit = 100, filters?: { gedung?: string; lantai?: number; fk?: string }): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_tarbiyah?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk)     query += `&fk=${encodeURIComponent(filters.fk)}`;
    return this.fetchWithAuth<RoomData[]>(query);
  }
  async getFakultasTarbiyahById(id: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_tarbiyah/${id}`); }
  async getFakultasTarbiyahByNo(no: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_tarbiyah/no/${no}`); }
  async createFakultasTarbiyah(d: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>('/fk_tarbiyah', { method: 'POST', body: JSON.stringify(d) }); }
  async updateFakultasTarbiyah(id: number, d: Partial<RoomData>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_tarbiyah/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  async deleteFakultasTarbiyah(id: number): Promise<ApiResponse<{ message: string }>> { return this.fetchWithAuth<{ message: string }>(`/fk_tarbiyah/${id}`, { method: 'DELETE' }); }

  async getFakultasTeknik(skip = 0, limit = 100, filters?: { gedung?: string; lantai?: number; fk?: string }): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_teknik?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk)     query += `&fk=${encodeURIComponent(filters.fk)}`;
    return this.fetchWithAuth<RoomData[]>(query);
  }
  async getFakultasTeknikById(id: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_teknik/${id}`); }
  async getFakultasTeknikByNo(no: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_teknik/no/${no}`); }
  async createFakultasTeknik(d: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>('/fk_teknik', { method: 'POST', body: JSON.stringify(d) }); }
  async updateFakultasTeknik(id: number, d: Partial<RoomData>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_teknik/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  async deleteFakultasTeknik(id: number): Promise<ApiResponse<{ message: string }>> { return this.fetchWithAuth<{ message: string }>(`/fk_teknik/${id}`, { method: 'DELETE' }); }

  async getFakultasFikom(skip = 0, limit = 100, filters?: { gedung?: string; lantai?: number; fk?: string }): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_fikom?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk)     query += `&fk=${encodeURIComponent(filters.fk)}`;
    return this.fetchWithAuth<RoomData[]>(query);
  }
  async getFakultasFikomById(id: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_fikom/${id}`); }
  async getFakultasFikomByNo(no: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_fikom/no/${no}`); }
  async createFakultasFikom(d: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>('/fk_fikom', { method: 'POST', body: JSON.stringify(d) }); }
  async updateFakultasFikom(id: number, d: Partial<RoomData>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_fikom/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  async deleteFakultasFikom(id: number): Promise<ApiResponse<{ message: string }>> { return this.fetchWithAuth<{ message: string }>(`/fk_fikom/${id}`, { method: 'DELETE' }); }

  async getFakultasHukum(skip = 0, limit = 100, filters?: { gedung?: string; lantai?: number; fk?: string }): Promise<ApiResponse<RoomData[]>> {
    let query = `/fk_hukum?skip=${skip}&limit=${limit}`;
    if (filters?.gedung) query += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) query += `&lantai=${filters.lantai}`;
    if (filters?.fk)     query += `&fk=${encodeURIComponent(filters.fk)}`;
    return this.fetchWithAuth<RoomData[]>(query);
  }
  async getFakultasHukumById(id: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_hukum/${id}`); }
  async getFakultasHukumByNo(no: number): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_hukum/no/${no}`); }
  async createFakultasHukum(d: Omit<RoomData, 'id' | 'created_at'>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>('/fk_hukum', { method: 'POST', body: JSON.stringify(d) }); }
  async updateFakultasHukum(id: number, d: Partial<RoomData>): Promise<ApiResponse<RoomData>> { return this.fetchWithAuth<RoomData>(`/fk_hukum/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  async deleteFakultasHukum(id: number): Promise<ApiResponse<{ message: string }>> { return this.fetchWithAuth<{ message: string }>(`/fk_hukum/${id}`, { method: 'DELETE' }); }

  // ============================================================
  // ========== USERS ==========
  // ============================================================

  async getUserById(id: number): Promise<ApiResponse<UserData>> {
    return this.fetchWithAuth<UserData>(`/users/${id}`);
  }

  async getUsers(skip = 0, limit = 100, includeStats = false): Promise<{
    success: boolean; data?: UserData[]; stats?: UserStats; error?: string;
  }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const url = includeStats
        ? `${API_BASE_URL}/users/?skip=${skip}&limit=${limit}&include_stats=true`
        : `${API_BASE_URL}/users/?skip=${skip}&limit=${limit}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to fetch users: ${response.status}` };
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: 'Network error while fetching users' };
    }
  }

  async getUserStats(): Promise<{ success: boolean; data?: UserStats; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const response = await fetch(`${API_BASE_URL}/users/stats`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to fetch user stats: ${response.status}` };
      }
      const data = await response.json();
      return { success: true, data: data.stats };
    } catch (error) {
      return { success: false, error: 'Network error while fetching user stats' };
    }
  }

  async createUser(userData: UserCreate): Promise<{ success: boolean; data?: UserData; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to create user: ${response.status}` };
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: 'Network error while creating user' };
    }
  }

  async updateUser(userId: number, userData: Partial<UserUpdate>): Promise<{ success: boolean; data?: UserData; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to update user: ${response.status}` };
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: 'Network error while updating user' };
    }
  }

  async deleteUser(userId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to delete user: ${response.status}` };
      }
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error while deleting user' };
    }
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password?new_password=${encodeURIComponent(newPassword)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to reset password: ${response.status}` };
      }
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error while resetting password' };
    }
  }

  async getCurrentUser(): Promise<{ success: boolean; data?: UserData; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const response = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to fetch user profile: ${response.status}` };
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: 'Network error while fetching user profile' };
    }
  }

  async updateCurrentUser(updateData: { name?: string; password?: string }): Promise<{ success: boolean; data?: UserData; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to update profile: ${response.status}` };
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: 'Network error while updating profile' };
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = this.authService.getAccessToken();
      if (!token) return { success: false, error: 'No authentication token' };
      const formData = new URLSearchParams();
      formData.append('old_password', oldPassword);
      formData.append('new_password', newPassword);
      const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.detail || `Failed to change password: ${response.status}` };
      }
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: 'Network error while changing password' };
    }
  }

  // ============================================================
  // ========== MASTER DATA ==========
  // ============================================================

  async getMasterData(): Promise<MasterData> {
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
        "Fakultas Tarbiyah dan Keguruan": [
          { value: "Prodi Pendidikan Agama Islam", label: "01. Prodi Pendidikan Agama Islam" },
          { value: "Prodi Pendidikan Bahasa Arab", label: "02. Prodi Pendidikan Bahasa Arab" },
        ],
        "Fakultas Ilmu Komunikasi": [
          { value: "Prodi Ilmu Komunikasi", label: "01. Prodi Ilmu Komunikasi" },
          { value: "Prodi Jurnalistik", label: "02. Prodi Jurnalistik" },
        ],
      },
    };
  }

  // ============================================================
  // ========== STATISTICS ==========
  // ============================================================

  /**
   * Statistik gabungan: ruangan dari semua fakultas + hydrant/apar.
   * Menggunakan Promise.allSettled agar satu gagal tidak blokir semua.
   */
  async getStatistics(): Promise<ApiResponse<StatisticsData>> {
    try {
      const [ekonomi, syariah, tarbiyah, teknik, fikom, hukum, proteksi] = await Promise.allSettled([
        this.getFakultasEkonomi(0, 1000),
        this.getFakultasSyariah(0, 1000),
        this.getFakultasTarbiyah(0, 1000),
        this.getFakultasTeknik(0, 1000),
        this.getFakultasFikom(0, 1000),
        this.getFakultasHukum(0, 1000),
        this.getHydrantApar(),
      ]);

      // Gabungkan semua data ruangan yang berhasil
      const allRooms: RoomData[] = [];
      [ekonomi, syariah, tarbiyah, teknik, fikom, hukum].forEach(res => {
        if (res.status === 'fulfilled' && res.value.success && res.value.data) {
          allRooms.push(...res.value.data);
        }
      });

      const statistics: StatisticsData = {
        total_ruangan: allRooms.length,
        gedung_count: new Set(allRooms.map(r => r.gedung)).size,
        lantai_distribution: {},
        fakultas_distribution: {},
      };

      allRooms.forEach(r => {
        statistics.lantai_distribution[r.lantai] = (statistics.lantai_distribution[r.lantai] ?? 0) + 1;
        statistics.fakultas_distribution[r.fk] = (statistics.fakultas_distribution[r.fk] ?? 0) + 1;
      });

      // Tambahkan statistik proteksi jika berhasil
      if (proteksi.status === 'fulfilled' && proteksi.value.success && proteksi.value.data) {
        const pd = proteksi.value.data;
        statistics.total_proteksi = pd.length;
        statistics.hydrant_count = pd.filter(p => p.Proteksi === 'Hydrant').length;
        statistics.apar_count = pd.filter(p => p.Proteksi === 'APAR').length;
      }

      return { success: true, data: statistics };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate statistics' };
    }
  }

  // ============================================================
  // ========== SEARCH & TEST ==========
  // ============================================================

  async searchRooms(query: string, filters?: { gedung?: string; lantai?: number }): Promise<ApiResponse<RoomData[]>> {
    let endpoint = `/fakultas/search?query=${encodeURIComponent(query)}`;
    if (filters?.gedung) endpoint += `&gedung=${encodeURIComponent(filters.gedung)}`;
    if (filters?.lantai) endpoint += `&lantai=${filters.lantai}`;
    return this.fetchWithAuth<RoomData[]>(endpoint);
  }

  async testConnection(): Promise<{ success: boolean; message: string; status: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      return { success: response.ok, message: response.ok ? 'API Connected' : 'API Error', status: response.status };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection Failed', status: 0 };
    }
  }
}

// Singleton export
export const apiService = new ApiService();