import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import MainPage from './MainPage.tsx';

const app = document.getElementById('app'); // Fixed: removed '#' from id
if (app) {
  const root = createRoot(app);
  root.render(
    <BrowserRouter>
      <MainPage />
    </BrowserRouter>,
  );
}
