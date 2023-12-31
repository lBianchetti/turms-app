import { createSlice } from '@reduxjs/toolkit'

const name = JSON.parse(localStorage.getItem("name"))

const initialState = {
    isLoggeedIn: false,
    name: name ? name : "",
    user: {
      name: "",
      email: ""
    }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    SET_LOGIN(state, action) {
      state.isLoggeedIn = action.payload
    },
    SET_NAME(state, action){
      localStorage.setItem("name", JSON.stringify(action.payload))
      state.name = action.payload
    },
    SET_USER(state, action){
      const profile = action.payload
      state.name = profile.user.name
      state.email = profile.user.email
    },

  }
});

export const {SET_LOGIN, SET_NAME, SET_USER} = authSlice.actions

export const selectIsLoggedIn = (state) => state.auth.isLoggeedIn
export const selectName = (state) => state.auth.name
export const selectUser = (state) => state.auth.user

export default authSlice.reducer