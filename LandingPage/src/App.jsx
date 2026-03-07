import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import { LandingPage } from './modules/mainPage/containers/LandingPage';

function App() {
  return (
    <Router>
      <div className="appSpace">
        <Routes>
          {/* Usa "/" para la página principal por estándar */}
          <Route path="/*" element={<LandingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;