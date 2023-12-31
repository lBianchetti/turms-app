import React, { useState } from 'react'
import Card from '../../components/Card'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch } from 'react-redux'
import { SET_LOGIN, SET_NAME } from '../../redux/features/auth/authSlice'
import Loader from '../../components/Loader'
import { loginUser, validateEmail } from '../../services/authService'

const initialState = {email: "", password: ""}


function Login() {

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState(initialState)
  const {email, password} = formData

  function handleInputChange(e) {
    const {name, value} = e.target
    setFormData({...formData, [name]: value})
  }

  async function login(e){
    e.preventDefault()

    if(!email || !password){
      return toast.error("all fields are required")
    }

    if(!validateEmail(email)){
      return toast.error("email is not valid")
    }

    const userData = {email, password}

    setIsLoading(true)

    try {
      const data = await loginUser(userData)
      console.log(data);
      await dispatch(SET_LOGIN(true))
      await dispatch(SET_NAME(data.name))
      navigate("/dashboard")
      setIsLoading(false)
    } catch (error) {
      setIsLoading(true)
      console.log(error)
    }

  }


  return (
    <div className='mx-auto w-80 p-2 mt-40 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'>
      {isLoading && <Loader />}
      <Card>
        <form onSubmit={login} className='mx-auto flex flex-col gap-2'>
          <input type="email" placeholder=" email" name="email" value={email} onChange={handleInputChange} required className='bg-yellow-50 '/>
          <input type="password" placeholder=" password" name="password" value={password} onChange={handleInputChange} required className='bg-yellow-50 '/>
          <button type="submit" className='bg-yellow-300'>Login</button>
        </form>

        <div className='mb-4'>
          <Link to="/forgotpassword">Forgot password?</Link>
        </div>

        <span className='flex flex-row justify-between'>
          <Link to="/">Home</Link>
      
          <Link to="/register"><span className='text-slate-500'>Don't have an account? </span> <span className='p-1 bg-yellow-300'>Register</span></Link>
        </span>
      </Card>
    </div>
  )
}

export default Login