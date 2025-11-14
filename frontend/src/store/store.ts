import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlice';
import taskReducer from './slices/taskSlice';
import projectReducer from './slices/projectSlice';
import companyReducer from './slices/CompanySlice';
import commentsRatingsReducer from './slices/commentsRatingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    projects: projectReducer,
    companies: companyReducer,
    commentsRatings: commentsRatingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;