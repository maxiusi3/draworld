import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAdapter } from '../lib/adapters/authAdapter';
import { useAuth } from '../hooks/useAuth';

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    if (code) {
      authAdapter.exchangeCode({ code, redirectUri: window.location.origin + '/callback' })
        .then(() => {
          const sess = authAdapter.getSession();
          if (sess) setSession(sess);
          navigate('/');
        })
        .catch(error => {
          console.error('Failed to exchange code for token:', error);
          navigate('/login');
        });
    } else {
      console.error('No code found in URL');
      navigate('/login');
    }
  }, [location, navigate, setSession]);

  return (
    <div>
      <p>正在处理登录回调，请稍候...</p>
    </div>
  );
};

export default CallbackPage;