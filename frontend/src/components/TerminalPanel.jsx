import { useState, useEffect, useRef } from 'react';
import { SquareTerminal, Trash2 } from 'lucide-react';

function TerminalPanel() {
    const [logs, setLogs] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        // On se connecte au flux vidéo/texte de notre backend
        const eventSource = new EventSource('http://localhost:3001/api/logs/stream');

        eventSource.onopen = () => setIsConnected(true);
        eventSource.onerror = () => setIsConnected(false);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setLogs((prevLogs) => {
                // On garde seulement les 100 dernières lignes pour ne pas faire ramer le navigateur
                const newLogs = [...prevLogs, data.text];
                if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
                return newLogs;
            });
        };

        // Si le composant est détruit, on ferme la connexion
        return () => eventSource.close();
    }, []);

    // Scroll automatique vers le bas à chaque nouveau message
    useEffect(() => {
        // On fait défiler uniquement la zone du terminal, pas toute la page
        const box = bottomRef.current?.parentElement;
        if (box) box.scrollTop = box.scrollHeight;
    }, [logs]);

    return (
        <div className="terminal">
            <div className="terminal-header">
                <div className="row">
                    <SquareTerminal size={16} />
                    Journal de l'agent IA
                    <span className={`terminal-dot ${isConnected ? 'live' : ''}`} title={isConnected ? 'Connecté' : 'Déconnecté'} />
                </div>
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--term-muted)' }}
                    onClick={() => setLogs([])}
                    disabled={logs.length === 0}
                >
                    <Trash2 size={14} /> Effacer
                </button>
            </div>

            <div className="terminal-body">
                {logs.length === 0 ? (
                    <p className="terminal-empty">En attente d'activité de l'IA…</p>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="terminal-line">{log}</div>
                    ))
                )}
                {/* Ancre invisible pour le scroll auto */}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

export default TerminalPanel;
