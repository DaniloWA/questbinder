import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, AlertCircle, Scroll, Sword, Shield, Dice5, Sparkles } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const { navigateTo } = useNavigation();
  const { show } = useNotification();
  
  // Pre-filled credentials for testing convenience
  const [email, setEmail] = useState('demo@demo.com');
  const [pass, setPass] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) return;
    
    setIsSubmitting(true);
    clearError();
    
    const result = await login({ email, pass });
    
    if (result.success) {
      show({
        type: 'success',
        title: 'Acesso Concedido!',
        message: 'Bem-vindo de volta à guilda, aventureiro.',
        duration: 4000
      });
    } else {
      show({
        type: 'error',
        title: 'Falha no Encantamento',
        message: result.message || 'Suas runas de acesso estão incorretas.',
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Hero / Fantasy Scene */}
      <div className="hidden md:flex md:w-1/2 bg-zinc-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/50 via-zinc-950/80 to-zinc-950 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
        
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-violet-600 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
        <div className="absolute -left-24 bottom-0 w-80 h-80 bg-amber-600 rounded-full blur-[100px] opacity-20"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-violet-500/20 p-2 rounded-lg backdrop-blur-sm border border-violet-500/30">
              <Dice5 className="w-8 h-8 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-wider font-fantasy text-violet-100">QuestBinder</h1>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl font-bold mb-6 leading-tight font-fantasy text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-200">
              Sua Lenda<br/>Começa Aqui.
            </h2>
            <div className="space-y-4">
               <div className="flex items-center gap-4 text-violet-200/80">
                  <div className="p-2 bg-violet-900/50 rounded-full"><Scroll className="w-5 h-5" /></div>
                  <p>Gerencie fichas de D&D, Pathfinder e Tormenta.</p>
               </div>
               <div className="flex items-center gap-4 text-violet-200/80">
                  <div className="p-2 bg-violet-900/50 rounded-full"><Sword className="w-5 h-5" /></div>
                  <p>Encontre grupos e mestres para jogar online.</p>
               </div>
               <div className="flex items-center gap-4 text-violet-200/80">
                  <div className="p-2 bg-violet-900/50 rounded-full"><Shield className="w-5 h-5" /></div>
                  <p>Armazene suas campanhas em segurança.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-500 flex justify-between items-end">
          <p>v2.5.0 - Realm of Shadows</p>
          <p>&copy; 2024 QuestBinder RPG</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background transition-colors">
        <div className="w-full max-w-md space-y-8 relative">
          
          {/* Background glow for form */}
          <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full -z-10 md:hidden"></div>

          <div className="text-center md:text-left">
            <div className="md:hidden flex justify-center mb-4">
               <Dice5 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground font-fantasy tracking-wide">Retorne à Aventura</h2>
            <p className="mt-2 text-muted-foreground">Invoque seu grimório digital e acesse suas fichas.</p>
            
            <div className="mt-4 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800 inline-flex items-center gap-2">
               <Sparkles className="w-4 h-4" />
               <span><strong>Pergaminho de Teste:</strong> demo@demo.com / password</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="E-mail do Aventureiro"
                type="email"
                placeholder="gandalf@condado.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
                required
              />
              <Input
                label="Palavra de Passe"
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-input bg-background checked:bg-primary checked:border-primary transition-all" />
                  <Sparkles className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-primary-foreground w-3 h-3 top-0.5 left-0.5" />
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Manter conectado</span>
              </label>
              <button type="button" className="text-primary font-medium hover:text-primary/80 hover:underline">
                Esqueceu a runa?
              </button>
            </div>

            <Button type="submit" fullWidth isLoading={isSubmitting} className="h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
              Abrir o Portal
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Novo no reino?</span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { clearError(); navigateTo('register'); }}
                className="w-full py-3 px-4 border border-input rounded-md shadow-sm bg-card text-foreground hover:bg-accent hover:text-accent-foreground font-medium transition-colors flex items-center justify-center gap-2 group"
              >
                <Scroll className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                Criar Nova Ficha
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};