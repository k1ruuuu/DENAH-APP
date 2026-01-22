const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

// ========== INTERFACES ==========
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

export interface StatisticsData {
  total_ruangan: number;
  gedung_count: number;
  lantai_distribution: Record<number, number>;
  fakultas_distribution: Record<string, number>;
}

// ========== API SERVICE ==========
class ApiService {
  private headers = {
    'Content-Type': 'application/json',
  };

  // Helper untuk fetch dengan error handling
  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

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

  // ========== USER ENDPOINTS ==========
  async getUsers(skip: number = 0, limit: number = 100): Promise<ApiResponse<UserData[]>> {
    return this.fetchWithAuth<UserData[]>(`/users?skip=${skip}&limit=${limit}`);
  }

  async getUserById(id: number): Promise<ApiResponse<UserData>> {
    return this.fetchWithAuth<UserData>(`/users/${id}`);
  }

  async createUser(userData: Omit<UserData, 'id' | 'created_at'>): Promise<ApiResponse<UserData>> {
    return this.fetchWithAuth<UserData>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: Partial<UserData>): Promise<ApiResponse<UserData>> {
    return this.fetchWithAuth<UserData>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetchWithAuth<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== FAKULTAS EKONOMI ENDPOINTS ==========
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

  // ========== FAKULTAS LAINNYA ==========
  async getFakultasSyariah(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/syariah');
  }

  async getFakultasDakwah(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/dakwah');
  }

  async getFakultasTarbiyah(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/tarbiyah');
  }

  async getFakultasHukum(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/hukum');
  }

  async getFakultasPsikologi(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/psikologi');
  }

  async getFakultasMipa(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/mipa');
  }

  async getFakultasTeknik(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/teknik');
  }

  async getFakultasIlmuKomputer(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/ilmu-komputer');
  }

  async getFakultasKedokteran(): Promise<ApiResponse<RoomData[]>> {
    return this.fetchWithAuth<RoomData[]>('/fakultas/kedokteran');
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