import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MaterialState {
  materialsSearchQuery: string;
  materialsSelectedTags: string[];
  materialsSelectedStoreIds: string[];
  clientsSearchQuery: string;
  clientsSelectedClientIds: string[];
}

const initialState: MaterialState = {
  materialsSearchQuery: '',
  materialsSelectedTags: [],
  materialsSelectedStoreIds: [],
  clientsSearchQuery: '',
  clientsSelectedClientIds: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMaterialsSearchQuery(state, action: PayloadAction<string>) {
      state.materialsSearchQuery = action.payload;
    },
    setMaterialsSelectedTags(state, action: PayloadAction<string[]>) {
      state.materialsSelectedTags = action.payload;
    },
    setMaterialsSelectedStoreIds(state, action: PayloadAction<string[]>) {
      state.materialsSelectedStoreIds = action.payload;
    },
    setClientsSearchQuery(state, action: PayloadAction<string>) {
      state.clientsSearchQuery = action.payload;
    },
    setClientsSelectedClientIds(state, action: PayloadAction<string[]>) {
      state.clientsSelectedClientIds = action.payload;
    }
  }
});

export const {
  setMaterialsSearchQuery,
  setMaterialsSelectedTags,
  setMaterialsSelectedStoreIds,
  setClientsSearchQuery,
  setClientsSelectedClientIds
} = uiSlice.actions;

export default uiSlice.reducer;
