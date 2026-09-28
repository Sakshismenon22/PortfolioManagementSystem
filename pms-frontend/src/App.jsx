import { BrowserRouter, Route, Routes, Navigate} from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

import RegisterPage from './pages/RegistrationPage'
import PortfolioPage from './pages/PortfolioPage'
import CreatePortfolioPage from './pages/CreatePortfolioPage'
import PortfolioDetailsPage from './pages/PortfolioDetailsPage'
import DashboardPage from './pages/DashboardPage'
import CreateThemePage from "./pages/CreateThemePage";

function App() {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage/>}/>
          <Route path="/portfolio" element={<PortfolioPage/>}/>
          <Route path="/create-portfolio" element={<CreatePortfolioPage/>}/>
          <Route path="/portfolio-details" element={<PortfolioDetailsPage/>}/>
          <Route path="/home" element={<DashboardPage/>}/>
          <Route path="/create-theme" element={<CreateThemePage />}/>
          <Route path = "/*" element={<Navigate to ="/home" replace />} />

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
