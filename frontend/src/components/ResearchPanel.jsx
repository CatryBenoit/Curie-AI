import { useState, useEffect } from 'react';
import { Search, Bot, Rocket, PauseCircle, Plus, Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api';

function ResearchPanel({ activeProjectId }) {
    // --- ÉTATS EXISTANTS ---
    const [topic, setTopic] = useState('');
    const [amount, setAmount] = useState(100);
    const [statusMsg, setStatusMsg] = useState(null); // { type: 'info' | 'success' | 'error', text }
    const [isLoading, setIsLoading] = useState(false);

    // --- NOUVEAUX ÉTATS (COPILOTE) ---
    const [copilotMode, setCopilotMode] = useState(false);
    const [projectStatus, setProjectStatus] = useState('IN_PROGRESS');
    const [suggestedQueries, setSuggestedQueries] = useState([]);
    const [approvedQueries, setApprovedQueries] = useState([]);
    const [customQuery, setCustomQuery] = useState('');
    const [currentDepth, setCurrentDepth] = useState(1);

    // --- EFFET DE BORD : CHARGEMENT & POLLING ---
    useEffect(() => {
        if (!activeProjectId) return;

        // On charge les données immédiatement
        fetchProjectData();

        // 🔄 POLLING : On vérifie l'état du projet toutes les 5 secondes
        // Cela permet de faire apparaître la salle d'attente automatiquement quand l'IA se met en pause !
        const intervalId = setInterval(() => {
            fetchProjectData();
        }, 5000);

        return () => clearInterval(intervalId); // Nettoyage quand on quitte le composant
    }, [activeProjectId]);

    // --- RÉCUPÉRATION DES DONNÉES ---
    const fetchProjectData = async () => {
        try {
            // /!\ Attention : Assure-toi d'avoir une route GET /projects/:id dans ton backend
            const res = await api.get(`/projects/${activeProjectId}`); 
            setCopilotMode(res.data.copilot_mode === 1);
            
            // Si le statut passe en pause, on charge les idées en attente
            if (res.data.status === 'PAUSED' && projectStatus !== 'PAUSED') {
                fetchPendingQueries();
            }
            setProjectStatus(res.data.status || 'IN_PROGRESS');
        } catch (err) {
            console.error("Erreur polling projet :", err);
        }
    };

    const fetchPendingQueries = async () => {
        try {
            // /!\ Attention : Assure-toi d'avoir cette route GET /projects/:id/pending-queries
            const res = await api.get(`/projects/${activeProjectId}/pending-queries`);
            const queries = res.data.map(q => q.query);
            
            setSuggestedQueries(queries);
            setApprovedQueries(queries); // Pré-cochées par défaut
            
            if (res.data.length > 0) {
                setCurrentDepth(res.data[0].depth);
            }
        } catch (err) {
            console.error("Erreur chargement des pistes en attente :", err);
        }
    };

    // --- ACTIONS COPILOTE ---
    const handleToggleCopilot = async () => {
        if (!activeProjectId) return;
        const newMode = !copilotMode;
        setCopilotMode(newMode); // Mise à jour UI instantanée
        
        try {
            await api.put(`/research/${activeProjectId}/copilot`, { copilot_mode: newMode });
        } catch (error) {
            alert("Erreur lors du changement de mode.");
            setCopilotMode(!newMode); // Rollback
        }
    };

    const toggleQueryApproval = (query) => {
        if (approvedQueries.includes(query)) {
            setApprovedQueries(approvedQueries.filter(q => q !== query));
        } else {
            setApprovedQueries([...approvedQueries, query]);
        }
    };

    const handleAddCustomQuery = () => {
        if (customQuery.trim() !== '' && !approvedQueries.includes(customQuery)) {
            setApprovedQueries([...approvedQueries, customQuery.trim()]);
            setCustomQuery('');
        }
    };

    const handleResumeResearch = async () => {
        if (approvedQueries.length === 0) {
            alert("Veuillez valider au moins une piste !");
            return;
        }
        try {
            setProjectStatus('IN_PROGRESS'); // Cache la salle d'attente
            await api.post(`/research/${activeProjectId}/resume`, {
                approvedQueries,
                currentDepth
            });
            setStatusMsg({ type: 'success', text: `L'agent repart avec ${approvedQueries.length} pistes.` });
            setSuggestedQueries([]);
            setApprovedQueries([]);
        } catch (error) {
            alert("Erreur lors de la relance.");
            setProjectStatus('PAUSED'); // Rollback
        }
    };

    // --- ACTIONS EXISTANTES ---
    const startAutonomousLoop = async () => {
        if (!activeProjectId) return;
        const confirmLoop = window.confirm(
            "Lancer l'agent Deep Research ?\n\nL'IA va identifier les manques et relancer des recherches."
        );
        if (!confirmLoop) return;

        try {
            const res = await api.post('/research/autonomous-loop', { projectId: activeProjectId });
            alert(res.data.message);
        } catch (err) {
            alert("Erreur lors du lancement de l'Agent Autonome.");
        }
    };

    const handleStartResearch = async (e) => {
        e.preventDefault();
        if (!activeProjectId) {
            setStatusMsg({ type: 'error', text: 'Veuillez sélectionner un projet.' });
            return;
        }
        if (!topic) return;

        setIsLoading(true);
        setStatusMsg({ type: 'info', text: 'Connexion au serveur...' });

        try {
            const res = await api.post('/research/start', { 
                topic, 
                amount: parseInt(amount),
                projectId: activeProjectId
            });
            setStatusMsg({ type: 'success', text: res.data.message });
            setTopic('');
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.response?.data?.error || 'Erreur serveur' });
        } finally {
            setIsLoading(false);
        }
    };

    const isPaused = projectStatus === 'PAUSED';
    const manualQueries = approvedQueries.filter(q => !suggestedQueries.includes(q));
    const StatusIcon = statusMsg?.type === 'success' ? CheckCircle2 : statusMsg?.type === 'error' ? AlertCircle : Loader2;

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h3 className="card-title"><Search size={18} /> Collecte d'articles</h3>
                    <p className="card-subtitle">Recherche et importe des publications depuis OpenAlex.</p>
                </div>
                <span className={`badge ${isPaused ? 'badge-warning' : 'badge-success'}`}>
                    {isPaused ? <PauseCircle size={12} /> : <span className="status-dot" />}
                    {isPaused ? 'En pause' : 'Actif'}
                </span>
            </div>

            <div className="two-col">
                {/* --- FORMULAIRE D'ASPIRATION --- */}
                <form onSubmit={handleStartResearch} className="stack" style={{ opacity: isPaused ? 0.5 : 1, pointerEvents: isPaused ? 'none' : 'auto' }}>
                    <div className="field">
                        <label className="label" htmlFor="research-topic">Sujet de recherche</label>
                        <input
                            id="research-topic"
                            className="input"
                            type="text"
                            placeholder="ex : Alzheimer immunotherapy, CRISPR…"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            required
                        />
                    </div>

                    <div className="row row-wrap" style={{ alignItems: 'flex-end' }}>
                        <div className="field">
                            <label className="label" htmlFor="research-amount">Nombre max d'articles</label>
                            <input
                                id="research-amount"
                                className="input input-num"
                                type="number"
                                min="1"
                                max="5000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="btn grow">
                            {isLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                            {isLoading ? 'Envoi de la commande...' : 'Lancer la collecte'}
                        </button>
                    </div>

                    {statusMsg && (
                        <div className={`notice ${statusMsg.type === 'success' ? 'notice-success' : statusMsg.type === 'error' ? 'notice-danger' : ''}`}>
                            <StatusIcon size={16} className={statusMsg.type === 'info' ? 'spin' : undefined} />
                            <span>{statusMsg.text}</span>
                        </div>
                    )}
                </form>

                {/* --- MODES DE L'AGENT --- */}
                <div className="stack">
                    <div className="well row" style={{ gap: 12 }}>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={copilotMode}
                                onChange={handleToggleCopilot}
                                disabled={!activeProjectId}
                                aria-label="Mode copilote"
                            />
                            <span className="switch-track" />
                        </label>
                        <div className="grow">
                            <strong>Mode copilote</strong>
                            <p className="hint">
                                {copilotMode ? "L'IA s'arrête pour demander votre validation entre chaque cycle." : "L'IA travaille en autonomie complète."}
                            </p>
                        </div>
                    </div>

                    <div className="well row row-wrap" style={{ gap: 12, opacity: isPaused ? 0.5 : 1, pointerEvents: isPaused ? 'none' : 'auto' }}>
                        <Bot size={20} className="muted" />
                        <div className="grow" style={{ flexBasis: 180 }}>
                            <strong>Agent autonome</strong>
                            <p className="hint">Laisse l'IA combler les lacunes en relançant des recherches en boucle.</p>
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={startAutonomousLoop}>
                            <Rocket size={16} /> Lancer l'exploration
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SALLE D'ATTENTE (uniquement si en PAUSE) --- */}
            {isPaused && (
                <div className="well" style={{ marginTop: 16, borderColor: 'var(--warning)', background: 'var(--warning-soft)' }}>
                    <div className="section-title" style={{ color: 'var(--warning-text)' }}>
                        <PauseCircle size={16} /> L'IA attend vos instructions
                    </div>
                    <p className="small" style={{ marginBottom: 12 }}>
                        Pistes générées à la fin du cycle {currentDepth - 1}. Décochez celles à ignorer.
                    </p>

                    <div className="stack stack-sm" style={{ marginBottom: 12 }}>
                        {suggestedQueries.map((query, index) => (
                            <label key={index} className="checkbox">
                                <input
                                    type="checkbox"
                                    checked={approvedQueries.includes(query)}
                                    onChange={() => toggleQueryApproval(query)}
                                />
                                <span>{query}</span>
                            </label>
                        ))}
                    </div>

                    {/* Ajout manuel */}
                    <div className="row">
                        <input
                            className="input input-sm grow"
                            type="text"
                            value={customQuery}
                            onChange={(e) => setCustomQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomQuery(); } }}
                            placeholder="Ajouter une piste manuelle…"
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddCustomQuery}>
                            <Plus size={14} /> Ajouter
                        </button>
                    </div>

                    {/* Pistes ajoutées manuellement */}
                    {manualQueries.length > 0 && (
                        <div className="row row-wrap" style={{ marginTop: 10 }}>
                            <span className="small muted">Ajoutées :</span>
                            {manualQueries.map((q, idx) => (
                                <span key={idx} className="badge badge-success">{q}</span>
                            ))}
                        </div>
                    )}

                    <button onClick={handleResumeResearch} className="btn btn-success btn-block" style={{ marginTop: 14 }}>
                        <Play size={16} /> Valider et relancer ({approvedQueries.length} piste{approvedQueries.length > 1 ? 's' : ''})
                    </button>
                </div>
            )}
        </div>
    );
}

export default ResearchPanel;
