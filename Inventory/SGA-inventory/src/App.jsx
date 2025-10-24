import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import { GerenceApp } from './modules/GerenceApp/containers/GerenceApp';
import { AlertProvider,AppInfoProvider,PreviewProvider,AiAssistanProvider, NotificationsProvider } from './context/context';
import { LandingPage } from './modules/LandingPage/containers/LandingPage';
import { Login } from '../../../Process/SGA-process/src/modules/Login/Login';

export const urlSer = 'http://localhost:3000';

function App() {
  return (
    <NotificationsProvider>
      <AlertProvider>
        <div className='AppSpace'>
          <AppInfoProvider>
            <Router>
              <Routes>
                  <Route path="/SGA_inventarios/logIn" element={
                    <AppInfoProvider>
                      <Login/>
                    </AppInfoProvider>
                  }/>
                  <Route path='/SGA_Inventarios/*' element={<LandingPage/>}/>
                  <Route path="/SGA_INVENTORY" element={<><span>LandingPage Inventario</span></>}/>
                  <Route path="/SGA_INVENTORY/aboutUs" element={<><span>SGA - Sobre Nosotros</span></>}/>
                  <Route path='/SGA_INVENTORY/404' element={<span>404 Not found</span>}/>
                  <Route path='/SGA_INVENTORY/:company_key/:user_key/*' element={<>
                      <AlertProvider>
                          <AppInfoProvider>
                            <PreviewProvider>
                              <AiAssistanProvider>
                                  <GerenceApp/>
                              </AiAssistanProvider>
                            </PreviewProvider>
                          </AppInfoProvider>
                      </AlertProvider>
                    </>} />
              </Routes>
            </Router>
          </AppInfoProvider>
        </div>
      </AlertProvider>
    </NotificationsProvider>
  )
}

export default App
