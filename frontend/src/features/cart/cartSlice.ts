import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartState {
  currentJobId: number | null;
  isViewingSavedJob: boolean;
  isEditMode: boolean;
  selectedClient: string;
  jobDescription: string;
  cartPreviewScrollTop: number;
  cartPreviewKnownItemIds: number[];
}

const initialState: CartState = {
  currentJobId: null,
  isViewingSavedJob: false,
  isEditMode: true,
  selectedClient: "",
  jobDescription: "",
  cartPreviewScrollTop: 0,
  cartPreviewKnownItemIds: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCurrentJobId(state: CartState, action: PayloadAction<number | null>) {
      state.currentJobId = action.payload;
    },
    setIsViewingSavedJob(state: CartState, action: PayloadAction<boolean>) {
      state.isViewingSavedJob = action.payload;
    },
    setCartEditMode(state: CartState, action: PayloadAction<boolean>) {
      state.isEditMode = action.payload;
    },
    setSelectedClient(state: CartState, action: PayloadAction<string>) {
      state.selectedClient = action.payload;
    },
    setJobDescription(state: CartState, action: PayloadAction<string>) {
      state.jobDescription = action.payload;
    },
    setCartPreviewScrollTop(state: CartState, action: PayloadAction<number>) {
      state.cartPreviewScrollTop = action.payload;
    },
    setCartPreviewKnownItemIds(state: CartState, action: PayloadAction<number[]>) {
      state.cartPreviewKnownItemIds = action.payload;
    },
    resetCartState(state: CartState) {
      state.currentJobId = null;
      state.isViewingSavedJob = false;
      state.isEditMode = true;
      state.selectedClient = "";
      state.jobDescription = "";
      state.cartPreviewScrollTop = 0;
      state.cartPreviewKnownItemIds = [];
    },
  },
});

export const {
  setCurrentJobId,
  setIsViewingSavedJob,
  setCartEditMode,
  setSelectedClient,
  setJobDescription,
  setCartPreviewScrollTop,
  setCartPreviewKnownItemIds,
  resetCartState,
} = cartSlice.actions;
export default cartSlice.reducer;
