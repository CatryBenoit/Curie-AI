import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquareText, Send, Loader2 } from 'lucide-react';
import api from '../api';

const ChatbotPanel = ({ activeProjectId }) => {
    // État pour stocker l'historique de la conversation
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Bonjour ! Je suis ton assistant de recherche. Pose-moi une question et j'irai chercher la réponse **uniquement** dans les PDFs de ce projet." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Référence pour faire défiler le chat automatiquement vers le bas
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeProjectId || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        
        // Ajout de la question de l'utilisateur à l'interface
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            // Appel à notre nouvelle route Backend
            const res = await api.post(`/projects/${activeProjectId}/chat`, { question: userMsg });
            
            // Ajout de la réponse de l'IA
            setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch (error) {
            console.error("Erreur Chatbot:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "*Une erreur de connexion est survenue.*" }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!activeProjectId) return null;

    return (
        <div className="card card-fill" style={{ height: 620 }}>
            <div className="card-header" style={{ marginBottom: 8 }}>
                <div>
                    <h3 className="card-title"><MessageSquareText size={18} /> Questions aux articles</h3>
                    <p className="card-subtitle">Réponses tirées uniquement des documents du projet.</p>
                </div>
            </div>

            {/* Zone d'affichage des messages */}
            <div className="chat-scroll">
                {messages.map((msg, index) => (
                    <div key={index} className={`bubble ${msg.role === 'user' ? 'bubble-me' : 'bubble-other'}`}>
                        {msg.role === 'user' ? (
                            msg.text
                        ) : (
                            <div className="markdown">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="bubble bubble-other bubble-typing">
                        <Loader2 size={14} className="spin" /> Analyse des articles…
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Barre de saisie */}
            <form onSubmit={handleSend} className="chat-form">
                <input
                    className="input grow"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez une question…"
                    aria-label="Votre question"
                />
                <button type="submit" className="btn btn-icon" style={{ padding: 9 }} disabled={isLoading || !input.trim()} aria-label="Envoyer">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default ChatbotPanel;
