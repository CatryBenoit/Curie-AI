import { ShieldCheck, Flag } from 'lucide-react';

// Classe de badge selon la gravité du conflit d'intérêts
const SEVERITY_CLASS = {
    LOW: 'badge-warning',
    MEDIUM: 'badge-danger',
    HIGH: 'badge-danger-strong',
};

const SEVERITY_LABEL = { LOW: 'faible', MEDIUM: 'moyen', HIGH: 'élevé' };

// Composant qui prend la chaîne JSON de la BDD et affiche un badge
const ConflictBadge = ({ conflictString }) => {
    // S'il n'y a pas encore d'analyse, on ne s'affiche pas
    if (!conflictString) return <span className="muted">—</span>;

    let conflictData;
    try {
        conflictData = JSON.parse(conflictString);
    } catch {
        return <span className="muted">—</span>;
    }

    if (!conflictData.hasConflict) {
        return (
            <span className="badge badge-success">
                <ShieldCheck size={12} /> Validée
            </span>
        );
    }

    const severity = SEVERITY_CLASS[conflictData.severity] ? conflictData.severity : 'MEDIUM';

    return (
        // Le "title" affiche l'explication du détective au survol
        <span className={`badge badge-help ${SEVERITY_CLASS[severity]}`} title={conflictData.details}>
            <Flag size={12} /> Conflit {SEVERITY_LABEL[severity]}
        </span>
    );
};

export default ConflictBadge;
