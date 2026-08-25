import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content-col">
        <NavBar />
        <main className="app-main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
