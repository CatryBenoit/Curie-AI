import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Sparkles, Loader2 } from 'lucide-react';
import api from '../api';

function SynthesisPanel({ activeProjectId }) {
    const [synthesis, setSynthesis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // 🆕 Nouvel état pour stocker la directive de l'utilisateur
    const [guidance, setGuidance] = useState('');

    useEffect(() => {
        fetchSynthesis();
    }, [activeProjectId]);

    const fetchSynthesis = async () => {
        if (!activeProjectId) return;
        try {
            const res = await api.get(`/projects/${activeProjectId}/synthesis`);
            setSynthesis(res.data.report || '');
        } catch {
            setSynthesis('');
        }
    };

    const generateSynthesis = async () => {
        if (!activeProjectId) return;
        setIsLoading(true);
        try {
            // 🆕 On envoie le "guidance" dans le corps de la requête (req.body)
            const res = await api.post(`/projects/${activeProjectId}/synthesis`, { guidance });
            setSynthesis(res.data.report);
            
            // Optionnel : on peut vider le champ après génération, ou le laisser pour que l'utilisateur affine.
            // setGuidance(''); 
        } catch (err) {
            console.error("Erreur synthèse:", err);
            alert("Erreur lors de la génération de la synthèse.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!activeProjectId) return null;

    return (
        <div className="card card-fill" style={{ height: 620 }}>
            <div className="card-header">
                <div>
                    <h3 className="card-title"><FileText size={18} /> Synthèse globale</h3>
                    <p className="card-subtitle">Rapport rédigé par l'IA à partir des articles du projet.</p>
                </div>
            </div>

            {/* Zone de guidage en direct */}
            <form
                className="row"
                style={{ marginBottom: 14 }}
                onSubmit={(e) => { e.preventDefault(); generateSynthesis(); }}
            >
                <input
                    className="input grow"
                    type="text"
                    placeholder="Consigne optionnelle : ex. concentre-toi sur les effets secondaires…"
                    value={guidance}
                    onChange={(e) => setGuidance(e.target.value)}
                    disabled={isLoading}
                    aria-label="Consigne pour la synthèse"
                />
                <button type="submit" className="btn" disabled={isLoading}>
                    {isLoading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                    {isLoading ? 'Rédaction...' : (synthesis ? 'Régénérer' : 'Générer')}
                </button>
            </form>

            {/* Zone d'affichage du Markdown */}
            <div className="well grow" style={{ overflowY: 'auto', background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
                {isLoading ? (
                    <div className="empty-state">
                        <Loader2 size={28} className="spin" />
                        <p>L'agent rédacteur compile les données selon vos consignes…</p>
                    </div>
                ) : synthesis ? (
                    <div className="markdown">
                        <ReactMarkdown>{synthesis}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FileText size={32} />
                        <p className="empty-state-title">Aucune synthèse pour l'instant</p>
                        <p>Cliquez sur « Générer » pour en rédiger une.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SynthesisPanel;
