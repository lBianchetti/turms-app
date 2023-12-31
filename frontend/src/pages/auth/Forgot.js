import React, { useState } from 'react'
import Card from '../../components/Card'
import { Link } from 'react-router-dom'
import { forgotPassword, validateEmail } from '../../services/authService'
import { toast } from 'react-toastify'

function Forgot() {

  const [email, setEmail] = useState("")

  async function forgot(e) {
    e.preventDefault()

    if(!email){
      return toast.error("all fields are required")
    }

    if(!validateEmail(email)){
      return toast.error("email is not valid")
    }

    const userData = {email}

    await forgotPassword(userData)
    setEmail("")

  }

  return (
    <div className='mx-auto w-80 p-2 mt-40 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'>
      <Card>
        <form onSubmit={forgot} className='mx-auto flex flex-col gap-2'>
          <input type="email" placeholder="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required className='bg-yellow-50 text-center'/>
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

export default Forgot