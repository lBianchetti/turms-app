import React, { useState } from 'react'
import Card from '../../components/Card'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, validateEmail } from '../../services/authService'
import { toast } from 'react-toastify'
import { useDispatch } from 'react-redux'
import { SET_LOGIN, SET_NAME } from '../../redux/features/auth/authSlice'
import Loader from '../../components/Loader'

const initialState = {name: "", email: "", password: "", password2: ""}

function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setDormData] = useState(initialState)
  const {name, email, password, password2} = formData

  function handleInputChange(e) {
    const {name, value} = e.target
    setDormData({...formData, [name]: value})
  }

  async function register(e) {
    e.preventDefault()

    if(!name || !email || !password){
      return toast.error("all fields are required")
    }

    if(!validateEmail(email)){
      return toast.error("email is not valid")
    }

    if(password !== password2){
      return toast.error("passwords don't match")
    }

    const userData = {name, email, password}

    setIsLoading(true)

    try {
      const data = await registerUser(userData)
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
        <form onSubmit={register} className='mx-auto flex flex-col gap-2'>
          <input type="text" placeholder=" name" name="name" value={name} onChange={handleInputChange} required className='bg-yellow-50 '/>
          <input type="email" placeholder=" email" name="email" value={email} onChange={handleInputChange} required className='bg-yellow-50 '/>
          <input type="password" placeholder=" password" name="password" value={password} onChange={handleInputChange} required className='bg-yellow-50 '/>
          <input type="password" placeholder=" confirm password" name="password2" value={password2} onChange={handleInputChange} required className='bg-yellow-50 '/>


          <button type="submit" className='bg-yellow-300'>Register</button>
        </form>

        <span className='flex flex-row justify-between mt-4'>
          <Link to="/">Home</Link>
      
          <Link to="/login"><span className='text-slate-500'>Already have an account? </span> <span className='p-1 bg-yellow-300'>Login</span></Link>
        </span>
      </Card>
    </div>
  )
}

export default Register