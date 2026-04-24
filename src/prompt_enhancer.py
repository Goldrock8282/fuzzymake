import anthropic

_SYSTEM_PROMPT = """You are an expert prompt engineer for text-to-image models (DALL-E 3, Stable Diffusion, Midjourney).

Your job: take a short, possibly vague user idea (in any language) and rewrite it as a rich, concrete English prompt optimized for photorealistic or stylistic image generation.

Rules:
- Output ONLY the enhanced prompt text. No preamble, no explanation, no quotes, no markdown.
- Write in English regardless of the input language.
- Keep it under 400 words.
- Include: subject, composition, lighting, style/medium, color palette, mood, camera/lens (if photo), and any important details.
- Preserve every concrete detail the user mentioned (colors, objects, people, text). Do not drop them.
- If the user asks for text in the image, keep the exact text in quotes.
- Do NOT add watermarks, signatures, or brand logos unless the user asked for them.
- Be specific and visual. Avoid abstract adjectives like "beautiful" or "amazing" alone — anchor them with concrete details."""


_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def enhance(user_idea: str) -> str:
    response = _get_client().messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_idea.strip()}],
    )
    for block in response.content:
        if block.type == "text":
            return block.text.strip()
    return user_idea.strip()
