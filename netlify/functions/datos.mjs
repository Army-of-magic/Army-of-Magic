import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

// Hash del PIN (se puede reemplazar con la variable ADMIN_PIN en Netlify)
const HASH = "4fb11f735acd3107aed9afac8cc258cb2e7601475da861e8a79900635df9027a";

export default async (req) => {
  const store = getStore("army-of-magic");
  const h = { "Content-Type": "application/json", "Cache-Control": "no-store" };

  if (req.method === "GET") {
    const datos = await store.get("datos", { type: "json" });
    return new Response(JSON.stringify(datos || {}), { headers: h });
  }

  if (req.method === "POST") {
    const pin = req.headers.get("x-pin") || "";
    const env = typeof Netlify !== "undefined" ? Netlify.env.get("ADMIN_PIN") : "";
    const ok = env
      ? pin === env
      : createHash("sha256").update("aom|" + pin).digest("hex") === HASH;
    if (!ok) return new Response("PIN incorrecto", { status: 401 });

    const body = await req.text();
    if (body.length > 5000000) return new Response("Demasiado grande", { status: 413 });
    try { JSON.parse(body); } catch { return new Response("JSON invalido", { status: 400 }); }

    await store.set("datos", body);
    return new Response(JSON.stringify({ ok: true }), { headers: h });
  }

  return new Response("Metodo no permitido", { status: 405 });
};

export const config = { path: "/api/datos" };
