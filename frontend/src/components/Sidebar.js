import React, { Children } from 'react'
import SidebarItem from './SidebarItem'
import menu from '../data/sidebar.js'
import { Link, useNavigate } from 'react-router-dom'


function Sidebar({children}) {
    
    const navigate = useNavigate()
    const goHome = () => {navigate("/")}

  return (
    <div className='flex flex-row'>
        <div className='bg-yellow-100 h-screen p-4 flex flex-col'>
            <h1 onClick={goHome} className='text-lg font-bold'>Turms</h1>
        

            {menu.map((item, index) => {
                return <SidebarItem key={index} item={item}/>
            })}
        </div>

        

        <main> 
            {/* here goes the app */}
            {children}
        </main>
    </div>
  )
}

export default Sidebar