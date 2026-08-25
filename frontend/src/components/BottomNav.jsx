import { NavLink } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon"><Home size={19} /></span>
        <span>Trang chủ</span>
      </NavLink>
      <NavLink to="/review" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon"><RotateCcw size={19} /></span>
        <span>Ôn tập</span>
      </NavLink>
    </nav>
  );
}
