import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, PageRequest, PageInfo, SearchForm } from '@/types';
import { HttpClient } from '@/utils/request';

// 用户管理状态接口
interface UserState {
  users: User[];
  currentUser?: User;
  loading: boolean;
  error?: string;
  pageInfo: PageInfo;
  searchForm: SearchForm;
  selectedUsers: string[];
  statistics: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    lockedUsers: number;
  };
}

// 初始状态
const initialState: UserState = {
  users: [],
  currentUser: undefined,
  loading: false,
  error: undefined,
  pageInfo: {
    current: 1,
    size: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  searchForm: {},
  selectedUsers: [],
  statistics: {
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    lockedUsers: 0,
  },
};

// 异步actions

// 获取用户列表
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (params: PageRequest & SearchForm, { rejectWithValue }) => {
    try {
      const response = await HttpClient.get('/admin/users', params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户列表失败');
    }
  }
);

// 获取用户详情
export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await HttpClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户详情失败');
    }
  }
);

// 创建用户
export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await HttpClient.post('/admin/users', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '创建用户失败');
    }
  }
);

// 更新用户
export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ userId, userData }: { userId: string; userData: Partial<User> }, { rejectWithValue }) => {
    try {
      const response = await HttpClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '更新用户失败');
    }
  }
);

// 删除用户
export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await HttpClient.delete(`/admin/users/${userId}`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || '删除用户失败');
    }
  }
);

// 批量删除用户
export const batchDeleteUsers = createAsyncThunk(
  'user/batchDeleteUsers',
  async (userIds: string[], { rejectWithValue }) => {
    try {
      await HttpClient.post('/admin/users/batch-delete', { userIds });
      return userIds;
    } catch (error: any) {
      return rejectWithValue(error.message || '批量删除用户失败');
    }
  }
);

// 启用/禁用用户
export const toggleUserStatus = createAsyncThunk(
  'user/toggleUserStatus',
  async ({ userId, status }: { userId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await HttpClient.put(`/admin/users/${userId}/status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '更新用户状态失败');
    }
  }
);

// 重置用户密码
export const resetUserPassword = createAsyncThunk(
  'user/resetUserPassword',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await HttpClient.post(`/admin/users/${userId}/reset-password`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '重置密码失败');
    }
  }
);

// 解锁用户账户
export const unlockUser = createAsyncThunk(
  'user/unlockUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await HttpClient.post(`/admin/users/${userId}/unlock`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '解锁用户失败');
    }
  }
);

// 获取用户统计信息
export const fetchUserStatistics = createAsyncThunk(
  'user/fetchUserStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await HttpClient.get('/admin/users/statistics');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '获取统计信息失败');
    }
  }
);

// 导出用户数据
export const exportUsers = createAsyncThunk(
  'user/exportUsers',
  async (params: SearchForm, { rejectWithValue }) => {
    try {
      const response = await HttpClient.get('/admin/users/export', params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '导出用户数据失败');
    }
  }
);

// 创建slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = undefined;
    },

    // 设置搜索表单
    setSearchForm: (state, action: PayloadAction<SearchForm>) => {
      state.searchForm = action.payload;
    },

    // 更新搜索表单
    updateSearchForm: (state, action: PayloadAction<Partial<SearchForm>>) => {
      state.searchForm = { ...state.searchForm, ...action.payload };
    },

    // 清除搜索表单
    clearSearchForm: (state) => {
      state.searchForm = {};
    },

    // 设置选中的用户
    setSelectedUsers: (state, action: PayloadAction<string[]>) => {
      state.selectedUsers = action.payload;
    },

    // 添加选中用户
    addSelectedUser: (state, action: PayloadAction<string>) => {
      if (!state.selectedUsers.includes(action.payload)) {
        state.selectedUsers.push(action.payload);
      }
    },

    // 移除选中用户
    removeSelectedUser: (state, action: PayloadAction<string>) => {
      state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload);
    },

    // 清除选中用户
    clearSelectedUsers: (state) => {
      state.selectedUsers = [];
    },

    // 全选/取消全选
    toggleSelectAll: (state) => {
      if (state.selectedUsers.length === state.users.length) {
        state.selectedUsers = [];
      } else {
        state.selectedUsers = state.users.map(user => user.id);
      }
    },

    // 设置当前用户
    setCurrentUser: (state, action: PayloadAction<User | undefined>) => {
      state.currentUser = action.payload;
    },

    // 重置用户状态
    resetUserState: (state) => {
      state.users = [];
      state.currentUser = undefined;
      state.error = undefined;
      state.selectedUsers = [];
      state.searchForm = {};
      state.pageInfo = initialState.pageInfo;
    },
  },
  extraReducers: (builder) => {
    // 获取用户列表
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.records || [];
        state.pageInfo = action.payload.pageInfo || initialState.pageInfo;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 获取用户详情
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 创建用户
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload);
        state.statistics.totalUsers += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更新用户
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 删除用户
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        state.selectedUsers = state.selectedUsers.filter(id => id !== action.payload);
        state.statistics.totalUsers -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 批量删除用户
    builder
      .addCase(batchDeleteUsers.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(batchDeleteUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => !action.payload.includes(user.id));
        state.selectedUsers = [];
        state.statistics.totalUsers -= action.payload.length;
      })
      .addCase(batchDeleteUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 切换用户状态
    builder
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });

    // 重置用户密码
    builder
      .addCase(resetUserPassword.fulfilled, (state, action) => {
        // 可以在这里处理密码重置成功后的逻辑
      });

    // 解锁用户
    builder
      .addCase(unlockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });

    // 获取用户统计信息
    builder
      .addCase(fetchUserStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });
  },
});

// 导出actions
export const {
  clearError,
  setSearchForm,
  updateSearchForm,
  clearSearchForm,
  setSelectedUsers,
  addSelectedUser,
  removeSelectedUser,
  clearSelectedUsers,
  toggleSelectAll,
  setCurrentUser,
  resetUserState,
} = userSlice.actions;

// 选择器
export const selectUser = (state: { user: UserState }) => state.user;
export const selectUsers = (state: { user: UserState }) => state.user.users;
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser;
export const selectUserLoading = (state: { user: UserState }) => state.user.loading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectUserPageInfo = (state: { user: UserState }) => state.user.pageInfo;
export const selectUserSearchForm = (state: { user: UserState }) => state.user.searchForm;
export const selectSelectedUsers = (state: { user: UserState }) => state.user.selectedUsers;
export const selectUserStatistics = (state: { user: UserState }) => state.user.statistics;

// 导出reducer
export default userSlice.reducer;