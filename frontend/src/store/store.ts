import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlice';
import taskReducer from './slices/taskSlice';
import projectReducer from './slices/projectSlice';
import companyReducer from './slices/CompanySlice';
import ratingsReducer from './slices/ratingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    projects: projectReducer,
    companies: companyReducer,
    ratings: ratingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;