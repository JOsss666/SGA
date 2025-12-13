import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import { AlertProvider,AppInfoProvider,PreviewProvider,AiAssistanProvider, NotificationsProvider } from './context/context';
import { LandingPage } from './modules/LandingPage/containers/LandingPage';
import { Login } from './modules/Login/Login';
import { SignUp } from './modules/Login/SignUp';
import { UserApp } from './modules/userApp/containers/UserApp';
//export const urlSer = 'http://localhost:3000';
export const urlSer = 'https://sga-2zgp.onrender.com';

function App() {
  return (
    <NotificationsProvider>
        <div className="appSpace">
          <Router>
                <Routes>
                    <Route path="" element={<><span>LandingPage Proceso</span></>}/>
                    <Route path="/SGA_INVENTORY/login" element={
                      <AppInfoProvider>
                        <Login/>
                      </AppInfoProvider>
                    }/>
                    <Route path="/SGA_INVENTORY/SignUp" element={
                      <AppInfoProvider>
                        <SignUp/>
                      </AppInfoProvider>
                    }/>
                    <Route path='/SGA_Inventarios/*' element={<LandingPage/>}/>
                    <Route path="/aboutUs" element={<><span>SGA_procesos - Sobre Nosotros</span></>}/>
                    <Route path='/404' element={<span>404 Not found</span>}/>
                    <Route path='/SGA_INVENTORY/:company_key/:user_key/*' element={<>
                      <AppInfoProvider>
                      <AlertProvider>
                            <PreviewProvider>
                              <AiAssistanProvider>
                                  <UserApp/>
                              </AiAssistanProvider>
                            </PreviewProvider>
                        </AlertProvider>
                      </AppInfoProvider>
                    </>} />
                </Routes>
            </Router>
        </div>
    </NotificationsProvider>
  )
}


export default App
