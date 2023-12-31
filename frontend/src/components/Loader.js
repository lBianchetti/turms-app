import React from 'react'
import ReactDom from 'react-dom'

function Loader() {
  return ReactDom.createPortal(
    <div>
        <span>😶‍🌫️</span>
    </div>,
    document.getElementById("loader")
  )
}

export function Spinner() {
    return (
      <div>
          <span>🎡</span>
      </div>
    )
  }

export default Loader