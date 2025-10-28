import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// 导入reducers
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import userReducer from './slices/userSlice';

// 持久化配置
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'app'], // 只持久化auth和app状态
  blacklist: ['user'], // 不持久化user状态（包含敏感数据）
};

// 认证状态持久化配置
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['isAuthenticated', 'user'], // 只持久化必要字段
};

// 应用状态持久化配置
const appPersistConfig = {
  key: 'app',
  storage,
  whitelist: ['theme', 'language', 'sidebarCollapsed'], // 持久化用户偏好
};

// 合并reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  app: persistReducer(appPersistConfig, appReducer),
  user: userReducer, // 不持久化用户管理状态
});

// 持久化根reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 配置store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.DEV,
});

// 创建persistor
export const persistor = persistStore(store);

// 类型定义
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 清理持久化数据
export const clearPersistedData = () => {
  persistor.purge();
};

export default store;