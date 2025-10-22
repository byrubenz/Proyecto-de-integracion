import { clearSession } from "./auth"; // 👈 usa tu helper para limpiar sesión

export async function saveAnswers(
  topicId: string,
  answers: Array<{ question_id: number; option_id?: number; is_correct?: boolean }>
) {
  const base = import.meta.env.VITE_API_URL;
  console.log("[saveAnswers] VITE_API_URL:", base, "origin:", location.origin);

  const token = localStorage.getItem("auth_token");
  console.log("[saveAnswers] token?", token ? token.slice(0, 20) + "..." : null);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  console.log("[saveAnswers] headers →", JSON.stringify(headers));

  let res: Response;
  try {
    res = await fetch(`${base}/api/answers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ topic_id: Number(topicId), answers }),
    });
  } catch (netErr) {
    // Error de red/conexión
    console.error("[saveAnswers] network error:", netErr);
    throw new Error("No se pudo contactar al servidor.");
  }

  // Intenta leer JSON incluso si hay error
  const data = await res.json().catch(() => null);

  // 🔐 Manejo centralizado de 401 (expirado/invalid/no token)
  if (res.status === 401) {
    // Debug: qué ve el backend como Authorization
    try {
      const echo = await fetch(`${base}/api/auth/header`, {
        method: "GET",
        headers, // mismo Authorization
      })
        .then((r) => r.json())
        .catch(() => null);
      console.warn("[saveAnswers] /auth/header echo →", JSON.stringify(echo));
    } catch {}

    const code = data?.code as string | undefined;
    const msg =
      data?.error ||
      data?.message ||
      "Sesión inválida. Inicia sesión nuevamente.";

    // Si el token está vencido o es inválido → limpiar y redirigir
    if (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID" || code === "NO_TOKEN") {
      try {
        // Guarda a dónde volver luego del login
        const backTo = location.pathname + location.search + location.hash;
        sessionStorage.setItem("post_login_redirect", backTo);
      } catch {}
      clearSession();
      // Redirige al login
      window.location.href = "/login";
      // Además lanza el error para que el caller pueda mostrar feedback si alcanza a ejecutarse
      throw new Error(msg);
    }

    // 401 genérico
    throw new Error(msg);
  }

  if (!res.ok) {
    // Otros errores (400/403/500…)
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data; // { ok, attempt_id, score, total, accuracy_pct }
}
