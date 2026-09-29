import { useState } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import api from '../api';
import logo from '../assets/logo.png';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { username, password });
            onLogin(response.data); // On envoie les infos de l'utilisateur à App.jsx
        } catch (err) {
            setError(err.response?.data?.error || "Erreur de connexion");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="card login-card">
                <div className="login-brand">
                    <img src={logo} alt="" />
                    <div>
                        <h1>Curie AI</h1>
                        <p className="muted">Connectez-vous à votre espace de recherche</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="stack">
                    {error && (
                        <div className="notice notice-danger">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="field">
                        <label className="label" htmlFor="login-username">Identifiant</label>
                        <input
                            id="login-username"
                            className="input"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="field">
                        <label className="label" htmlFor="login-password">Mot de passe</label>
                        <input
                            id="login-password"
                            className="input"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-block" disabled={isLoading}>
                        <LogIn size={16} />
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
