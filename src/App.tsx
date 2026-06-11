import { useState, useEffect } from 'react';
import Workbench from './pages/Workbench';
import Analysis from './pages/Analysis';
import DataManagement from './pages/DataManagement';

type Page = 'workbench' | 'analysis' | 'data';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('workbench');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as Page;
      if (['workbench', 'analysis', 'data'].includes(hash)) {
        setCurrentPage(hash);
      }
    };

    const handlePopState = () => {
      handleHashChange();
    };

    if (!window.location.hash) {
      window.location.hash = '#workbench';
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (page: Page) => {
    window.location.hash = `#${page}`;
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'workbench':
        return <Workbench />;
      case 'analysis':
        return <Analysis />;
      case 'data':
        return <DataManagement />;
      default:
        return <Workbench />;
    }
  };

  return (
    <AppContext.Provider value={{ currentPage, navigateTo }}>
      {renderPage()}
    </AppContext.Provider>
  );
}

import { createContext, useContext } from 'react';

interface AppContextType {
  currentPage: Page;
  navigateTo: (page: Page) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default App;
