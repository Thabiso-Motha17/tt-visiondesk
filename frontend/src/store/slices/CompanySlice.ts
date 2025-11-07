import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

// ==================== TYPE DEFINITIONS ====================

export interface Company {
  id: number;
  name: string;
  contact_email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  error: string | null;
}

// ==================== STATE INITIALIZATION ====================

const initialState: CompanyState = {
  companies: [],
  currentCompany: null,
  loading: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

// Fetch all companies
export const fetchCompanies = createAsyncThunk<
  Company[],
  void,
  { rejectValue: string }
>(
  'companies/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch companies');
      }

      const data: Company[] = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch companies');
    }
  }
);

// Fetch company by ID
export const fetchCompanyById = createAsyncThunk<
  Company,
  number,
  { rejectValue: string }
>(
  'companies/fetchCompanyById',
  async (companyId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch company');
      }

      const data: Company = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch company');
    }
  }
);

// Create company (Admin only)
export const createCompany = createAsyncThunk<
  Company,
  Omit<Company, 'id' | 'created_at' | 'updated_at'>,
  { rejectValue: string }
>(
  'companies/createCompany',
  async (companyData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      const data: Company = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create company');
    }
  }
);

// Update company (Admin only)
export const updateCompany = createAsyncThunk<
  Company,
  { companyId: number; companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'> },
  { rejectValue: string }
>(
  'companies/updateCompany',
  async ({ companyId, companyData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company');
      }

      const data: Company = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update company');
    }
  }
);

// Delete company (Admin only)
export const deleteCompany = createAsyncThunk<
  { companyId: number; message: string },
  number,
  { rejectValue: string }
>(
  'companies/deleteCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete company');
      }

      const data: { message: string } = await response.json();
      return { companyId, message: data.message };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete company');
    }
  }
);

// ==================== COMPANY SLICE ====================

const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCompany: (state) => {
      state.currentCompany = null;
    },
    // No getCompanyNameById reducer - use selector instead
  },
  extraReducers: (builder) => {
    builder
      // Fetch Companies
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action: PayloadAction<Company[]>) => {
        state.loading = false;
        state.companies = action.payload;
        state.error = null;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Company By ID
      .addCase(fetchCompanyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action: PayloadAction<Company>) => {
        state.loading = false;
        state.currentCompany = action.payload;
        state.error = null;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Company
      .addCase(createCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action: PayloadAction<Company>) => {
        state.loading = false;
        state.companies.push(action.payload);
        state.error = null;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Company
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action: PayloadAction<Company>) => {
        state.loading = false;
        const updatedCompany = action.payload;
        const index = state.companies.findIndex(company => company.id === updatedCompany.id);
        if (index !== -1) {
          state.companies[index] = updatedCompany;
        }
        if (state.currentCompany && state.currentCompany.id === updatedCompany.id) {
          state.currentCompany = updatedCompany;
        }
        state.error = null;
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Company
      .addCase(deleteCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action: PayloadAction<{ companyId: number; message: string }>) => {
        state.loading = false;
        state.companies = state.companies.filter(company => company.id !== action.payload.companyId);
        if (state.currentCompany && state.currentCompany.id === action.payload.companyId) {
          state.currentCompany = null;
        }
        state.error = null;
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentCompany } = companySlice.actions;
export default companySlice.reducer;