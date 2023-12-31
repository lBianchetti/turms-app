import React from 'react'
import { useRedirectLoggedoutUser } from '../../custom/useRedirectLoggedoutUser'

function Dashboard() {
  useRedirectLoggedoutUser("/")

  return (
    <div>
        <h2>Dashboard</h2>
    </div>
  )
}

export default Dashboard