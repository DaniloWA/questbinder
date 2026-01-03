import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Mail, Lock, AlertCircle, ArrowLeft, Sword, Crown } from 'lucide-react';

export const RegisterView: React.FC = () => {
  const { register, error, clearError } = useAuth();
  const { navigateTo } = useNavigation();
  const { show } = useNotification();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();
    
    const result = await register({ name, email, pass });
    
    if (result.success) {
      show({
        type: 'success',
        title: 'Personagem Criado!',
        message: `Saudações, ${name}! Sua jornada começa agora.`,
      });
    } else {
      show({
        type: 'warning',
        title: 'Falha na Inscrição',
        message: result.message || 'Não foi possível criar a conta.',
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10"></div>

      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden relative z-10">
        {/* Header with "Classy" RPG look */}
        <div className="px-8 pt-8 pb-6 border-b border-border bg-muted/30 relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
           <button
            onClick={() => { clearError(); navigateTo('login'); }}
            className="mb-6 flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para a Taverna
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg border border-secondary/20">
              <Crown className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground font-fantasy">Junte-se à Guilda</h2>
          </div>
          <p className="text-muted-foreground">Crie seu perfil de mestre ou jogador e organize suas aventuras.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Input
              label="Nome do Personagem (ou Real)"
              placeholder="Ex: Aragorn II"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<Sword className="w-5 h-5" />}
              required
            />

            <Input
              label="E-mail de Contato"
              type="email"
              placeholder="heroi@reino.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <div className="space-y-2">
              <Input
                label="Senha de Proteção"
                type="password"
                placeholder="No mínimo 8 runas"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Proteja seus dados como se fosse um dragão guardando ouro.
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" fullWidth isLoading={isSubmitting} className="h-12 text-lg font-fantasy tracking-wide bg-gradient-to-r from-primary to-violet-700 hover:to-violet-800">
                Criar Conta Gratuita
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Ao entrar na guilda, você aceita o <a href="#" className="underline hover:text-primary">Código de Honra</a> e as <a href="#" className="underline hover:text-primary">Leis do Reino</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};