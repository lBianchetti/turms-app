import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLoginStatus } from "../services/authService";
import { SET_LOGIN } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";



export function useRedirectLoggedoutUser(path){

  const dispatch = useDispatch()
  const navigate = useNavigate()

    useEffect(() => {
      const redirectLoggedoutUser = async () => {
        const isLoggedIn = await getLoginStatus()
        dispatch(SET_LOGIN(isLoggedIn))
        if(!isLoggedIn){
            toast.info("session expired")
            navigate(path)
            return
        }
      }
      redirectLoggedoutUser()
    }, [navigate, path, dispatch])
    
}