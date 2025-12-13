import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import { UserApp } from './modules/userApp/containers/UserApp';
import { AiAssistanProvider, AlertProvider, AppInfoProvider, NotificationsProvider, PreviewProvider } from './context/context';
import { Login } from './modules/Login/Login';
import { SignUp } from './modules/Login/SignUp';
export const urlSer = 'http://localhost:3000';
//export const urlSer = 'https://sga-2zgp.onrender.com';

function App() {
  return (
    <NotificationsProvider>
        <div className="appSpace">
          <Router>
                <Routes>
                    <Route path="" element={
                      <AppInfoProvider>
                        <Login/>
                      </AppInfoProvider>
                    }/>
                    <Route path="/SGA_management/login" element={
                      <AppInfoProvider>
                        <Login/>
                      </AppInfoProvider>
                    }/>
                    <Route path="/SGA_management/SignUp" element={
                      <AppInfoProvider>
                        <SignUp/>
                      </AppInfoProvider>
                    }/>
                    <Route path="/aboutUs" element={<><span>SGA_procesos - Sobre Nosotros</span></>}/>
                    <Route path='/404' element={<span>404 Not found</span>}/>
                    <Route path='/SGA_management/:company_key/:user_key/*' element={<>
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
