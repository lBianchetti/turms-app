import React from 'react'

function Card({children, cardClass}) {
  return (
    <div className={`${cardClass} `}>
        {children}
    </div>
  )
}

export default Card