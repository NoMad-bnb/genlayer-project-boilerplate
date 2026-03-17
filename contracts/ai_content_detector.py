# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json

class AIContentDetector(gl.Contract):
    last_result: str

    def __init__(self):
        self.last_result = ""

    @gl.public.write
    def analyze_content(self, text: str) -> None:
        prompt = f"""
Is the following text AI-generated or Human-written?
Reply with ONLY this exact JSON, no other text:
{{"content_type": "AI", "score": 7, "reason": "one sentence"}}

Replace the values based on your analysis.
content_type must be exactly "AI" or "Human".
score must be a number from 1 to 10.
reason must be one short sentence.

Text:
{text}
"""

        def get_result():
            result = gl.nondet.exec_prompt(prompt)
            result = result.replace("```json", "").replace("```", "").strip()
            return result

        raw = gl.eq_principle.prompt_comparative(
            get_result,
            "content_type must be the same"
        )
        self.last_result = raw

    @gl.public.view
    def get_last_result(self) -> str:
        return self.last_result