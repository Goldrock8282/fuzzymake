import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

load_dotenv()

from src import image_client, prompt_enhancer

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/enhance", methods=["POST"])
def enhance():
    data = request.get_json(silent=True) or {}
    idea = (data.get("idea") or "").strip()
    if not idea:
        return jsonify({"error": "idea is required"}), 400
    try:
        enhanced = prompt_enhancer.enhance(idea)
        return jsonify({"prompt": enhanced})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400
    try:
        image = image_client.generate(prompt)
        return jsonify({"url": image.url, "revised_prompt": image.revised_prompt})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
