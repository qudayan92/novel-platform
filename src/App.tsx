import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ManualPage from './pages/ManualPage';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/manual" element={<ManualPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;