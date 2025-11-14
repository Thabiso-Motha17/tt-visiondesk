// commentsRatingsSelectors.ts
import type{ RootState } from '../store';

export const selectComments = (state: RootState) => state.commentsRatings.comments;
export const selectCommentsLoading = (state: RootState) => state.commentsRatings.commentsLoading;
export const selectCommentsError = (state: RootState) => state.commentsRatings.commentsError;

export const selectRatings = (state: RootState) => state.commentsRatings.ratings;
export const selectAverageRatings = (state: RootState) => state.commentsRatings.averageRatings;
export const selectRatingsLoading = (state: RootState) => state.commentsRatings.ratingsLoading;
export const selectRatingsError = (state: RootState) => state.commentsRatings.ratingsError;

export const selectAddCommentLoading = (state: RootState) => state.commentsRatings.addCommentLoading;
export const selectAddRatingLoading = (state: RootState) => state.commentsRatings.addRatingLoading;

// Memoized selectors with proper typing
export const selectCommentsByProject = (projectId: number) => (state: RootState) =>
  state.commentsRatings.comments.filter(comment => comment.project_id === projectId);

export const selectCommentsByTask = (taskId: number) => (state: RootState) =>
  state.commentsRatings.comments.filter(comment => comment.task_id === taskId);

export const selectRatingsByProject = (projectId: number) => (state: RootState) =>
  state.commentsRatings.ratings.filter(rating => rating.project_id === projectId);

export const selectRatingsByTask = (taskId: number) => (state: RootState) =>
  state.commentsRatings.ratings.filter(rating => rating.task_id === taskId);

export const selectAverageRatingByProject = (projectId: number) => (state: RootState) =>
  state.commentsRatings.averageRatings[`project_${projectId}`];

export const selectAverageRatingByTask = (taskId: number) => (state: RootState) =>
  state.commentsRatings.averageRatings[`task_${taskId}`];

export const selectUserRatingForProject = (projectId: number, userId: number) => (state: RootState) =>
  state.commentsRatings.ratings.find(rating => 
    rating.project_id === projectId && rating.author_id === userId
  );

export const selectUserRatingForTask = (taskId: number, userId: number) => (state: RootState) =>
  state.commentsRatings.ratings.find(rating => 
    rating.task_id === taskId && rating.author_id === userId
  );