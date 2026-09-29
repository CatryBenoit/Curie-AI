import { useState, useEffect } from 'react';
import { BarChart3, Tags, Loader2 } from 'lucide-react';
import api from '../api';

function DataVizPanel({ activeProjectId }) {
    const [stats, setStats] = useState({ macro: {}, micro: {}, totalArticles: 0 });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeProjectId) fetchStats();
    }, [activeProjectId]);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/projects/${activeProjectId}/stats`);
            setStats(res.data);
        } catch (err) {
            console.error("Erreur de récupération des stats :", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Thèmes triés du plus fréquent au moins fréquent
    const macroEntries = Object.entries(stats.macro).sort((a, b) => b[1] - a[1]);
    const microEntries = Object.entries(stats.micro);
    const maxMacro = Math.max(...Object.values(stats.macro), 1);
    const maxMicro = Math.max(...Object.values(stats.micro), 1);

    if (isLoading) {
        return (
            <div className="card">
                <div className="empty-state"><Loader2 size={24} className="spin" /> Chargement des données analytiques…</div>
            </div>
        );
    }

    if (stats.totalArticles === 0) {
        return (
            <div className="card">
                <div className="empty-state">
                    <BarChart3 size={32} />
                    <p className="empty-state-title">Aucune donnée à analyser</p>
                    <p>Collectez et analysez des articles dans l'espace de travail pour voir apparaître les thèmes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="stack stack-lg">
            {/* Chiffres clés */}
            <div className="stat-row">
                <div className="card stat-tile">
                    <span className="stat-label">Documents analysés</span>
                    <span className="stat-value">{stats.totalArticles}</span>
                </div>
                <div className="card stat-tile">
                    <span className="stat-label">Domaines de recherche</span>
                    <span className="stat-value">{macroEntries.length}</span>
                </div>
                <div className="card stat-tile">
                    <span className="stat-label">Mots-clés distincts</span>
                    <span className="stat-value">{microEntries.length}</span>
                </div>
            </div>

            <div className="two-col">
                {/* DOMAINES (barres horizontales) */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title"><BarChart3 size={18} /> Domaines de recherche</h3>
                            <p className="card-subtitle">Nombre de documents par macro-thème</p>
                        </div>
                    </div>
                    <div className="bar-list">
                        {macroEntries.map(([theme, count]) => (
                            <div key={theme} title={`${theme} : ${count} document${count > 1 ? 's' : ''}`}>
                                <div className="bar-row-head">
                                    <span style={{ fontWeight: 500 }}>{theme}</span>
                                    <span className="muted tabular">{count}</span>
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${(count / maxMacro) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* NUAGE DE MOTS-CLÉS */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title"><Tags size={18} /> Mots-clés</h3>
                            <p className="card-subtitle">Taille proportionnelle à la fréquence</p>
                        </div>
                    </div>
                    <div className="tag-cloud">
                        {microEntries.map(([word, count]) => {
                            // Taille de police entre 0.8rem et 1.8rem selon la fréquence
                            const fontSize = 0.8 + ((count / maxMicro) * 1.0);
                            return (
                                <span
                                    key={word}
                                    style={{ fontSize: `${fontSize}rem`, fontWeight: count === maxMicro ? 600 : 400 }}
                                    title={`Apparaît ${count} fois`}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DataVizPanel;
