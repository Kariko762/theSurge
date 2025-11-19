import { useState } from 'react'
import SettingsDropdown from './SettingsDropdown.jsx'

/**
 * FRAME 1: Login + User/Profile Management Shell
 * Dark desolate terminal frame for authentication
 */

const LoginFrame = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  // Placeholder async function for user creation
  const createUser = async () => {
    setStatus('INITIALIZING NEW PROFILE...');
    // TODO: Implement user creation logic
    setTimeout(() => {
      setStatus('PROFILE CREATED // AWAITING VERIFICATION');
    }, 1500);
  };

  // Placeholder async function for user login
  const loginUser = async () => {
    setStatus('ACCESSING TERMINAL...');
    // TODO: Implement login logic
    setTimeout(() => {
      setStatus('ACCESS GRANTED // LOADING SYSTEMS');
    }, 1500);
  };

  // Placeholder async function for profile loading
  const loadProfile = async () => {
    setStatus('SCANNING PROFILES...');
    // TODO: Implement profile loading logic
    setTimeout(() => {
      setStatus('PROFILE LOADED // STANDING BY');
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser();
    if (onLogin) {
      setTimeout(() => onLogin(), 1500);
    }
  };

  return (
    <div className="terminal-frame">
      <SettingsDropdown />
      <div className="login-container holo-glow flicker fade-in-up">
        <h1 className="login-header holo-text">
          TERMINAL ACCESS
        </h1>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">User ID</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="station.user@grid.net"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Access Code</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {status && (
            <div className="form-group">
              <p className="holo-text text-center" style={{ fontSize: '11px' }}>
                {'> '}{status}
              </p>
            </div>
          )}

          <div className="button-group">
            <button
              type="button"
              className="terminal-button"
              onClick={createUser}
            >
              Create Profile
            </button>
            <button
              type="submit"
              className="terminal-button"
            >
              Access Terminal
            </button>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="terminal-button"
              onClick={loadProfile}
              style={{ width: '100%' }}
            >
              Load Existing Profile
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <p className="text-muted" style={{ fontSize: '9px', letterSpacing: '1px' }}>
            GRID STATION ALPHA-7 // DECOMMISSIONED
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginFrame;
