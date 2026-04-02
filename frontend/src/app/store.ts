import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { emptySplitApi } from '../services/emptyApi';
import cartReducer from '../features/cart/cartSlice';
import uiReducer from '../features/materials/materialSlice';

const rootReducer = combineReducers({
  cart: cartReducer,
  ui: uiReducer,
  [emptySplitApi.reducerPath]: emptySplitApi.reducer
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(emptySplitApi.middleware),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
