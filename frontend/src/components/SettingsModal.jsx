import { useState, useEffect } from 'react';
import { Settings, X, Server, Pencil, Trash2, Plug, Save, CheckCircle2, AlertCircle, Loader2, Route } from 'lucide-react';
import api from '../api';

const SettingsModal = ({ isOpen, onClose }) => {
    const [providers, setProviders] = useState([]);
    const [routings, setRoutings] = useState([]);
    
    // État unifié pour la création et l'édition
    const [formData, setFormData] = useState({ id: null, name: '', base_url: '', api_key: '' });
    const [testStatus, setTestStatus] = useState(null); // 'loading', 'success', 'error'

    const roles = [
        { id: 'guardrail', label: 'Guardrail', desc: 'Tri des résultats' },
        { id: 'detective', label: 'Détective', desc: 'Conflits d\'intérêts' },
        { id: 'analysis', label: 'Analyse', desc: 'Extraction des données' },
        { id: 'synthesis', label: 'Synthèse', desc: 'Rédaction du rapport' },
        { id: 'inspiration', label: 'Inspiration', desc: 'Nouvelles pistes' }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchProviders();
            fetchRoutings();
        }
    }, [isOpen]);

    const fetchProviders = async () => {
        try {
            const res = await api.get('/settings/providers');
            setProviders(res.data);
        } catch (error) {
            console.error("Erreur récupération fournisseurs :", error);
        }
    };

    const fetchRoutings = async () => {
        try {
            const res = await api.get('/settings/routing');
            setRoutings(res.data);
        } catch (error) {
            console.error("Erreur récupération routings :", error);
        }
    };

    // --- GESTION DES FOURNISSEURS ---

    const handleEditProvider = (provider) => {
        setFormData({ id: provider.id, name: provider.name, base_url: provider.base_url, api_key: provider.api_key });
        setTestStatus(null);
    };

    const handleResetForm = () => {
        setFormData({ id: null, name: '', base_url: '', api_key: '' });
        setTestStatus(null);
    };

    const handleTestConnection = async () => {
        if (!formData.base_url || !formData.api_key) {
            return alert("L'URL de base et la Clé API sont requises pour le test.");
        }
        setTestStatus('loading');
        try {
            await api.post('/settings/providers/test', { base_url: formData.base_url, api_key: formData.api_key });
            setTestStatus('success');
        } catch {
            setTestStatus('error');
        }
    };

    const handleSaveProvider = async () => {
        if (!formData.name || !formData.base_url || !formData.api_key) {
            return alert("Veuillez remplir tous les champs.");
        }

        try {
            if (formData.id) {
                await api.put(`/settings/providers/${formData.id}`, formData);
            } else {
                await api.post('/settings/providers', formData);
            }
            handleResetForm();
            fetchProviders();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la sauvegarde du fournisseur.");
        }
    };

    const handleDeleteProvider = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ? Les agents qui l'utilisent basculeront sur le modèle par défaut.")) {
            try {
                await api.delete(`/settings/providers/${id}`);
                if (formData.id === id) handleResetForm();
                fetchProviders();
                fetchRoutings();
            } catch (error) {
                console.error(error);
                alert("Erreur lors de la suppression.");
            }
        }
    };

    // --- GESTION DU ROUTAGE ---

    const handleAssignRole = async (roleId, providerId, modelName) => {
        if (!providerId || !modelName) {
            return alert("Veuillez sélectionner un fournisseur et indiquer un nom de modèle.");
        }
        try {
            await api.post('/settings/routing', { provider_id: providerId, role: roleId, model_name: modelName });
            fetchRoutings();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'assignation du rôle.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-header">
                    <h4><Settings size={18} /> Paramètres des modèles IA</h4>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
                </div>

                <div className="modal-body stack" style={{ gap: 28 }}>
                    {/* SECTION 1 : FOURNISSEURS */}
                    <section>
                        <div className="section-title" style={{ fontSize: '0.9375rem' }}><Server size={16} /> Fournisseurs d'API</div>
                        <p className="hint" style={{ marginBottom: 12 }}>Les services (OpenAI, Ollama local…) auxquels les agents peuvent envoyer leurs requêtes.</p>

                        <div className="two-col">
                            {/* Liste existante */}
                            <div className="stack stack-sm">
                                {providers.length === 0 ? (
                                    <div className="well muted small">Aucun fournisseur enregistré.</div>
                                ) : (
                                    providers.map(p => (
                                        <div key={p.id} className={`well row ${formData.id === p.id ? 'is-selected' : ''}`} style={{ padding: '10px 12px' }}>
                                            <div className="grow">
                                                <strong>{p.name}</strong>
                                                <div className="hint" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.base_url}</div>
                                            </div>
                                            <button className="btn btn-ghost btn-icon" onClick={() => handleEditProvider(p)} aria-label={`Modifier ${p.name}`} title="Modifier"><Pencil size={15} /></button>
                                            <button className="btn btn-danger-ghost btn-icon" onClick={() => handleDeleteProvider(p.id)} aria-label={`Supprimer ${p.name}`} title="Supprimer"><Trash2 size={15} /></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Formulaire Édition/Ajout */}
                            <div className="well stack">
                                <div className="row row-between">
                                    <strong>{formData.id ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</strong>
                                    {formData.id && <button className="btn btn-ghost btn-sm" onClick={handleResetForm}>Annuler</button>}
                                </div>
                                <div className="field">
                                    <label className="label" htmlFor="prov-name">Nom</label>
                                    <input id="prov-name" className="input" type="text" placeholder="ex : OpenAI, Ollama local" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="field">
                                    <label className="label" htmlFor="prov-url">URL de base</label>
                                    <input id="prov-url" className="input" type="text" placeholder="ex : http://localhost:11434/v1" value={formData.base_url} onChange={e => setFormData({...formData, base_url: e.target.value})} />
                                </div>
                                <div className="field">
                                    <label className="label" htmlFor="prov-key">Clé API <span className="muted">(optionnelle en local)</span></label>
                                    <input id="prov-key" className="input" type="password" autoComplete="off" value={formData.api_key} onChange={e => setFormData({...formData, api_key: e.target.value})} />
                                </div>

                                <div className="row">
                                    <button onClick={handleTestConnection} className="btn btn-secondary grow">
                                        {testStatus === 'loading' ? <Loader2 size={16} className="spin" /> : <Plug size={16} />}
                                        {testStatus === 'loading' ? 'Test...' : 'Tester'}
                                    </button>
                                    <button onClick={handleSaveProvider} className="btn grow">
                                        <Save size={16} /> Enregistrer
                                    </button>
                                </div>

                                {testStatus === 'success' && <div className="notice notice-success"><CheckCircle2 size={16} /> Connexion réussie.</div>}
                                {testStatus === 'error' && <div className="notice notice-danger"><AlertCircle size={16} /> Échec de la connexion. Vérifiez l'URL ou la clé.</div>}
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2 : ROUTAGE */}
                    <section>
                        <div className="section-title" style={{ fontSize: '0.9375rem' }}><Route size={16} /> Modèle utilisé par chaque agent</div>
                        <p className="hint" style={{ marginBottom: 12 }}>Sans assignation, l'agent utilise le modèle par défaut.</p>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Agent</th>
                                        <th>Fournisseur</th>
                                        <th>Nom exact du modèle</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.map(role => {
                                        const currentRouting = routings.find(r => r.role === role.id) || {};
                                        return (
                                            <tr key={role.id}>
                                                <td>
                                                    <strong>{role.label}</strong>
                                                    <div className="hint">{role.desc}</div>
                                                </td>
                                                <td>
                                                    <select className="select input-sm" defaultValue={currentRouting.provider_id || ""} id={`prov-${role.id}`} aria-label={`Fournisseur pour ${role.label}`}>
                                                        <option value="" disabled>Par défaut (global)</option>
                                                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input className="input input-sm mono" type="text" defaultValue={currentRouting.model_name || ""} id={`mod-${role.id}`} placeholder="ex : llama3.1:8b" aria-label={`Modèle pour ${role.label}`} />
                                                </td>
                                                <td className="cell-actions">
                                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                                        const provId = document.getElementById(`prov-${role.id}`).value;
                                                        const modName = document.getElementById(`mod-${role.id}`).value;
                                                        handleAssignRole(role.id, provId, modName);
                                                    }}>
                                                        <Save size={14} /> Appliquer
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
