import { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import api from '../api';

function ProjectTeamPanel({ activeProjectId, projectName }) {
    const [members, setMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);

    // États du formulaire d'ajout
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeProjectId) {
            fetchMembers();
            fetchAvailableUsers();
        }
    }, [activeProjectId]);

    const fetchMembers = async () => {
        try {
            const res = await api.get(`/projects/${activeProjectId}/members`);
            setMembers(res.data);
        } catch (err) {
            console.error("Erreur récupération membres:", err);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const res = await api.get('/projects/users-list');
            setAvailableUsers(res.data);
        } catch (err) {
            console.error("Erreur récupération utilisateurs:", err);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserId) return alert("Veuillez sélectionner un utilisateur.");

        setIsLoading(true);
        try {
            await api.post(`/projects/${activeProjectId}/members`, {
                userId: selectedUserId,
                role: selectedRole
            });
            setSelectedUserId(''); // Reset
            fetchMembers(); // Met à jour la liste
        } catch (err) {
            alert(err.response?.data?.error || "Erreur lors de l'ajout.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveMember = async (userId, username) => {
        if (!window.confirm(`Retirer ${username} de ce projet ?`)) return;

        try {
            await api.delete(`/projects/${activeProjectId}/members/${userId}`);
            fetchMembers();
        } catch (err) {
            console.error("Erreur retrait membre:", err);
            alert("Erreur lors du retrait du membre.");
        }
    };

    // Filtrer les utilisateurs pour ne pas afficher ceux qui sont DÉJÀ dans le projet
    const usersNotInProject = availableUsers.filter(
        user => !members.find(member => member.id === user.id)
    );

    return (
        <div className="card card-fill">
            <div className="card-header">
                <div>
                    <h3 className="card-title"><Users size={18} /> Équipe du projet</h3>
                    <p className="card-subtitle">{projectName || `Projet #${activeProjectId}`} · {members.length} membre{members.length > 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* FORMULAIRE D'AJOUT */}
            <form onSubmit={handleAddMember} className="well" style={{ marginBottom: 16 }}>
                <div className="section-title"><UserPlus size={16} /> Inviter un collaborateur</div>
                <div className="row row-wrap">
                    <select
                        className="select grow"
                        style={{ flexBasis: 200 }}
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        aria-label="Utilisateur"
                    >
                        <option value="">Choisir un utilisateur…</option>
                        {usersNotInProject.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>

                    <select
                        className="select"
                        style={{ width: 'auto' }}
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        aria-label="Rôle"
                    >
                        <option value="member">Contributeur</option>
                        <option value="admin">Chef de projet</option>
                    </select>

                    <button type="submit" disabled={isLoading || !selectedUserId} className="btn">
                        {isLoading ? 'Ajout...' : 'Ajouter'}
                    </button>
                </div>
                {usersNotInProject.length === 0 && (
                    <p className="hint" style={{ marginTop: 8 }}>
                        Tous les utilisateurs existants font déjà partie de ce projet.
                    </p>
                )}
            </form>

            {/* LISTE DES MEMBRES */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            <th>Rôle dans le projet</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => (
                            <tr key={member.id}>
                                <td>
                                    <div className="row">
                                        <div className="avatar">{member.username.charAt(0)}</div>
                                        <strong>{member.username}</strong>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${member.role === 'admin' ? 'badge-primary' : ''}`}>
                                        {member.role === 'admin' ? 'Chef de projet' : 'Contributeur'}
                                    </span>
                                </td>
                                <td className="cell-actions">
                                    <button
                                        className="btn btn-danger-ghost btn-sm"
                                        onClick={() => handleRemoveMember(member.id, member.username)}
                                    >
                                        <UserMinus size={14} /> Retirer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan="3" className="cell-empty">
                                    Personne n'est assigné à ce projet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProjectTeamPanel;
