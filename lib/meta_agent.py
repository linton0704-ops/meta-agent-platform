#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, os, json, re, traceback, io

sys.stdin  = io.TextIOWrapper(sys.stdin.buffer,  encoding='utf-8')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv
load_dotenv()
import anthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

TOOLS_WHITELIST = [
    "web_search", "http_request", "code_executor",
    "send_email", "slack_notify", "file_reader",
    "calculator", "vector_search", "webhook_trigger",
]

FORBIDDEN = [
    r"ignore\s+(tes|les|vos|your|previous)\s+instructions",
    r"system\s*prompt", r"exfiltrer|exfiltrate",
    r"bypass\s+(safety|security)", r"jailbreak",
]

SYSTEM_PROMPT = f"""Tu es un architecte d'agents IA expert LangGraph.
Reponds UNIQUEMENT en JSON strict, sans texte avant ou apres, sans markdown.

Schema de sortie obligatoire :
{{
  "name": "string (3-60 chars)",
  "description": "string (20-300 chars)",
  "nodes": [
    {{
      "id": "snake_case",
      "type": "llm|tool|router|human_in_loop",
      "model": "claude-sonnet-4-5|claude-haiku-4-5",
      "prompt_template": "texte avec {{placeholders}}",
      "tools": [{{"name": "...", "sandbox": true, "rate_limit": 100}}]
    }}
  ],
  "edges": [["source_id", "target_id"]],
  "entry_point": "node_id de depart",
  "memory_type": "none|short|long|hybrid",
  "estimated_cost_usd_month": 0.0,
  "safety_level": "low|medium|high"
}}

Outils autorises uniquement : {json.dumps(TOOLS_WHITELIST)}
Regles :
- claude-haiku-4-5 pour les taches simples et rapides
- claude-sonnet-4-5 pour le raisonnement complexe
- 2-3 noeuds pour un agent simple, 4-6 max pour complexe
- Reponds UNIQUEMENT par le JSON. Rien d autre."""

def safety_check(text):
    if len(text.strip()) < 10:
        return False, "Trop court."
    if len(text) > 6000:
        return False, "Trop long."
    for p in FORBIDDEN:
        if re.search(p, text, re.IGNORECASE):
            return False, "Contenu interdit detecte."
    return True, None

def safe_parse(raw):
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    try:
        return json.loads(cleaned)
    except:
        m = re.search(r"\{[\s\S]*\}", cleaned)
        if m:
            return json.loads(m.group(0))
        raise ValueError("Aucun JSON valide trouve.")

def generate(intent):
    ok, err = safety_check(intent)
    if not ok:
        return {"error": "SAFETY_VIOLATION", "reason": err}
    if not ANTHROPIC_API_KEY:
        return {"error": "CONFIG_ERROR", "reason": "ANTHROPIC_API_KEY manquante dans .env"}

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Cree un agent pour : {intent}"}
        ]
    )
    return safe_parse(msg.content[0].text)

def main():
    try:
        payload = json.loads(sys.stdin.read())
        intent  = payload.get("user_intent", "").strip()
        result  = generate(intent) if intent else {"error": "EMPTY", "reason": "user_intent vide"}
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
    except Exception as e:
        sys.stdout.write(json.dumps({
            "error": "INTERNAL",
            "reason": str(e),
            "trace": traceback.format_exc()[:500]
        }))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()