import { useState, useEffect, useRef } from 'react';
import { MessagesSquare, Send } from 'lucide-react';
import api from '../api';

function DiscussionPanel({ activeProjectId, currentUser }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (activeProjectId) fetchNotes();
    }, [activeProjectId]);

    // Faire défiler automatiquement vers le bas quand une note est ajoutée
    useEffect(() => {
        // On fait défiler uniquement la zone des messages, pas toute la page
        const box = messagesEndRef.current?.parentElement;
        if (box) box.scrollTop = box.scrollHeight;
    }, [notes]);

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/projects/${activeProjectId}/notes`);
            setNotes(res.data);
        } catch (err) {
            console.error("Erreur de récupération des notes :", err);
        }
    };

    const handleSendNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setIsLoading(true);
        try {
            await api.post(`/projects/${activeProjectId}/notes`, { content: newNote });
            setNewNote('');
            fetchNotes(); // On recharge les notes
        } catch (err) {
            console.error("Erreur envoi note :", err);
            alert("Erreur lors de l'envoi du message.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card card-fill" style={{ height: 'calc(100vh - 190px)', minHeight: 420 }}>
            <div className="card-header">
                <div>
                    <h3 className="card-title"><MessagesSquare size={18} /> Fil de discussion</h3>
                    <p className="card-subtitle">Visible par tous les membres du projet.</p>
                </div>
            </div>

            {/* Zone d'affichage des messages */}
            <div className="chat-scroll boxed">
                {notes.length === 0 ? (
                    <div className="empty-state">
                        <MessagesSquare size={32} />
                        <p className="empty-state-title">Aucune discussion pour ce projet</p>
                        <p>Écrivez la première note à votre équipe.</p>
                    </div>
                ) : (
                    notes.map(note => {
                        const isMe = currentUser?.username === note.username;
                        return (
                            <div key={note.id} className={`bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                                <div className="bubble-meta">
                                    {isMe ? 'Vous' : note.username} · {new Date(note.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{note.content}</div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulaire d'envoi */}
            <form onSubmit={handleSendNote} className="chat-form" style={{ borderTop: 'none' }}>
                <textarea
                    className="textarea grow"
                    style={{ minHeight: 44, height: 44, resize: 'none' }}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Écrire une note… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
                    aria-label="Nouvelle note"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendNote(e);
                        }
                    }}
                />
                <button type="submit" className="btn" style={{ height: 44 }} disabled={isLoading || !newNote.trim()}>
                    <Send size={16} /> Envoyer
                </button>
            </form>
        </div>
    );
}

export default DiscussionPanel;
