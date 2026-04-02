
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './app/App.tsx';
import './styles/index.css';
import { store } from './app/store.ts';

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
      <App />
    </Provider>
  );