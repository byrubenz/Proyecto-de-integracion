import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui/Card";
import { KPI } from "../components/ui/KPI";
import { fetchSummary, type SummaryResponse, fetchTopicStats, type TopicStat } from "../api/attempts";
import { fetchExamHistory, type ExamHistoryItem } from "../api/exams";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const fmtPct = (n: number | undefined | null) => Number.isFinite(Number(n)) ? `${n}%` : "—%";

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [lastExam, setLastExam] = useState<ExamHistoryItem | null>(null);
  const [loadingLast, setLoadingLast] = useState(true);

  useEffect(() => {
    (async () => {
      try { setSummary(await fetchSummary()); }
      catch { toast.error("No se pudo cargar tu resumen"); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try { const resp = await fetchTopicStats(8); setTopicStats(resp.stats); }
      finally { setLoadingStats(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try { const data = await fetchExamHistory(1, 0); setLastExam(data.exams?.[0] ?? null); }
      finally { setLoadingLast(false); }
    })();
  }, []);

  const popular = useMemo(() => topicStats.slice(0, 6), [topicStats]);

  if (loading) return <AppLayout><div className="container"><p>Cargando resumen…</p></div></AppLayout>;

  return (
    <AppLayout>
      <section className="container hero">
        <div>
          <div className="muted" style={{fontWeight:700}}>PAES Matemáticas</div>
          <h1>Practica, mide tu progreso y eleva tu puntaje.</h1>
          <p className="muted">Ensayos completos, mini-ensayos y práctica por tema con analítica de errores.</p>
          <div className="row" style={{marginTop:8}}>
            <Link to="/exams/setup" className="btn btn-primary">Comenzar ensayo</Link>
            <Link to="/topics" className="btn btn-ghost">Practicar por tema</Link>
          </div>
          <div className="row" style={{marginTop:16}}>
            <span className="muted">+{summary?.totals?.questions ?? 0} preguntas · {summary?.totals?.attempts ?? 0} intentos</span>
          </div>
        </div>

        <Card>
          {!loadingLast && lastExam ? (
            <LastExamCard exam={lastExam} />
          ) : (
            <div className="muted">Aún no tienes ensayos. ¡Rinde uno ahora!</div>
          )}
        </Card>
      </section>

      <section className="container" style={{marginTop:28}}>
        <div className="row">
          <KPI label="Intentos totales" value={summary?.total_attempts ?? 0} />
          <KPI label="Precisión promedio" value={fmtPct(summary?.avg_accuracy)} />
          <KPI label="Temas practicados" value={summary?.topics_practiced ?? 0} />
        </div>
      </section>

      <section className="container" style={{marginTop:28}}>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
          <Card><TopicBox heading="📈 Mejor tema" topic={summary?.best_topic?.name ?? "—"} accuracy={summary?.best_topic?.accuracy ?? null}/></Card>
          <Card><TopicBox heading="📉 Tema a reforzar" topic={summary?.worst_topic?.name ?? "—"} accuracy={summary?.worst_topic?.accuracy ?? null}/></Card>
        </div>
      </section>

      <section className="container" style={{marginTop:28}}>
        <Card>
          <h3 style={{marginTop:0}}>Precisión por tema (Top)</h3>
          {loadingStats ? (
            <p className="muted">Cargando gráfico…</p>
          ) : topicStats.length === 0 ? (
            <p className="muted">Aún no hay datos para graficar.</p>
          ) : (
            <div style={{ width:"100%", height:320 }}>
              <ResponsiveContainer>
                <BarChart data={topicStats} layout="vertical" margin={{ top:8, right:16, bottom:8, left:80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0,100]} tickFormatter={(v)=>`${v}%`} />
                  <YAxis type="category" dataKey="topic_name" width={160} />
                  <Tooltip
                    formatter={(value: number, name: string) => name==="accuracy_pct" ? [`${value}%`, "Precisión"] : [value, name]}
                    labelFormatter={(label, payload) => {
                      const p = payload?.[0]?.payload as TopicStat | undefined;
                      if (!p) return label;
                      const date = p.last_practiced ? new Date(p.last_practiced).toLocaleString("es-CL",{dateStyle:"short",timeStyle:"short"}) : "—";
                      return `${label} • Intentos: ${p.attempts} • Última práctica: ${date}`;
                    }}
                  />
                  <Bar dataKey="accuracy_pct" fill="#7C3AED" radius={[0,6,6,0]} barSize={18}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <small className="muted">Muestra hasta {popular.length} temas con mayor precisión.</small>
        </Card>
      </section>

      <section className="container" style={{margin:"28px 0 40px"}}>
        <div className="row">
          <Link to="/units" className="btn btn-ghost">📚 Ir a Unidades</Link>
          <Link to="/progress" className="btn btn-ghost">🕓 Ver historial</Link>
          <Link to="/exams/setup" className="btn btn-primary">🧪 Nuevo ensayo</Link>
          {summary?.worst_topic?.topic_id && (
            <Link to={`/topics/${summary.worst_topic.topic_id}`} className="btn btn-primary">
              🔁 Reforzar: {summary.worst_topic.name}
            </Link>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

/* ==== Subcomponentes locales ==== */
function LastExamCard({ exam }: { exam: import("../api/exams").ExamHistoryItem }) {
  const when = new Date(exam.submitted_at ?? exam.started_at).toLocaleString("es-CL",{dateStyle:"short",timeStyle:"short"});
  return (
    <div style={{display:"flex", gap:12, alignItems:"center", flexWrap:"wrap"}}>
      <div className="muted">🧪 Último ensayo</div>
      <div style={{fontWeight:800}}>
        {exam.title ?? "Ensayo"} · {exam.accuracy_pct}% ({exam.score}/{exam.total_questions})
      </div>
      <div className="muted" style={{marginLeft:"auto"}}>{when}</div>
      <div className="row">
        <Link to={`/ensayo/${exam.attempt_id}/resultado`} className="btn btn-primary">Ver resultado</Link>
        <Link to={`/ensayo/${exam.attempt_id}/revision`} className="btn btn-ghost">Revisar</Link>
      </div>
    </div>
  );
}
function TopicBox({ heading, topic, accuracy }:{ heading:string; topic:string; accuracy:number|null }){
  return (
    <div>
      <div className="muted" style={{marginBottom:6}}>{heading}</div>
      <div style={{fontSize:18, fontWeight:700}}>{topic}</div>
      <div style={{marginTop:6}}>{accuracy==null ? "—" : `Precisión: ${accuracy}%`}</div>
    </div>
  );
}
