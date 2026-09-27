import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RegisterPage from './pages/RegistrationPage'
import PortfolioPage from './pages/PortfolioPage'
import CreatePortfolioPage from './pages/CreatePortfolioPage'
import PortfolioDetailsPage from './pages/PortfolioDetailsPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage/>}/>
          <Route path="/portfolio" element={<PortfolioPage/>}/>
          <Route path="/create-portfolio" element={<CreatePortfolioPage/>}/>
          <Route path="/portfolio-details" element={<PortfolioDetailsPage/>}/>
          <Route path="/home" element={<DashboardPage/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
