import { useState, useEffect, useRef } from 'react';
import {
    BookOpen, Database, Newspaper, MessageCircle, Video, Upload,
    Sparkles, ExternalLink, X, Loader2
} from 'lucide-react';
import api from '../api';
import ConflictBadge from './ConflictBadge';

// Les 4 catégories de documents, affichées sous forme d'onglets
const CATEGORIES = [
    { key: 'academic', label: 'Littérature scientifique', icon: BookOpen, linkText: 'Fichier', match: a => a.type === 'academic' || !a.type },
    { key: 'dataset', label: 'Jeux de données', icon: Database, linkText: 'Télécharger', match: a => a.type === 'dataset' },
    { key: 'news', label: 'Actualités', icon: Newspaper, linkText: 'Lire', match: a => a.type === 'news' },
    { key: 'testimony', label: 'Témoignages', icon: MessageCircle, linkText: 'Voir le post', match: a => a.type === 'testimony' },
];

function LibraryPanel({ activeProjectId }) {
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('academic');

    // États pour gérer l'ajout de vidéo
    const [showVideoInput, setShowVideoInput] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    // États et Référence pour gérer l'upload de PDF
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, [activeProjectId]);

    const fetchArticles = async () => {
        if (!activeProjectId) {
            setArticles([]);
            return;
        }
        try {
            const res = await api.get(`/library/projects/${activeProjectId}/articles`);
            setArticles(res.data);
        } catch (err) {
            console.error("Erreur bibliothèque:", err);
        }
    };

    const handleVideoSubmit = async (e) => {
        e.preventDefault();
        if (!videoUrl.trim() || !activeProjectId) return;

        setIsUploading(true);
        try {
            const res = await api.post(`/library/projects/${activeProjectId}/video`, { url: videoUrl });
            alert(res.data.message);
            setVideoUrl('');
            setShowVideoInput(false);
            fetchArticles();
        } catch (err) {
            alert(err.response?.data?.error || "Erreur lors de l'ajout de la vidéo.");
        } finally {
            setIsUploading(false);
        }
    };

    const viewAnalysis = async (articleId) => {
        try {
            const res = await api.get(`/library/articles/${articleId}/analysis`);
            setAnalysis(res.data);
            setSelectedArticle(articleId);
        } catch (err) {
            console.error("Erreur analyse:", err);
            alert("Analyse non disponible pour le moment.");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeProjectId) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            await api.post(`/library/projects/${activeProjectId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Document ajouté à la bibliothèque.");
            fetchArticles();
        } catch (err) {
            console.error("Erreur d'upload :", err);
            alert("Erreur lors de l'envoi du document.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const category = CATEGORIES.find(c => c.key === activeTab);
    const rows = articles.filter(category.match);

    return (
        <div className="card">
            {/* En-tête avec les boutons d'ajout */}
            <div className="card-header">
                <div>
                    <h3 className="card-title"><BookOpen size={18} /> Base de connaissances</h3>
                    <p className="card-subtitle">{articles.length} document{articles.length > 1 ? 's' : ''} dans ce projet</p>
                </div>

                <div className="row">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowVideoInput(!showVideoInput)}
                    >
                        <Video size={16} /> Ajouter une vidéo
                    </button>

                    <input
                        type="file"
                        accept=".pdf,.txt"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                    <button
                        className="btn"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                        {isUploading ? 'Traitement...' : 'Ajouter un document'}
                    </button>
                </div>
            </div>

            {/* Champ de saisie pour la vidéo (affiché à la demande) */}
            {showVideoInput && (
                <form onSubmit={handleVideoSubmit} className="well row row-wrap" style={{ marginBottom: 16 }}>
                    <input
                        className="input grow"
                        style={{ flexBasis: 260 }}
                        type="url"
                        placeholder="Lien YouTube (ex : https://youtu.be/...)"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        required
                        autoFocus
                    />
                    <button type="submit" className="btn" disabled={isUploading}>
                        Transcrire la vidéo
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowVideoInput(false)} aria-label="Annuler">
                        <X size={16} />
                    </button>
                </form>
            )}

            {/* Onglets par catégorie */}
            <div className="tabs" role="tablist">
                {CATEGORIES.map(c => {
                    const Icon = c.icon;
                    const count = articles.filter(c.match).length;
                    return (
                        <button
                            key={c.key}
                            role="tab"
                            aria-selected={activeTab === c.key}
                            className={`tab ${activeTab === c.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(c.key)}
                        >
                            <Icon size={15} />
                            {c.label}
                            <span className="tab-count">{count}</span>
                        </button>
                    );
                })}
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Titre</th>
                            <th>Éthique</th>
                            <th>Catégorie IA</th>
                            <th>Date</th>
                            <th>Source</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan="6" className="cell-empty">Aucun document dans cette catégorie.</td></tr>
                        ) : (
                            rows.map(item => (
                                <tr key={item.id}>
                                    <td className="cell-title" title={item.title}>{item.title}</td>
                                    <td><ConflictBadge conflictString={item.conflict_of_interest} /></td>
                                    <td>
                                        {item.macro_theme
                                            ? <span className="badge badge-primary">{item.macro_theme}</span>
                                            : <span className="badge">En cours…</span>}
                                    </td>
                                    <td className="nowrap muted tabular">{item.published_date}</td>
                                    <td className="nowrap">
                                        {item.oa_url ? (
                                            <a href={item.oa_url} target="_blank" rel="noreferrer" className="row" style={{ gap: 4, display: 'inline-flex' }}>
                                                {category.linkText} <ExternalLink size={13} />
                                            </a>
                                        ) : <span className="muted">—</span>}
                                    </td>
                                    <td className="cell-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => viewAnalysis(item.id)}>
                                            <Sparkles size={14} /> Analyse IA
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODALE D'AFFICHAGE DE L'IA */}
            {selectedArticle && analysis && (
                <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <h4><Sparkles size={18} /> Rapport d'analyse IA</h4>
                            <button className="btn btn-ghost btn-icon" onClick={() => setSelectedArticle(null)} aria-label="Fermer">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body stack stack-lg">
                            <section>
                                <div className="section-title">Métadonnées extraites</div>
                                <pre className="pre-block">{analysis.metadata}</pre>
                            </section>
                            <section>
                                <div className="section-title">Synthèse de l'article</div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{analysis.synthesis}</div>
                            </section>
                            <details>
                                <summary className="section-title" style={{ cursor: 'pointer' }}>Notes de lecture détaillées</summary>
                                <div className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                                    {analysis.notes}
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LibraryPanel;
