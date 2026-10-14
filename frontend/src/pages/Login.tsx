import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoginForm } from '@/ui';
import { useAuth } from '@/stores/auth.store';

export function Login() {
  const navigate = useNavigate();
  const { loginWithResult } = useAuth();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const handleSubmit = async (data: { correo: string; clave: string }) => {
    const result = await loginWithResult({ ...data, cuenta: 'plataforma' });
    if (result.ok) {
      toast.success('Bienvenido a Zoe');
      navigate('/');
    }
    return result;
  };

  return (
    <div
      className="k-app"
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        background: '#0C0E0D',
        color: '#ECEDEA',
      }}
    >
      <LoginForm
        onSubmit={handleSubmit}
        onProvider={() => toast.info('Inicio con Google próximamente')}
        onRecover={() => navigate('/recuperar')}
        onRequestAccess={() => navigate('/register')}
      />
    </div>
  );
}