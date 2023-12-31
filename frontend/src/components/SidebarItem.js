import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

const activeLink = ({isActive}) => (
    isActive ? "underline" : ""
) 
const activeSubLink = ({isActive}) => (
    isActive ? "underline" : ""
) 

function SidebarItem({item}) {
    const [expandMenu, setExpandMenu] = useState(false)

    if (item.children) {
        return (
            <div >
                <div className='' onClick={() => setExpandMenu(!expandMenu)}>
                    <span>
                        {item.title} ➡️
                    </span>
                </div>
                <div className={expandMenu ? "" : "hidden"}>
                    {item.children.map((child, index) => {
                        return(
                            <div key={index}>
                                <NavLink to={child.path} className={activeSubLink}> <span>{child.title}</span> </NavLink>
                            </div>
                        )
                    })}
                </div>

            </div>

        )
    } else {
        return (
            <NavLink to={item.path} className={activeLink}> {item.title} </NavLink>
        )
    }


}

export default SidebarItem