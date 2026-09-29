import { useState, useEffect, useCallback } from 'react';
import {
    FolderKanban, Library, FlaskConical, BarChart3, MessagesSquare,
    ShieldCheck, Settings, LogOut
} from 'lucide-react';
import api from '../api';
import logo from '../assets/logo.png'; // Import du logo Curie AI
import ProjectPanel from './ProjectPanel';
import ResearchPanel from './ResearchPanel';
import LibraryPanel from './LibraryPanel';
import SynthesisPanel from './SynthesisPanel';
import TerminalPanel from './TerminalPanel';
import ChatbotPanel from './ChatbotPanel';
import SettingsModal from './SettingsModal';
import DataVizPanel from './DataVizPanel';
import ExportPanel from './ExportPanel';
import GraphPanel from './GraphPanel';
import AdminPanel from './AdminPanel';
import ProjectTeamPanel from './ProjectTeamPanel';
import DiscussionPanel from './DiscussionPanel';

// Vues du tableau de bord : titre, sous-titre et icône de navigation
const VIEWS = {
    projects: { label: 'Projets', title: 'Projets', subtitle: 'Créez un projet et gérez son équipe.', icon: FolderKanban },
    library: { label: 'Bibliothèque', title: 'Bibliothèque', subtitle: 'Documents collectés et analysés pour ce projet.', icon: Library, needsProject: true },
    workspace: { label: 'Espace de travail', title: 'Espace de travail', subtitle: 'Collecte, synthèse et questions sur vos articles.', icon: FlaskConical, needsProject: true },
    dataviz: { label: 'Visualisation', title: 'Visualisation', subtitle: 'Graphiques et thèmes extraits par l\'IA.', icon: BarChart3, needsProject: true },
    discussions: { label: 'Discussions', title: 'Discussions', subtitle: 'Notes partagées avec l\'équipe du projet.', icon: MessagesSquare, needsProject: true },
    admin: { label: 'Administration', title: 'Administration', subtitle: 'Comptes utilisateurs et accès.', icon: ShieldCheck, adminOnly: true },
};

