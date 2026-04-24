import os
from dataclasses import dataclass

from openai import OpenAI


@dataclass
class GeneratedImage:
    url: str
    revised_prompt: str | None


_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def generate(prompt: str) -> GeneratedImage:
    size = os.getenv("DALLE_SIZE", "1024x1024")
    quality = os.getenv("DALLE_QUALITY", "standard")

    response = _get_client().images.generate(
        model="dall-e-3",
        prompt=prompt,
        n=1,
        size=size,
        quality=quality,
        response_format="url",
    )
    item = response.data[0]
    return GeneratedImage(url=item.url, revised_prompt=item.revised_prompt)
