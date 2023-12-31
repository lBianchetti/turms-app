import React from 'react'
import { Link } from 'react-router-dom'
import { ShowOnLogin, ShowOnLogout } from '../../components/HiddenLinks'


function Home() {
  return (
    <div>
        <ul>
          <ShowOnLogout>
            <li><Link to="/register">Register</Link></li>
          </ShowOnLogout>

          <ShowOnLogout>
            <li><Link to="/login">Login</Link></li>
          </ShowOnLogout>

          <ShowOnLogin>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ShowOnLogin>
        </ul>
    </div>
  )
}

export default Home