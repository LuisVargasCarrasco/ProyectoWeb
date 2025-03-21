import { useState } from 'react';
import LoginForm from './LoginFrom';
import RegisterForm from './RegisterForm';

const AuthContainer = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return isLogin ?
    <LoginForm onToggleForm={toggleForm} /> :
    <RegisterForm onToggleForm={toggleForm} />;
};

export default AuthContainer;