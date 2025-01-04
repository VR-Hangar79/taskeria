import { BrowserRouter as Router } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Benvenuto in Taskeria Admin
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Seleziona una voce dal menu per iniziare a gestire il tuo sistema.
          </p>
        </div>
      </DashboardLayout>
    </Router>
  );
}

export default App;