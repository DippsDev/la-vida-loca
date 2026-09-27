import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Keep in step with utils/partyDetails.ts. Shown only on an acceptance.
const party = {
  day: "Saturday",
  arrival: "from four in the afternoon",
  place: "Private villa",
  evening: "A private evening by the pool. The house is closed to anyone who is not on this ticket.",
  idCheck: "Bring photo identification in the name on this ticket. Hosts will check that it is you, and that your age matches this invitation.",
}

type RequestRow = {
  id: number
  first_name: string
  email: string
  ticket_code: string
  status: "PENDING" | "APPROVED" | "REJECTED"
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function letter(row: RequestRow, kind: "receipt" | "decision") {
  const name = row.first_name.trim()
  const safeName = escapeHtml(name)
  const safeCode = escapeHtml(row.ticket_code)

  if (kind === "receipt") {
    return {
      subject: "We have your note — La Vida Loca",
      text: [
        `Dear ${name},`,
        "",
        `We have your note for La Vida Loca. Your ticket ${row.ticket_code} stays pending until the hosts accept or decline it.`,
        "",
        "We will write again when they decide.",
      ].join("\n"),
      html: [
        `<p>Dear ${safeName},</p>`,
        `<p>We have your note for La Vida Loca. Your ticket <strong>${safeCode}</strong> stays pending until the hosts accept or decline it.</p>`,
        "<p>We will write again when they decide.</p>",
      ].join(""),
    }
  }

  if (row.status === "APPROVED") {
    return {
      subject: "You are accepted — La Vida Loca",
      text: [
        `Dear ${name},`,
        "",
        "You are accepted.",
        "",
        `${party.day}, ${party.arrival}. ${party.place}.`,
        party.evening,
        party.idCheck,
        "",
        `Your ticket code is ${row.ticket_code}.`,
      ].join("\n"),
      html: [
        `<p>Dear ${safeName},</p>`,
        "<p>You are accepted.</p>",
        `<p>${escapeHtml(party.day)}, ${escapeHtml(party.arrival)}. ${escapeHtml(party.place)}.</p>`,
        `<p>${escapeHtml(party.evening)}</p>`,
        `<p>${escapeHtml(party.idCheck)}</p>`,
        `<p>Your ticket code is <strong>${safeCode}</strong>.</p>`,
      ].join(""),
    }
  }

  return {
    subject: "Not this time — La Vida Loca",
    text: [
      `Dear ${name},`,
      "",
      "We are sorry we cannot offer you a place at this party. Please come back for the ones still to come. We will send you word when the next gathering opens.",
    ].join("\n"),
    html: [
      `<p>Dear ${safeName},</p>`,
      "<p>We are sorry we cannot offer you a place at this party. Please come back for the ones still to come. We will send you word when the next gathering opens.</p>",
    ].join(""),
  }
}

function bearerRole(token: string) {
  try {
    const part = token.split(".")[1]
    if (!part) return ""
    const padded = part.replace(/-/g, "+").replace(/_/g, "/")
    const json = JSON.parse(atob(padded)) as { role?: string }
    return json.role ?? ""
  }
  catch {
    return ""
  }
}

function serviceConfig() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) throw new Error("Supabase service credentials are missing")
  return { url, key }
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const { url, key } = serviceConfig()
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${path} failed: ${response.status} ${text}`)
  return text ? JSON.parse(text) : null
}

async function loadRequest(id: number): Promise<RequestRow | null> {
  const rows = await supabaseFetch(
    `/rest/v1/requests?id=eq.${id}&select=id,first_name,email,ticket_code,status`,
  )
  return Array.isArray(rows) ? rows[0] ?? null : null
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "method" }, 405)

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
    const role = bearerRole(token)
    if (role !== "anon" && role !== "service_role") {
      return json({ error: "unauthorized" }, 401)
    }

    const body = await req.json() as { kind?: string, record?: { id?: number } }
    const id = Number(body?.record?.id)
    const kind = body?.kind === "decision" ? "decision" : body?.kind === "receipt" ? "receipt" : ""
    if (!Number.isInteger(id) || id <= 0 || !kind) return json({ error: "bad request" }, 400)

    const apiKey = Deno.env.get("RESEND_API_KEY")
    const from = Deno.env.get("RSVP_FROM_EMAIL")
    if (!apiKey || !from) {
      console.error("RSVP mail is missing RESEND_API_KEY or RSVP_FROM_EMAIL")
      return json({ error: "mail not configured" }, 500)
    }

    const row = await loadRequest(id)
    if (!row?.email) return json({ error: "missing" }, 404)
    if (kind === "decision" && row.status !== "APPROVED" && row.status !== "REJECTED") {
      return json({ skipped: true })
    }

    const claimed = kind === "receipt"
      ? await supabaseFetch("/rest/v1/rpc/claim_rsvp_receipt", {
          method: "POST",
          body: JSON.stringify({ target_id: id }),
        })
      : await supabaseFetch("/rest/v1/rpc/claim_rsvp_decision", {
          method: "POST",
          body: JSON.stringify({ target_id: id, next_status: row.status }),
        })

    if (claimed !== true) return json({ skipped: true })

    const message = letter(row, kind)
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [row.email],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    })

    if (!sent.ok) {
      console.error("Resend failed", sent.status, await sent.text())
      if (kind === "receipt") {
        await supabaseFetch("/rest/v1/rpc/release_rsvp_receipt", {
          method: "POST",
          body: JSON.stringify({ target_id: id }),
        })
      }
      else {
        await supabaseFetch("/rest/v1/rpc/release_rsvp_decision", {
          method: "POST",
          body: JSON.stringify({ target_id: id, next_status: row.status }),
        })
      }
      return json({ error: "mail failed" }, 502)
    }

    return json({ sent: true })
  }
  catch (error) {
    console.error(error)
    return json({ error: "mail failed" }, 500)
  }
})
