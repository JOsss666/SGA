import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import { GerenceApp } from './modules/GerenceApp/containers/GerenceApp';
import { AlertProvider,AppInfoProvider } from './context/context';

export const urlSer = 'http://localhost:3000';

function App() {
  return (
      <AlertProvider>
        <div className='AppSpace'>
          <AppInfoProvider>
            <Router>
              <Routes>
                  <Route path="/SGA_INVENTORY" element={<><span>LandingPage Inventario</span></>}/>
                  <Route path="/SGA_INVENTORY/aboutUs" element={<><span>SGA - Sobre Nosotros</span></>}/>
                  <Route path='/SGA_INVENTORY/404' element={<span>404 Not found</span>}/>
                  <Route path='/SGA_INVENTORY/:companyKey/:gerenceKey/:userKey/SGA/*' element={<GerenceApp/>} />
              </Routes>
            </Router>
          </AppInfoProvider>
        </div>
      </AlertProvider>
  )
}

export default App
