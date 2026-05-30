export const DEFAULT_CENTER_SIZE_RATIO = 0.28;

function assertBrowserCanvas() {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("Mandala template rendering requires a browser canvas environment.");
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось загрузить изображение для мандалы."));
    image.src = src;
  });
}

export function clampCenterSizeRatio(value = DEFAULT_CENTER_SIZE_RATIO) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_CENTER_SIZE_RATIO;
  return Math.min(Math.max(number, 0.12), 0.5);
}

export function calculateCenterPhotoBox(width, height, centerSizeRatio = DEFAULT_CENTER_SIZE_RATIO) {
  const size = Math.round(Math.min(width, height) * clampCenterSizeRatio(centerSizeRatio));
  return {
    x: Math.round((width - size) / 2),
    y: Math.round((height - size) / 2),
    size
  };
}

function drawCoverImage(context, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else if (imageRatio < targetRatio) {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

export async function renderTemplateMandalaToDataUrl({
  templateImageUrl,
  clientPhotoUrl,
  centerShape = "circle",
  centerSizeRatio = DEFAULT_CENTER_SIZE_RATIO,
  outputType = "image/png",
  outputQuality
} = {}) {
  assertBrowserCanvas();

  if (!templateImageUrl) throw new Error("Нужен шаблон мандалы.");
  if (!clientPhotoUrl) throw new Error("Нужно фото клиента.");

  const [templateImage, clientImage] = await Promise.all([
    loadImage(templateImageUrl),
    loadImage(clientPhotoUrl)
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = templateImage.naturalWidth || templateImage.width;
  canvas.height = templateImage.naturalHeight || templateImage.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas недоступен.");

  context.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

  const { x, y, size } = calculateCenterPhotoBox(canvas.width, canvas.height, centerSizeRatio);

  context.save();
  if (centerShape === "circle") {
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    context.clip();
  } else {
    context.beginPath();
    context.rect(x, y, size, size);
    context.clip();
  }
  drawCoverImage(context, clientImage, x, y, size, size);
  context.restore();

  return canvas.toDataURL(outputType, outputQuality);
}