function Dashboard({ user, onLogout }) {
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [currentView, setCurrentView] = useState('projects');

    const fetchProjects = useCallback(async (selectId) => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
            // On garde le projet courant s'il existe encore, sinon on prend le premier
            setActiveProjectId(prev => {
                const wanted = selectId ?? prev;
                if (wanted && res.data.some(p => String(p.id) === String(wanted))) return wanted;
                return res.data[0]?.id ?? null;
            });
        } catch (err) {
            console.error("Erreur chargement projets", err);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const activeProject = projects.find(p => String(p.id) === String(activeProjectId));
    const view = VIEWS[currentView];

    return (
        <div className="app-layout">
            {/* BARRE LATÉRALE */}
            <aside className="sidebar">
                <div className="brand">
                    <img src={logo} alt="" />
                    <span className="brand-name">Curie AI</span>
                </div>

                <div className="sidebar-section">
                    <label className="sidebar-label" htmlFor="project-picker">Projet actif</label>
                    <select
                        id="project-picker"
                        className="select"
                        value={activeProjectId ?? ''}
                        onChange={(e) => setActiveProjectId(e.target.value)}
                        disabled={projects.length === 0}
                    >
                        {projects.length === 0 && <option value="">Aucun projet</option>}
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <nav className="sidebar-nav">
                    {Object.entries(VIEWS).map(([key, v]) => {
                        if (v.adminOnly && user?.role !== 'admin') return null;
                        const Icon = v.icon;
                        return (
                            <button
                                key={key}
                                className={`nav-item ${currentView === key ? 'active' : ''}`}
                                onClick={() => setCurrentView(key)}
                                disabled={v.needsProject && !activeProjectId}
                                title={v.needsProject && !activeProjectId ? 'Sélectionnez un projet' : undefined}
                            >
                                <Icon size={18} />
                                {v.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-chip">
                        <div className="avatar">{(user?.username || '?').charAt(0)}</div>
                        <div className="grow">
                            <div className="user-chip-name">{user?.username || 'Chercheur'}</div>
                            <div className="user-chip-role">{user?.role === 'admin' ? 'Administrateur' : 'Chercheur'}</div>
                        </div>
                    </div>
                    <button className="nav-item" onClick={() => setShowSettings(true)} title="Paramètres IA">
                        <Settings size={18} />
                        <span className="nav-label">Paramètres IA</span>
                    </button>
                    <button className="nav-item" onClick={onLogout} title="Déconnexion">
                        <LogOut size={18} />
                        <span className="nav-label">Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* CONTENU PRINCIPAL */}
            <main className="main-content">
                <header className="main-header">
                    <h1>{view.title}</h1>
                    <p className="subtitle">
                        {view.needsProject && activeProject
                            ? <>Projet <strong>{activeProject.name}</strong> · {view.subtitle}</>
                            : view.subtitle}
                    </p>
                </header>

                {/* key : on repart en haut de page à chaque changement de vue */}
                <div className="dashboard-scroll" key={currentView}>
                    {/* VUE : PROJETS */}
                    {currentView === 'projects' && (
                        <div className="dashboard-grid">
                            <div className="col-span-4">
                                <ProjectPanel onProjectCreated={(id) => fetchProjects(id)} />
                            </div>
                            <div className="col-span-8">
                                {activeProjectId ? (
                                    <ProjectTeamPanel activeProjectId={activeProjectId} projectName={activeProject?.name} />
                                ) : (
                                    <div className="card card-fill">
                                        <div className="empty-state">
                                            <FolderKanban size={36} />
                                            <p className="empty-state-title">Aucun projet pour l'instant</p>
                                            <p>Créez votre premier projet pour débloquer les autres outils.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VUE : BIBLIOTHÈQUE */}
                    {currentView === 'library' && activeProjectId && (
                        <div className="dashboard-grid">
                            <div className="col-span-12">
                                <ExportPanel activeProjectId={activeProjectId} projectName={activeProject?.name} />
                            </div>
                            <div className="col-span-12">
                                <LibraryPanel activeProjectId={activeProjectId} />
                            </div>
                        </div>
                    )}

                    {/* VUE : ESPACE DE TRAVAIL */}
                    {currentView === 'workspace' && activeProjectId && (
                        <div className="dashboard-grid">
                            <div className="col-span-12">
                                <ResearchPanel activeProjectId={activeProjectId} />
                            </div>
                            <div className="col-span-8">
                                <SynthesisPanel activeProjectId={activeProjectId} />
                            </div>
                            <div className="col-span-4">
                                <ChatbotPanel activeProjectId={activeProjectId} />
                            </div>
                            <div className="col-span-12">
                                <TerminalPanel />
                            </div>
                        </div>
                    )}

                    {/* VUE : DATAVIZ */}
                    {currentView === 'dataviz' && activeProjectId && (
                        <div className="dashboard-grid">
                            <div className="col-span-12">
                                <DataVizPanel activeProjectId={activeProjectId} />
                            </div>
                            <div className="col-span-12">
                                <GraphPanel activeProjectId={activeProjectId} />
                            </div>
                        </div>
                    )}

                    {/* VUE : DISCUSSIONS */}
                    {currentView === 'discussions' && activeProjectId && (
                        <div className="dashboard-grid">
                            <div className="col-span-12">
                                <DiscussionPanel activeProjectId={activeProjectId} currentUser={user} />
                            </div>
                        </div>
                    )}

                    {/* VUE : ADMINISTRATION */}
                    {currentView === 'admin' && user?.role === 'admin' && (
                        <div className="dashboard-grid">
                            <div className="col-span-12">
                                <AdminPanel />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />}
        </div>
    );
}

export default Dashboard;
