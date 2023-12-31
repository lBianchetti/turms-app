import React, { useState } from 'react'
import Card from '../../components/Card'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { resetPassword } from '../../services/authService'

const initialState = {password: "", password2: ""}

function Reset() {
  
  const [formData, setDormData] = useState(initialState)
  const {password, password2} = formData
  const {resetToken} = useParams()

  function handleInputChange(e) {
    const {name, value} = e.target
    setDormData({...formData, [name]: value})
  }

  async function reset(e) {
    e.preventDefault()

    if(!password || !password2){
      return toast.error("all fields are required")
    }

    if(password !== password2){
      return toast.error("passwords don't match")
    }

    const userData= {password, password2}

    try {
      const data = await resetPassword(userData, resetToken)
      toast.success(data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }


  return (
    <div className='mx-auto w-80 p-2 mt-40 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'>
    <Card>
      <form onSubmit={reset} className='mx-auto flex flex-col gap-2'>
        <input type="password" placeholder=" new password" name="password" value={password} onChange={handleInputChange} required className='bg-yellow-50 '/>
        <input type="password" placeholder=" confirm new password" name="password2" value={password2} onChange={handleInputChange} required className='bg-yellow-50 '/>
        <button type="submit" className='bg-yellow-300'>Get reset email</button>
      </form>

      <span className='flex flex-row justify-between'>
        <Link to="/">Home</Link>
    
        <Link to="/login">Login</Link>
      </span>
    </Card>
  </div>
  )
}

export default Reset