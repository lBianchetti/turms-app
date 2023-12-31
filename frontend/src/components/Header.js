import React from 'react'
import { logoutUser } from '../services/authService'
import { SET_LOGIN, selectName } from '../redux/features/auth/authSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'




function Header() {

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const name = useSelector(selectName)
  
  async function logout() {
    await logoutUser()
    await dispatch(SET_LOGIN(false))
    navigate("/")
  }


  return (
    <div>
      <div>
        <h3><span>Welcome, </span><span>{name}</span></h3>
        <button onClick={logout}>Logout</button>
      </div>
      <hr />
    </div>
  )
}

export default Header