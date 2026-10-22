import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoginForm } from '@/ui';
import { useAuth } from '@/stores/auth.store';

export function Login() {
  const navigate = useNavigate();
  const { loginWithResult } = useAuth();

  const handleSubmit = async (data: any) => {
    const result = await loginWithResult(data);
    if (result.ok) {
      toast.success('Bienvenido a Zoe');
      navigate('/');
    }
    return result;
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      onProvider={() => toast.info('Login con proveedor próximamente')}
      onRequestAccess={() => navigate('/register')}
      onRecover={() => navigate('/forgot-password')}
    />
  );
}