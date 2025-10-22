export function KPI({ label, value, sub="" }:{ label:string; value:string|number; sub?:string }){
  return (
    <div className="card" style={{minWidth:180}}>
      <div className="muted" style={{fontSize:12}}>{label}</div>
      <div style={{fontSize:28, fontWeight:900, marginTop:6}}>{value}</div>
      {sub && <div className="muted" style={{marginTop:4}}>{sub}</div>}
    </div>
  );
}
