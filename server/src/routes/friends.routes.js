import { Router } from "express";
import {
  acceptFriendRequest,
  listFriends,
  listReceivedRequests,
  listSentRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "../controllers/friends.controller.js";

const router = Router();

// GET /api/friends  -> lista de amigos del usuario autenticado
router.get("/", listFriends);

// POST /api/friends/requests  -> enviar solicitud de amistad
router.post("/requests", sendFriendRequest);

// GET /api/friends/requests/received  -> solicitudes que YO he recibido (pending)
router.get("/requests/received", listReceivedRequests);

// GET /api/friends/requests/sent  -> solicitudes que YO he enviado (pending)
router.get("/requests/sent", listSentRequests);

// POST /api/friends/requests/:id/accept  -> aceptar solicitud
router.post("/requests/:id/accept", acceptFriendRequest);

// POST /api/friends/requests/:id/reject  -> rechazar/cancelar solicitud
router.post("/requests/:id/reject", rejectFriendRequest);

export default router;
