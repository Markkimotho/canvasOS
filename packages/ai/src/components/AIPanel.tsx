import { useState, useCallback, useRef } from "react";
import { ArtGenClient, type ProviderId } from "../ArtGenClient.js";
import { PromptHistory } from "../history/PromptHistory.js";
import { KeyStorage } from "../security/KeyStorage.js";

const client = new ArtGenClient();
const history = new PromptHistory();

interface GeneratedImage {
  url: string;
  blob: Blob;
}

export function AIPanel() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [n, setN] = useState(1);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const styleRefRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setResults([]);

    try {
      client.setProvider(provider);
      const result = await client.generate({
        prompt,
        negativePrompt: negativePrompt || undefined,
        width,
        height,
        n,
        seed,
      });

      const generated = result.images.map((blob) => ({
        blob,
        url: URL.createObjectURL(blob),
      }));
      setResults(generated);
      history.add(
        { prompt, negativePrompt, width, height, n, seed },
        provider,
        result.model,
        result.images,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [prompt, negativePrompt, provider, width, height, n, seed]);

  const handleSaveKey = useCallback(async () => {
    if (apiKey.trim()) {
      await KeyStorage.set(provider, apiKey.trim());
      setShowApiKeyForm(false);
      setApiKey("");
    }
  }, [apiKey, provider]);

  const historyEntries = history.getAll();

  return (
    <div
      aria-label="AI generation panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
        height: "100%",
        overflowY: "auto",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: "10px",
            color: "#777",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          AI Generate
        </span>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            background: "none",
            border: "none",
            color: "#777",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          History ({historyEntries.length})
        </button>
      </div>

      {showHistory ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {historyEntries.slice(0, 20).map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                setPrompt(entry.prompt);
                setNegativePrompt(entry.negativePrompt ?? "");
                setShowHistory(false);
              }}
              style={{
                background: "#2a2a2a",
                border: "1px solid #333",
                borderRadius: "4px",
                padding: "6px",
                cursor: "pointer",
                textAlign: "left",
                color: "#ddd",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.prompt}
              </div>
              <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                {entry.thumbnailUrls.slice(0, 2).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    style={{
                      width: "32px",
                      height: "32px",
                      objectFit: "cover",
                      borderRadius: "2px",
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Provider select */}
          <div>
            <label
              htmlFor="ai-provider"
              style={{ color: "#777", display: "block", marginBottom: "2px" }}
            >
              Provider
            </label>
            <div style={{ display: "flex", gap: "4px" }}>
              <select
                id="ai-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderId)}
                style={{
                  flex: 1,
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#f0f0f0",
                  padding: "4px",
                  fontSize: "12px",
                }}
              >
                <option value="openai">OpenAI (DALL·E 3)</option>
                <option value="stability">Stability AI (SD3)</option>
                <option value="replicate">Replicate (FLUX)</option>
                <option value="local">Local (SD)</option>
              </select>
              <button
                onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                aria-label="Configure API key"
                style={{
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#aaa",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "12px",
                }}
              >
                🔑
              </button>
            </div>
          </div>

          {/* API key form */}
          {showApiKeyForm && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`${provider} API key`}
                aria-label="API key input"
                style={{
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#f0f0f0",
                  padding: "6px",
                  fontSize: "12px",
                }}
              />
              <p style={{ color: "#555", fontSize: "10px", margin: 0 }}>
                Stored locally with AES-256-GCM. Never sent to CanvasOS servers.
              </p>
              <button
                onClick={handleSaveKey}
                style={{
                  background: "#6366f1",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  cursor: "pointer",
                  padding: "5px",
                  fontSize: "12px",
                }}
              >
                Save Key
              </button>
            </div>
          )}

          {/* Prompt */}
          <div>
            <label
              htmlFor="ai-prompt"
              style={{ color: "#777", display: "block", marginBottom: "2px" }}
            >
              Prompt
            </label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create…"
              rows={3}
              style={{
                width: "100%",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "4px",
                color: "#f0f0f0",
                padding: "6px",
                fontSize: "12px",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Negative prompt */}
          <div>
            <label
              htmlFor="ai-neg"
              style={{ color: "#777", display: "block", marginBottom: "2px" }}
            >
              Negative Prompt
            </label>
            <textarea
              id="ai-neg"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What to avoid…"
              rows={2}
              style={{
                width: "100%",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "4px",
                color: "#f0f0f0",
                padding: "6px",
                fontSize: "12px",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Size */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label
                htmlFor="ai-width"
                style={{ color: "#777", display: "block", marginBottom: "2px" }}
              >
                W
              </label>
              <input
                id="ai-width"
                type="number"
                min={64}
                max={2048}
                step={64}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                style={{
                  width: "100%",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#f0f0f0",
                  padding: "4px",
                  fontSize: "12px",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="ai-height"
                style={{ color: "#777", display: "block", marginBottom: "2px" }}
              >
                H
              </label>
              <input
                id="ai-height"
                type="number"
                min={64}
                max={2048}
                step={64}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                style={{
                  width: "100%",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#f0f0f0",
                  padding: "4px",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          {/* Variants + Seed */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label
                htmlFor="ai-variants"
                style={{ color: "#777", display: "block", marginBottom: "2px" }}
              >
                Variants (1–8)
              </label>
              <input
                id="ai-variants"
                type="number"
                min={1}
                max={8}
                value={n}
                onChange={(e) => setN(Math.min(8, Math.max(1, Number(e.target.value))))}
                style={{
                  width: "100%",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#f0f0f0",
                  padding: "4px",
                  fontSize: "12px",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="ai-seed"
                style={{ color: "#777", display: "block", marginBottom: "2px" }}
              >
                Seed
              </label>
              <input
                id="ai-seed"
                type="number"
                placeholder="Random"
                value={seed ?? ""}
                onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                style={{
                  width: "100%",
                  background: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  color: "#f0f0f0",
                  padding: "4px",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          {/* Style reference drag-drop */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              styleRefRef.current?.click();
            }}
            style={{
              border: "1px dashed #444",
              borderRadius: "4px",
              padding: "10px",
              textAlign: "center",
              color: "#555",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Drop style reference image
            <input ref={styleRefRef} type="file" accept="image/*" style={{ display: "none" }} />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "11px", margin: 0 }}>{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            aria-label="Generate image"
            style={{
              background: generating ? "#4b4b8f" : "#6366f1",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              cursor: generating ? "not-allowed" : "pointer",
              padding: "8px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {generating ? "Generating…" : "Generate"}
          </button>

          {/* Results grid */}
          {results.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              {results.map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={img.url}
                    alt={`Generated variant ${i + 1}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      objectFit: "cover",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // Insert as canvas layer
                      console.debug("Insert AI result as layer", i);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
