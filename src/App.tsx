import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ManualPage from './pages/ManualPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/manual" element={<ManualPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;