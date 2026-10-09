import { Bell, Search, User } from 'lucide-react';
import './TopBar.css';
const TopBar = ({ user }) => {
  return (
    <header className="topbar-wrapper">
      <div className="gov-marquee">
        <div className="marquee-track">
            <span className="marquee-content">
            SAHAYA AI — Intelligent Community Assistance &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            Connected communities. Faster resolution. &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            AI-powered support for citizens and responders &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          </span>
          <span className="marquee-content" aria-hidden="true">
            SAHAYA AI — Intelligent Community Assistance &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            Connected communities. Faster resolution. &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            AI-powered support for citizens and responders &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>
      <div className="topbar">
        <div className="topbar__left">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="Emblem of India"
            className="topbar__emblem"
          />
          <div className="topbar__gov-text">
            <span className="topbar__gov-title">SAHAYA AI</span>
            <span className="topbar__gov-sub">Intelligent Community Assistance & Emergency Response</span>
          </div>
        </div>
        <div className="topbar__right">
          <div className="topbar__search">
            <Search size={15} className="topbar__search-icon" />
            <input type="text" placeholder="Search complaints..." />
          </div>
          <button className="topbar__bell">
            <Bell size={18} />
            <span className="topbar__bell-dot" />
          </button>
          <div className="topbar__user">
            <div className="topbar__user-avatar">
              <User size={14} />
            </div>
            <div>
              <div className="topbar__user-name">{user?.name || 'User'}</div>
              <div className="topbar__user-role">{user?.role || 'citizen'}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
export default TopBar;
