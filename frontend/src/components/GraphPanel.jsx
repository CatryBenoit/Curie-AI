import { useState, useEffect } from 'react';
import { LineChart as LineIcon, Plus, X, Trash2, Save, Eye } from 'lucide-react';
import api from '../api';
import { 
    BarChart, Bar, PieChart, Pie, LineChart, Line, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell 
} from 'recharts';

// Palette catégorielle validée (daltonisme) : toujours dans cet ordre, jamais mélangée
const SERIES = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);

const AXIS_PROPS = {
    stroke: 'var(--chart-grid)',
    tick: { fill: 'var(--chart-axis)', fontSize: 12 },
    tickLine: false,
};

// Infobulle aux couleurs du thème
function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const point = payload[0];
    return (
        <div className="chart-tooltip">
            <strong>{point.payload.name}</strong>
            <span className="tabular">{point.value}</span>
        </div>
    );
}

function GraphPanel({ activeProjectId }) {
    const [charts, setCharts] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    // États du constructeur de graphique
    const [newTitle, setNewTitle] = useState('Mon nouveau graphique');
    const [newType, setNewType] = useState('bar'); // 'bar', 'pie', 'line'
    const [newData, setNewData] = useState([
        { name: 'Donnée A', value: 10 },
        { name: 'Donnée B', value: 25 },
        { name: 'Donnée C', value: 15 }
    ]);

    useEffect(() => {
        if (activeProjectId) fetchCharts();
    }, [activeProjectId]);

    const fetchCharts = async () => {
        try {
            const res = await api.get(`/projects/${activeProjectId}/charts`);
            setCharts(res.data);
        } catch (err) {
            console.error("Erreur de récupération des graphiques :", err);
        }
    };

    const handleDataChange = (index, field, val) => {
        const updated = newData.map((point, i) =>
            i === index ? { ...point, [field]: field === 'value' ? Number(val) : val } : point
        );
        setNewData(updated);
    };

    const handleAddDataPoint = () => {
        setNewData([...newData, { name: `Nouvelle donnée ${newData.length + 1}`, value: 0 }]);
    };

    const handleRemoveDataPoint = (index) => {
        setNewData(newData.filter((_, i) => i !== index));
    };

    const handleSaveChart = async () => {
        try {
            await api.post(`/projects/${activeProjectId}/charts`, {
                title: newTitle,
                chart_type: newType,
                chart_data: newData
            });
            setIsCreating(false);
            fetchCharts(); // Rafraîchir la liste
        } catch (err) {
            console.error("Erreur sauvegarde graphique :", err);
            alert("Erreur lors de la sauvegarde du graphique.");
        }
    };

    // Fonction pour dessiner le bon graphique selon le type
    const renderChart = (type, data) => {
        if (!data || data.length === 0) return <div className="empty-state">Aucune donnée.</div>;

        switch (type) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={data} dataKey="value" nameKey="name" cx="50%" cy="45%"
                                innerRadius={48} outerRadius={84} paddingAngle={1}
                                stroke="var(--bg-panel)" strokeWidth={2}
                                label={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={SERIES[index % SERIES.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                            <XAxis dataKey="name" {...AXIS_PROPS} />
                            <YAxis {...AXIS_PROPS} axisLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
                            <Line
                                type="monotone" dataKey="value" stroke={SERIES[0]} strokeWidth={2}
                                dot={{ r: 4, fill: SERIES[0], stroke: 'var(--bg-panel)', strokeWidth: 2 }}
                                activeDot={{ r: 6, stroke: 'var(--bg-panel)', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
            default:
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                            <XAxis dataKey="name" {...AXIS_PROPS} />
                            <YAxis {...AXIS_PROPS} axisLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                            <Bar dataKey="value" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h3 className="card-title"><LineIcon size={18} /> Graphiques personnalisés</h3>
                    <p className="card-subtitle">Construisez vos propres figures ; elles sont incluses dans le rapport PDF.</p>
                </div>
                <button onClick={() => setIsCreating(!isCreating)} className={`btn ${isCreating ? 'btn-secondary' : ''}`}>
                    {isCreating ? <X size={16} /> : <Plus size={16} />}
                    {isCreating ? 'Annuler' : 'Nouveau graphique'}
                </button>
            </div>

            {/* CONSTRUCTEUR DE GRAPHIQUE */}
            {isCreating && (
                <div className="well" style={{ marginBottom: 20 }}>
                    <div className="row row-wrap" style={{ alignItems: 'flex-end', marginBottom: 16, gap: 12 }}>
                        <div className="field grow" style={{ flexBasis: 240 }}>
                            <label className="label" htmlFor="chart-title">Titre</label>
                            <input id="chart-title" className="input" type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                        </div>
                        <div className="field">
                            <label className="label" htmlFor="chart-type">Type</label>
                            <select id="chart-type" className="select" value={newType} onChange={(e) => setNewType(e.target.value)}>
                                <option value="bar">Barres</option>
                                <option value="pie">Anneau (répartition)</option>
                                <option value="line">Courbe d'évolution</option>
                            </select>
                        </div>
                    </div>

                    <div className="two-col">
                        {/* Éditeur de données */}
                        <div className="stack stack-sm">
                            <div className="data-row label">
                                <span>Libellé</span><span>Valeur</span><span style={{ width: 30 }} />
                            </div>
                            {newData.map((point, idx) => (
                                <div key={idx} className="data-row">
                                    <input className="input input-sm" type="text" value={point.name} onChange={(e) => handleDataChange(idx, 'name', e.target.value)} placeholder="ex : 2024" aria-label="Libellé" />
                                    <input className="input input-sm tabular" type="number" value={point.value} onChange={(e) => handleDataChange(idx, 'value', e.target.value)} aria-label="Valeur" />
                                    <button onClick={() => handleRemoveDataPoint(idx)} className="btn btn-danger-ghost btn-icon" title="Supprimer la ligne" aria-label="Supprimer la ligne">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <div>
                                <button onClick={handleAddDataPoint} className="btn btn-ghost btn-sm"><Plus size={14} /> Ajouter une ligne</button>
                            </div>
                        </div>

                        {/* Aperçu en direct */}
                        <div className="chart-tile">
                            <div className="section-title muted"><Eye size={14} /> Aperçu</div>
                            {renderChart(newType, newData)}
                        </div>
                    </div>

                    <div className="row row-end" style={{ marginTop: 16 }}>
                        <button onClick={handleSaveChart} className="btn btn-success"><Save size={16} /> Enregistrer le graphique</button>
                    </div>
                </div>
            )}

            {/* AFFICHAGE DES GRAPHIQUES SAUVEGARDÉS */}
            {charts.length === 0 && !isCreating ? (
                <div className="empty-state">
                    <LineIcon size={32} />
                    <p className="empty-state-title">Aucun graphique pour ce projet</p>
                    <p>Cliquez sur « Nouveau graphique » pour commencer.</p>
                </div>
            ) : (
                <div className="chart-grid">
                    {charts.map(chart => (
                        <div key={chart.id} className="chart-tile">
                            <h4>{chart.title}</h4>
                            {renderChart(chart.chart_type, chart.chart_data)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GraphPanel;
