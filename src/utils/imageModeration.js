// Client-side NSFW (nude / 18+) image screening for wellness-chat attachments, using
// nsfwjs (TensorFlow.js). The model is loaded lazily once and cached. If the model can't
// load (e.g. the package isn't installed or the device is offline), we FAIL OPEN — the
// attachment is allowed but reported as unchecked — so chat keeps working; the caller can
// decide how to surface "couldn't verify". This is a UX guard, not a hard server guarantee.

let modelPromise = null;

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const nsfw = await import("nsfwjs");
      // Default MobileNetV2 model; weights are fetched from the CDN on first use and cached.
      return nsfw.load();
    })();
  }
  return modelPromise;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = URL.createObjectURL(file);
  });
}

// Returns { safe, checked, reason? }.
//  - non-images are never blocked (checked: false)
//  - explicit images: { safe: false, checked: true, reason }
//  - model unavailable: { safe: true, checked: false }
export async function moderateImageFile(file) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    return { safe: true, checked: false };
  }

  let model;
  try {
    model = await getModel();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("NSFW model unavailable; skipping image screening", err);
    modelPromise = null; // allow a retry on the next attempt
    return { safe: true, checked: false };
  }

  let img;
  try {
    img = await fileToImage(file);
    const predictions = await model.classify(img);
    const score = {};
    predictions.forEach((p) => {
      score[p.className] = p.probability;
    });
    const porn = score.Porn || 0;
    const hentai = score.Hentai || 0;
    const sexy = score.Sexy || 0;
    // Block clear pornography/hentai, and strongly-sexual images.
    const explicit = porn > 0.5 || hentai > 0.5 || sexy > 0.7;
    if (explicit) {
      return { safe: false, checked: true, reason: "This image looks explicit (18+) and can't be sent." };
    }
    return { safe: true, checked: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("NSFW screening failed; allowing image", err);
    return { safe: true, checked: false };
  } finally {
    if (img?.src) URL.revokeObjectURL(img.src);
  }
}
