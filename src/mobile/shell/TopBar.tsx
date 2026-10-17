import { Bell, Camera } from 'reicon-react';
import { useNavigate } from 'react-router-dom';

const TopBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="m-top">
      <h1 className="m-top__title">Trim</h1>

      <button
        className="m-top__action"
        type="button"
        aria-label="Trimo"
        onClick={() => navigate('/ai')}
      >
        <Bell size={20} aria-hidden="true" />
      </button>

      <button
        className="m-top__action"
        type="button"
        aria-label="Haircut filters"
        onClick={() => navigate('/camera')}
      >
        <Camera size={20} aria-hidden="true" />
      </button>
    </header>
  );
};

export default TopBar;