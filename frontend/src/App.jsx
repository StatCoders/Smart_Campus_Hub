import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import "tailwindcss";


function App() {
  const [count, setCount] = useState(0)

  return (
    
      <>
      <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
  Save
</button></>
  )
}

export default App
