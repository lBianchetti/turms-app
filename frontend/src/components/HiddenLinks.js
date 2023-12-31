import {useSelector} from 'react-redux'
import {selectIsLoggedIn} from '../redux/features/auth/authSlice'

export function ShowOnLogin({children}) {
  const isLoggedIn = useSelector(selectIsLoggedIn)
    
    if(isLoggedIn) {
        return <>{children}</>
    } else{
        return null
    }
}

export function ShowOnLogout({children}) {
    const isLoggedIn = useSelector(selectIsLoggedIn)
      
      if(!isLoggedIn) {
          return <>{children}</>
      } else{
          return null
      }
  }