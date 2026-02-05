import express from "express";
import multer from "multer";
import sharp from "sharp";
import { spawnSync } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { checkPlaywright } from "./health.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || process.env.WEBSITES_PORT || 7071;
const TMP_DIR = path.join(os.tmpdir(), "convertix-image-engine");
fs.mkdirSync(TMP_DIR, { recursive: true });

const magickBinary = (() => {
  const hasMagick = spawnSync("magick", ["-version"], { stdio: "ignore" }).status === 0;
  if (hasMagick) return "magick";
  const hasConvert = spawnSync("convert", ["-version"], { stdio: "ignore" }).status === 0;
  return hasConvert ? "convert" : null;
})();

const downloadToBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download output (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
};

app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health/tools", async (_req, res) => {
  const playwrightOk = await checkPlaywright();
  res.json({ playwright: playwrightOk });
});

app.post("/image/process", upload.single("file"), async (req, res) => {
  const operation = req.body.operation;
  if (!req.file) {
    return res.status(400).json({ error: "Missing file" });
  }

  try {
    const buffer = req.file.buffer;
    let outputBuffer = null;
    let outputType = req.file.mimetype || "image/png";

    switch (operation) {
      case "compress": {
        const quality = Number(req.body.quality ?? 80);
        const img = sharp(buffer);
        const meta = await img.metadata();
        if (meta.format === "jpeg" || meta.format === "jpg") {
          outputBuffer = await img.jpeg({ quality }).toBuffer();
          outputType = "image/jpeg";
        } else if (meta.format === "png") {
          outputBuffer = await img.png({ quality }).toBuffer();
          outputType = "image/png";
        } else {
          outputBuffer = await img.jpeg({ quality }).toBuffer();
          outputType = "image/jpeg";
        }
        break;
      }
      case "resize": {
        const width = req.body.width ? Number(req.body.width) : null;
        const height = req.body.height ? Number(req.body.height) : null;
        const fit = req.body.fit || "inside";
        outputBuffer = await sharp(buffer).resize(width, height, { fit }).toBuffer();
        break;
      }
      case "crop": {
        const left = Number(req.body.left ?? 0);
        const top = Number(req.body.top ?? 0);
        const width = Number(req.body.width ?? 0);
        const height = Number(req.body.height ?? 0);
        if (!width || !height) {
          return res.status(400).json({ error: "Invalid crop dimensions" });
        }
        outputBuffer = await sharp(buffer).extract({ left, top, width, height }).toBuffer();
        break;
      }
      case "rotate": {
        const angle = Number(req.body.angle ?? 0);
        outputBuffer = await sharp(buffer).rotate(angle).toBuffer();
        break;
      }
      case "convert-to-jpg": {
        outputBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
        outputType = "image/jpeg";
        break;
      }
      case "convert-from-jpg": {
        const format = (req.body.format || "png").toLowerCase();
        if (format === "png") {
          outputBuffer = await sharp(buffer).png().toBuffer();
          outputType = "image/png";
        } else if (format === "gif") {
          if (!magickBinary) {
            return res.status(400).json({ error: "ImageMagick not available for GIF output" });
          }
          const inputPath = path.join(TMP_DIR, `${randomUUID()}.jpg`);
          const outputPath = path.join(TMP_DIR, `${randomUUID()}.gif`);
          fs.writeFileSync(inputPath, buffer);
          const proc = spawnSync(magickBinary, [inputPath, outputPath]);
          if (proc.status !== 0) {
            return res.status(500).json({ error: "GIF conversion failed" });
          }
          outputBuffer = fs.readFileSync(outputPath);
          outputType = "image/gif";
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        } else {
          return res.status(400).json({ error: "Unsupported format" });
        }
        break;
      }
      case "watermark": {
        const text = req.body.text || "Convertix";
        const opacityRaw = Number(req.body.opacity ?? 0.35);
        const opacity = Math.min(Math.max(opacityRaw, 0.05), 0.9);
        const position = (req.body.position || "bottom-right").toLowerCase();
        const scaleRaw = Number(req.body.scale ?? 0.12);
        const scale = Math.min(Math.max(scaleRaw, 0.05), 0.4);

        const img = sharp(buffer);
        const meta = await img.metadata();
        const width = meta.width ?? 1200;
        const height = meta.height ?? 800;
        const margin = Math.round(Math.min(width, height) * 0.05);
        const fontSize = Math.max(14, Math.round(width * scale));

        let x = width - margin;
        let y = height - margin;
        let anchor = "end";

        if (position.includes("top")) y = margin + fontSize;
        if (position.includes("left")) {
          x = margin;
          anchor = "start";
        }
        if (position === "center") {
          x = Math.round(width / 2);
          y = Math.round(height / 2);
          anchor = "middle";
        }

        const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .wm { font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: rgba(255,255,255,${opacity}); }
  </style>
  <text x="${x}" y="${y}" text-anchor="${anchor}" class="wm">${text}</text>
</svg>`;

        outputBuffer = await img
          .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
          .toBuffer();
        outputType = meta.format === "jpeg" ? "image/jpeg" : "image/png";
        break;
      }
      default:
        return res.status(400).json({ error: "Unsupported operation" });
    }

    if (!outputBuffer) {
      return res.status(500).json({ error: "Image processing failed" });
    }

    res.setHeader("Content-Type", outputType);
    res.send(outputBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image processing error";
    res.status(500).json({ error: message });
  }
});

app.post("/image/ai/remove-bg", upload.single("file"), async (req, res) => {
  const apiKey = req.header("x-removebg-key");
  if (!apiKey) return res.status(403).json({ error: "Remove.bg key missing" });
  if (!req.file) return res.status(400).json({ error: "Missing file" });

  try {
    const form = new FormData();
    form.append("image_file", new Blob([req.file.buffer]), req.file.originalname || "image.png");
    form.append("size", "auto");
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form
    });
    if (!response.ok) {
      const message = await response.text();
      return res.status(response.status).json({ error: message || "Remove.bg failed" });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Remove background failed";
    res.status(500).json({ error: message });
  }
});

app.post("/image/ai/upscale", upload.single("file"), async (req, res) => {
  const apiKey = req.header("x-deepai-key");
  if (!apiKey) return res.status(403).json({ error: "DeepAI key missing" });
  if (!req.file) return res.status(400).json({ error: "Missing file" });

  try {
    const form = new FormData();
    form.append("image", new Blob([req.file.buffer]), req.file.originalname || "image.png");
    const response = await fetch("https://api.deepai.org/api/waifu2x", {
      method: "POST",
      headers: { "Api-Key": apiKey },
      body: form
    });
    const json = await response.json();
    if (!response.ok || !json?.output_url) {
      return res.status(500).json({ error: json?.error || "Upscale failed" });
    }
    const buffer = await downloadToBuffer(json.output_url);
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upscale failed";
    res.status(500).json({ error: message });
  }
});

app.post("/image/ai/blur-face", upload.single("file"), async (req, res) => {
  const apiKey = req.header("x-google-vision-key");
  if (!apiKey) return res.status(403).json({ error: "Google Vision key missing" });
  if (!req.file) return res.status(400).json({ error: "Missing file" });

  try {
    const base64 = req.file.buffer.toString("base64");
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "FACE_DETECTION", maxResults: 10 }]
            }
          ]
        })
      }
    );
    const json = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: json?.error?.message || "Face detection failed" });
    }

    const faces = json?.responses?.[0]?.faceAnnotations ?? [];
    if (faces.length === 0) {
      return res.status(200).send(req.file.buffer);
    }

    const metadata = await sharp(req.file.buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const blurred = await sharp(req.file.buffer).blur(22).toBuffer();
    const overlays = [];

    for (const face of faces) {
      const vertices = face?.boundingPoly?.vertices ?? [];
      const xs = vertices.map((v) => v.x ?? 0);
      const ys = vertices.map((v) => v.y ?? 0);
      const left = Math.max(0, Math.min(...xs));
      const top = Math.max(0, Math.min(...ys));
      const right = Math.min(width, Math.max(...xs));
      const bottom = Math.min(height, Math.max(...ys));
      const rectWidth = Math.max(0, right - left);
      const rectHeight = Math.max(0, bottom - top);
      if (!rectWidth || !rectHeight) continue;
      const region = await sharp(blurred)
        .extract({ left, top, width: rectWidth, height: rectHeight })
        .toBuffer();
      overlays.push({ input: region, left, top });
    }

    const output = await sharp(req.file.buffer).composite(overlays).png().toBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Face blur failed";
    res.status(500).json({ error: message });
  }
});

app.post("/image/ai/meme", upload.single("file"), async (req, res) => {
  const username = req.header("x-imgflip-user");
  const password = req.header("x-imgflip-password");
  if (!username || !password) return res.status(403).json({ error: "Imgflip credentials missing" });
  if (!req.file) return res.status(400).json({ error: "Missing file" });

  const templateId = req.body.templateId;
  const topText = req.body.topText || "";
  const bottomText = req.body.bottomText || "";
  if (!templateId) return res.status(400).json({ error: "Missing templateId" });

  try {
    const form = new URLSearchParams();
    form.set("template_id", templateId);
    form.set("username", username);
    form.set("password", password);
    form.set("text0", topText);
    form.set("text1", bottomText);

    const response = await fetch("https://api.imgflip.com/caption_image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    const json = await response.json();
    if (!response.ok || !json?.success || !json?.data?.url) {
      return res.status(500).json({ error: json?.error_message || "Meme generation failed" });
    }

    const buffer = await downloadToBuffer(json.data.url);
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Meme generation failed";
    res.status(500).json({ error: message });
  }
});

app.post("/image/html-to-image", async (req, res) => {
  const url = req.body?.url;
  const format = (req.body?.format || "png").toLowerCase();
  if (!url) {
    return res.status(400).json({ error: "Missing url" });
  }

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    const buffer = await page.screenshot({ fullPage: true, type: format === "jpg" ? "jpeg" : "png" });
    await browser.close();

    res.setHeader("Content-Type", format === "jpg" ? "image/jpeg" : "image/png");
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "HTML render failed";
    res.status(500).json({ error: message });
  }
});

app.post("/image/html-to-pdf", async (req, res) => {
  const url = req.body?.url;
  if (!url) {
    return res.status(400).json({ error: "Missing url" });
  }
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "URL must start with http:// or https://" });
  }

  try {
    const { chromium } = await import("playwright");
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    const buffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "HTML render failed";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Convertix image engine running on port ${PORT}`);
});

