const state = {
  manifest: null,
  cache: new Map(),
  selectors: {},
};

const NONE_VALUE = "__none__";
const $ = (id) => document.getElementById(id);
let installPromptEvent = null;
let fontReady;
let previewVersion = 0;

function getPrice() {
  if ($("hidePrice").checked) return null;
  const value = $("priceInput").value.replace(/,/g, "").trim();
  if (!/^\d{1,7}$/.test(value)) throw new Error("가격은 0~9,999,999 사이의 숫자로 입력해주세요.");
  return Number(value);
}

function drawPrice(ctx, width, scale, price) {
  if (price === null) return;
  // Convert physical A3 points to the working canvas pixel density.
  const pxPerPoint = width / (297 / 25.4 * 72);
  const amount = price.toLocaleString("ko-KR");
  const numberFont = `900 ${66 * pxPerPoint}px Hahmlet`;
  const unitFont = `600 ${48 * pxPerPoint}px Hahmlet`;
  ctx.save();
  ctx.font = numberFont;
  const amountWidth = ctx.measureText(amount).width;
  ctx.font = unitFont;
  const unitWidth = ctx.measureText("원").width;
  const x = (width - amountWidth - unitWidth) / 2;
  const baseline = 1007 * width / 1684;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 14 * width / 1684 * scale;
  ctx.shadowOffsetY = 6 * width / 1684 * scale;
  ctx.font = numberFont;
  ctx.fillText(amount, x, baseline);
  ctx.font = unitFont;
  ctx.fillText("원", x + amountWidth, baseline);
  ctx.restore();
}

function displayName(fileName) {
  if (fileName === NONE_VALUE) return "가격없음";

  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/^(head|image|price|footer)_/i, "")
    .replace(/^(\d{2})(\d{3})$/, "$1,$2원")
    .replace(/^(\d+)$/, (_, value) => Number(value).toLocaleString("ko-KR") + "원");
}

function createSearchSelector({ inputId, listId, items, defaultIndex = 0 }) {
  const input = $(inputId);
  const list = $(listId);
  const labels = new Map();
  const files = new Map();

  list.innerHTML = "";
  items.forEach((item) => {
    const label = displayName(item);
    const option = document.createElement("option");
    option.value = label;
    option.label = item === NONE_VALUE ? "가격 레이어 숨김" : item;
    list.appendChild(option);
    labels.set(item, label);
    files.set(label, item);
  });

  const setValue = (fileName) => {
    input.value = labels.get(fileName) || displayName(fileName);
    input.dataset.value = fileName;
  };

  const resolveValue = () => {
    const exact = files.get(input.value);
    if (exact) return exact;

    const query = input.value.trim().toLowerCase();
    if (!query) return input.dataset.value;

    const found = items.find((item) => {
      const label = labels.get(item).toLowerCase();
      return label.includes(query) || item.toLowerCase().includes(query);
    });

    return found || input.dataset.value || items[0];
  };

  const commit = () => {
    const fileName = resolveValue();
    setValue(fileName);
    updatePreview();
  };

  input.addEventListener("change", commit);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
  input.addEventListener("focus", () => input.select());

  setValue(items[defaultIndex] || items[0]);

  return {
    get value() {
      return input.dataset.value;
    },
    setValue,
  };
}

function assetUrl(fileName) {
  return encodeURI(state.manifest.assetBase + fileName);
}

function loadLocalAsset(fileName) {
  return new Promise((resolve, reject) => {
    if (window.POSTER_LOCAL_ASSETS?.[fileName]) {
      resolve(window.POSTER_LOCAL_ASSETS[fileName]);
      return;
    }
    const script = document.createElement("script");
    script.src = `local-assets/${encodeURIComponent(fileName)}.js`;
    script.onload = () => {
      script.remove();
      const data = window.POSTER_LOCAL_ASSETS?.[fileName];
      if (data) resolve(data);
      else reject(new Error("로컬 이미지 데이터가 없습니다. update_manifest.py를 실행해주세요."));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error(`${fileName}: update_manifest.py를 실행하여 로컬 이미지 데이터를 갱신해주세요.`));
    };
    document.head.appendChild(script);
  });
}

function loadImage(fileName) {
  if (state.cache.has(fileName)) {
    return state.cache.get(fileName);
  }

  const source = location.protocol === "file:" ? loadLocalAsset(fileName) : Promise.resolve(assetUrl(fileName));
  const promise = source.then((url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`${fileName} 파일을 불러오지 못했습니다.`));
    image.src = url;
  })).catch((error) => {
    state.cache.delete(fileName);
    throw error;
  });

  state.cache.set(fileName, promise);
  return promise;
}

function drawLayer(ctx, image, width, height) {
  const x = Math.floor((width - image.naturalWidth) / 2);
  const y = Math.floor((height - image.naturalHeight) / 2);
  ctx.drawImage(image, x, y, image.naturalWidth, image.naturalHeight);
}

