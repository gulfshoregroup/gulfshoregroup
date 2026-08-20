import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "./slices/searchSlice";
import { useDispatch } from "react-redux";

export const makeStore = () => {
	return configureStore({
		reducer: {
			search: searchReducer,
		},
	});
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export const useAppDispatch = () => useDispatch<AppDispatch>();
