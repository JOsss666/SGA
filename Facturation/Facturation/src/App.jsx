import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'
import { UserApp } from './modules/userApp/containers/UserApp';
import { AiAssistanProvider, AlertProvider, AppInfoProvider, NotificationsProvider, PreviewProvider } from './context/context';
import { Login } from './modules/Login/Login';
import { SignUp } from './modules/Login/SignUp';
import { PreviewDocument } from './modules/userApp/containers/Preview/PreviewDocument';
import { PreviewProcess } from './modules/userApp/containers/Preview/PreviewProcess';
//export const urlSer = 'http://localhost:3000';
export const urlSer = 'https://sga-2zgp.onrender.com';
export const isElectron = navigator.userAgent.toLowerCase().includes('electron');


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
                    <Route path='/preview/Document/:company_key/:doc_id' element={
                      <AppInfoProvider>
                        <PreviewDocument/>
                    </AppInfoProvider>}/>
                    <Route path='/preview/Process/:company_key/:instance_id' element={
                      <AppInfoProvider>
                        <PreviewProcess/>
                    </AppInfoProvider>}/>
                </Routes>
            </Router>
        </div>
    </NotificationsProvider>
  )
}

export default App
