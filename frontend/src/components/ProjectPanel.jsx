import { useState } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import api from '../api';

function ProjectPanel({ onProjectCreated }) {
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await api.post('/projects', { name: newProjectName, description: newProjectDesc });
            setNewProjectName('');
            setNewProjectDesc('');
            onProjectCreated(res.data?.id); // Le Dashboard recharge la liste et sélectionne le nouveau projet
        } catch (err) {
            console.error("Erreur création projet", err);
            alert("Erreur lors de la création du projet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h3 className="card-title"><FolderPlus size={18} /> Nouveau projet</h3>
                    <p className="card-subtitle">Il devient le projet actif dès sa création.</p>
                </div>
            </div>
            <form onSubmit={handleCreateProject} className="stack">
                <div className="field">
                    <label className="label" htmlFor="project-name">Nom du projet</label>
                    <input
                        id="project-name"
                        className="input"
                        type="text"
                        placeholder="ex : Immunothérapie Alzheimer"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        required
                    />
                </div>
                <div className="field">
                    <label className="label" htmlFor="project-desc">Description <span className="muted">(optionnelle)</span></label>
                    <textarea
                        id="project-desc"
                        className="textarea"
                        value={newProjectDesc}
                        onChange={e => setNewProjectDesc(e.target.value)}
                        rows="3"
                    ></textarea>
                </div>
                <button type="submit" className="btn btn-block" disabled={isLoading}>
                    <Plus size={16} />
                    {isLoading ? 'Création...' : 'Créer le projet'}
                </button>
            </form>
        </div>
    );
}

export default ProjectPanel;
