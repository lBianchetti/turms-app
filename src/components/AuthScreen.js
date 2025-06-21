import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Truck } from 'lucide-react';
import { auth } from '../config/firebase'; // Importa da nova localização

const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message.includes('auth/invalid-email') ? 'Email inválido.' :
                     err.message.includes('auth/wrong-password') ? 'Senha incorreta.' :
                     err.message.includes('auth/email-already-in-use') ? 'Este email já está em uso.' :
                     'Ocorreu um erro. Tente novamente.');
            console.error("Erro de autenticação:", err.code, err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <Truck className="w-16 h-16 mx-auto text-sky-600" />
                    <h1 className="mt-4 text-3xl font-bold text-gray-800">Turms</h1>
                    <p className="text-gray-500">Sistema Integrado de Logística</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-6">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email do operador" required className="w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:ring-sky-500 focus:border-sky-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required minLength="6" className="w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:ring-sky-500 focus:border-sky-500" />
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 transition-all duration-300">
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>
                <p className="text-sm text-center text-gray-500">
                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-2 font-semibold text-sky-600 hover:underline">
                        {isLogin ? 'Cadastre-se' : 'Faça login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthScreen;
