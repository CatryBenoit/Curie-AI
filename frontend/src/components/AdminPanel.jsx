import { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Users, KeyRound, Trash2 } from 'lucide-react';
import api from '../api';

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // État pour le formulaire de création
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Erreur de récupération des utilisateurs :", err);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) {
            return alert("Le nom d'utilisateur et le mot de passe sont requis.");
        }

        setIsLoading(true);
        try {
            await api.post('/admin/users', newUser);
            alert("Utilisateur créé avec succès.");
            setNewUser({ username: '', password: '', role: 'user' }); // Reset du formulaire
            fetchUsers(); // Rafraîchissement de la liste
        } catch (err) {
            alert(`Erreur : ${err.response?.data?.error || "Impossible de créer l'utilisateur."}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (id, username) => {
        if (id === 1) {
            return alert("Impossible de supprimer le compte super-admin principal.");
        }
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${username}" ?`)) {
            return;
        }

        try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error("Erreur suppression utilisateur :", err);
            alert("Erreur lors de la suppression de l'utilisateur.");
        }
    };

    const handleResetPassword = async (id, username) => {
        const newPassword = window.prompt(`Nouveau mot de passe pour « ${username} » :`);
        if (!newPassword) return; // Annulation si le champ est vide

        try {
            await api.post('/admin/reset-password', { userId: id, newPassword });
            alert(`Mot de passe de ${username} réinitialisé.`);
        } catch (err) {
            console.error("Erreur reset mot de passe :", err);
            alert("Erreur lors de la réinitialisation du mot de passe.");
        }
    };

    return (
        <div className="sidebar-col">
            {/* COLONNE GAUCHE : Formulaire de création */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title"><UserPlus size={18} /> Nouveau compte</h3>
                        <p className="card-subtitle">L'utilisateur pourra se connecter immédiatement.</p>
                    </div>
                </div>
                <form onSubmit={handleCreateUser} className="stack">
                    <div className="field">
                        <label className="label" htmlFor="admin-username">Nom d'utilisateur</label>
                        <input
                            id="admin-username"
                            className="input"
                            type="text"
                            placeholder="ex : marie_curie"
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                            autoComplete="off"
                        />
                    </div>
                    <div className="field">
                        <label className="label" htmlFor="admin-password">Mot de passe provisoire</label>
                        <input
                            id="admin-password"
                            className="input"
                            type="text"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            autoComplete="off"
                        />
                    </div>
                    <div className="field">
                        <label className="label" htmlFor="admin-role">Rôle</label>
                        <select
                            id="admin-role"
                            className="select"
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        >
                            <option value="user">Chercheur</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-block" disabled={isLoading}>
                        {isLoading ? 'Création...' : 'Créer le compte'}
                    </button>
                </form>
            </div>

            {/* COLONNE DROITE : Tableau des utilisateurs */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title"><Users size={18} /> Utilisateurs</h3>
                        <p className="card-subtitle">{users.length} compte{users.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Rôle</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="row">
                                            <div className="avatar">{user.username.charAt(0)}</div>
                                            <div>
                                                <strong>{user.username}</strong>
                                                <div className="hint tabular">#{user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {user.role === 'admin'
                                            ? <span className="badge badge-primary"><ShieldCheck size={12} /> Administrateur</span>
                                            : <span className="badge">Chercheur</span>}
                                    </td>
                                    <td className="cell-actions">
                                        <div className="row">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleResetPassword(user.id, user.username)}
                                                title="Réinitialiser le mot de passe"
                                            >
                                                <KeyRound size={14} /> Mot de passe
                                            </button>
                                            {user.id !== 1 && (
                                                <button
                                                    className="btn btn-danger-ghost btn-sm btn-icon"
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    title="Supprimer le compte"
                                                    aria-label={`Supprimer ${user.username}`}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="cell-empty">Aucun utilisateur trouvé.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