async function render(targetCanvas = $("posterCanvas"), scale = 1) {
  const price = getPrice();
  await fontReady;
  const { width, height } = state.manifest.canvas;
  const canvasWidth = Math.round(width * scale);
  const canvasHeight = Math.round(height * scale);

  targetCanvas.width = canvasWidth;
  targetCanvas.height = canvasHeight;

  const ctx = targetCanvas.getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const layers = [
    state.selectors.image.value,
    state.selectors.head.value,
    state.selectors.footer.value,
  ].filter((layer) => layer && layer !== NONE_VALUE);

  for (const layer of layers) {
    const image = await loadImage(layer);
    drawLayer(ctx, image, width, height);
  }

  drawPrice(ctx, width, scale, price);
  ctx.restore();
}

async function downloadPoster() {
  const button = $("downloadBtn");
  const status = $("status");
  const { canvas } = state.manifest;
  const exportSize = $("exportSize").value;
  const format = $("exportFormat").value;
  const scale = exportSize === "print" ? canvas.printWidth / canvas.width : 1;
  const extension = format === "image/jpeg" ? "jpg" : "png";
  const exportCanvas = document.createElement("canvas");

  button.disabled = true;
  status.textContent = "내보내기 이미지를 생성하는 중입니다.";

  try {
    await render(exportCanvas, scale);
    const imageName = displayName(state.selectors.image.value);
    const price = getPrice();
    const priceName = price === null ? "가격없음" : `${price}원`;
    const link = document.createElement("a");
    link.download = `A3_${imageName}_${priceName}.${extension}`;
    link.href = exportCanvas.toDataURL(format, 0.95);
    link.click();
    status.textContent = "이미지 내보내기가 완료되었습니다.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

function setupInstallButton() {
  const installButton = $("installBtn");
  if (!installButton) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPromptEvent = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!installPromptEvent) return;
    installButton.disabled = true;
    await installPromptEvent.prompt();
    installPromptEvent = null;
    installButton.hidden = true;
    installButton.disabled = false;
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    installButton.hidden = true;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return;

  navigator.serviceWorker.register("service-worker.js").catch(() => {
    $("status").textContent = "오프라인 설치 기능을 준비하지 못했습니다. 일반 사용은 가능합니다.";
  });
}

function updatePreview() {
  const version = ++previewVersion;
  const buffer = document.createElement("canvas");
  $("status").textContent = "미리보기를 갱신하는 중입니다.";
  render(buffer)
    .then(() => {
      if (version !== previewVersion) return;
      const canvas = $("posterCanvas");
      canvas.width = buffer.width;
      canvas.height = buffer.height;
      canvas.getContext("2d").drawImage(buffer, 0, 0);
      $("status").textContent = "미리보기가 준비되었습니다.";
    })
    .catch((error) => {
      if (version !== previewVersion) return;
      $("status").textContent = error.message;
    });
}

function resetDefaults() {
  state.selectors.head.setValue(state.manifest.heads[0]);
  state.selectors.image.setValue(state.manifest.images[0]);
  $("priceInput").value = "10000";
  $("hidePrice").checked = false;
  $("priceInput").disabled = false;
  state.selectors.footer.setValue(state.manifest.footers[0]);
  updatePreview();
}

async function init() {
  const face = new FontFace("Hahmlet", `url(${window.HAHMLET_FONT})`, { weight: "100 900" });
  fontReady = face.load().then((font) => document.fonts.add(font));
  await fontReady;
  setupInstallButton();
  registerServiceWorker();

  if (window.POSTER_MANIFEST) {
    state.manifest = window.POSTER_MANIFEST;
  } else {
    const response = await fetch("manifest.json", { cache: "no-store" });
    state.manifest = await response.json();
  }

  state.selectors.head = createSearchSelector({
    inputId: "headInput",
    listId: "headList",
    items: state.manifest.heads,
  });
  state.selectors.image = createSearchSelector({
    inputId: "imageInput",
    listId: "imageList",
    items: state.manifest.images,
  });
  for (const file of state.manifest.prices) {
    const match = file.match(/^price_(\d+)\./i);
    if (!match) continue;
    const option = document.createElement("option");
    option.value = match[1];
    $("priceList").appendChild(option);
  }
  $("priceInput").addEventListener("input", updatePreview);
  $("hidePrice").addEventListener("change", () => {
    $("priceInput").disabled = $("hidePrice").checked;
    updatePreview();
  });
  state.selectors.footer = createSearchSelector({
    inputId: "footerInput",
    listId: "footerList",
    items: state.manifest.footers,
  });

  $("downloadBtn").addEventListener("click", downloadPoster);
  $("resetBtn").addEventListener("click", resetDefaults);

  await render();
  $("status").textContent = "미리보기가 준비되었습니다.";
}

init().catch((error) => {
  $("status").textContent = error.message;
});
