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
import CreateThemePage from "./pages/CreateThemePage";
import { ToastContainer } from 'react-toastify'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage/>}/>
          <Route path="/portfolio" element={<PortfolioPage/>}/>
          <Route path="/create-portfolio" element={<CreatePortfolioPage/>}/>
          <Route path="/portfolio/:id" element={<PortfolioDetailsPage/>}/>
          <Route path="/home" element={<DashboardPage/>}/>
          <Route path="/create-theme" element={<CreateThemePage />}
/>
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
    </>
  )
}

export default App
