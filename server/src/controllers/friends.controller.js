import { pool } from "../config/db.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    const rawFriendId = req.body?.friend_id;

    console.log("sendFriendRequest called:", { from: userId, to: rawFriendId });

    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (rawFriendId == null) {
      return res.status(400).json({ error: "friend_id es requerido" });
    }

    const friendId = Number(rawFriendId);

    if (!Number.isFinite(friendId) || friendId <= 0) {
      return res.status(400).json({ error: "friend_id debe ser numérico y mayor que 0" });
    }

    if (friendId === userId) {
      return res.status(400).json({ error: "No puedes enviarte una solicitud a ti mismo" });
    }

    // Verificar que el usuario destino exista
    const [friendExists] = await pool.query("SELECT id FROM users WHERE id = ?", [friendId]);
    if (friendExists.length === 0) {
      return res.status(400).json({ error: "El usuario destino no existe" });
    }

    // Verificar que no exista ya una solicitud/amistad
    const [dup] = await pool.query(
      `SELECT id FROM friendships
         WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
           AND status IN ('pending', 'accepted')`,
      [userId, friendId, friendId, userId]
    );

    if (dup.length > 0) {
      return res
        .status(400)
        .json({ error: "Ya existe una solicitud o amistad con este usuario" });
    }

    // Insertar nueva solicitud
    const [result] = await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES (?,?, 'pending')`,
      [userId, friendId]
    );

    const [rows] = await pool.query(
      `SELECT id, user_id, friend_id, status, created_at FROM friendships WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    return res.status(500).json({ error: "No se pudo enviar la solicitud" });
  }
};

export const listReceivedRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const [rows] = await pool.query(
      `SELECT f.id, f.created_at, u.id AS user_id, u.name, u.email
         FROM friendships f
         JOIN users u ON u.id = f.user_id
        WHERE f.friend_id = ? AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
      [userId]
    );

    const requests = rows.map((r) => ({
      id: r.id,
      user: { id: r.user_id, name: r.name, email: r.email },
      created_at: r.created_at,
    }));

    return res.json({ ok: true, requests });
  } catch (err) {
    console.error("listReceivedRequests error:", err);
    return res.status(500).json({ error: "No se pudieron obtener las solicitudes" });
  }
};

export const listSentRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const [rows] = await pool.query(
      `SELECT f.id, f.created_at, u.id AS user_id, u.name, u.email
         FROM friendships f
         JOIN users u ON u.id = f.friend_id
        WHERE f.user_id = ? AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
      [userId]
    );

    const requests = rows.map((r) => ({
      id: r.id,
      user: { id: r.user_id, name: r.name, email: r.email },
      created_at: r.created_at,
    }));

    return res.json({ ok: true, requests });
  } catch (err) {
    console.error("listSentRequests error:", err);
    return res.status(500).json({ error: "No se pudieron obtener las solicitudes enviadas" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    const reqId = Number(req.params.id);
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    if (!Number.isFinite(reqId) || reqId <= 0) {
      return res.status(400).json({ error: "ID invalido" });
    }

    const [rows] = await pool.query(
      `SELECT id, user_id, friend_id, status, created_at FROM friendships WHERE id = ?`,
      [reqId]
    );
    const request = rows[0];
    if (!request) return res.status(404).json({ error: "Solicitud no encontrada" });
    if (request.friend_id !== userId) return res.status(403).json({ error: "No autorizado" });
    if (request.status !== "pending") {
      return res.status(400).json({ error: "La solicitud ya fue procesada" });
    }

    await pool.query(`UPDATE friendships SET status = 'accepted' WHERE id = ?`, [reqId]);

    const [updated] = await pool.query(
      `SELECT id, user_id, friend_id, status, created_at FROM friendships WHERE id = ?`,
      [reqId]
    );

    return res.json({ ok: true, request: updated[0] });
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    return res.status(500).json({ error: "No se pudo aceptar la solicitud" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    const reqId = Number(req.params.id);
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    if (!Number.isFinite(reqId) || reqId <= 0) {
      return res.status(400).json({ error: "ID invalido" });
    }

    const [rows] = await pool.query(
      `SELECT id, user_id, friend_id, status FROM friendships WHERE id = ?`,
      [reqId]
    );
    const request = rows[0];
    if (!request) return res.status(404).json({ error: "Solicitud no encontrada" });
    const isOwner = request.user_id === userId || request.friend_id === userId;
    if (!isOwner) return res.status(403).json({ error: "No autorizado" });
    if (request.status !== "pending") {
      return res.status(400).json({ error: "La solicitud ya fue procesada" });
    }

    await pool.query(`DELETE FROM friendships WHERE id = ?`, [reqId]);
    return res.status(204).send();
  } catch (err) {
    console.error("rejectFriendRequest error:", err);
    return res.status(500).json({ error: "No se pudo rechazar la solicitud" });
  }
};

export const listFriends = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    console.log("listFriends called for user", userId);

    const [rows] = await pool.query(
      `SELECT f.id, u.id AS friend_id, u.name, u.email
         FROM friendships f
         JOIN users u ON u.id = f.friend_id
        WHERE f.status = 'accepted' AND f.user_id = ?
        UNION ALL
       SELECT f.id, u.id AS friend_id, u.name, u.email
         FROM friendships f
         JOIN users u ON u.id = f.user_id
        WHERE f.status = 'accepted' AND f.friend_id = ?`,
      [userId, userId]
    );

    const friends = rows.map((r) => ({
      id: r.friend_id,
      name: r.name,
      email: r.email,
    }));

    return res.json({ ok: true, friends });
  } catch (err) {
    console.error("listFriends error:", err);
    return res.status(500).json({ error: "No se pudieron obtener los amigos" });
  }
};
