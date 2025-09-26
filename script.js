const { jsPDF } = window.jspdf || {};
const startBtn = document.getElementById('startBtn');
const fileInput = document.getElementById('fileInput');
const appUI = document.getElementById('appUI');
const thumbs = document.getElementById('thumbs');
const previewBox = document.getElementById('previewBox');
const pageSize = document.getElementById('pageSize');
const customBox = document.getElementById('customBox');
const wPx = document.getElementById('wPx');
const hPx = document.getElementById('hPx');
const orientation = document.getElementById('orientation');
const quality = document.getElementById('quality');
const outName = document.getElementById('outName');
const createBtn = document.getElementById('createBtn');

let imgs = [], selected = -1;

startBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  files.forEach(f => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      imgs.push({ file: f, dataURL: ev.target.result, rotation: 0 });
      renderThumbs();
      updatePreview();
    };
    reader.readAsDataURL(f);
  });
  document.querySelector('.landing').style.display = 'none';
  appUI.style.display = 'block';
});

function renderThumbs() {
  thumbs.innerHTML = '';
  imgs.forEach((it, idx) => {
    const div = document.createElement('div'); div.className = 'thumb';
    div.innerHTML = `<img src="${it.dataURL}"/><div style='text-align:center;font-size:12px;'>rotate ${it.rotation}°</div>`;
    div.addEventListener('click', () => { selected = idx; updatePreview(); });
    thumbs.appendChild(div);
  });
}

function updatePreview() {
  previewBox.innerHTML = '';
  if (selected < 0 || !imgs[selected]) {
    previewBox.innerHTML = '<span>No image selected</span>'; return;
  }
  const im = document.createElement('img');
  im.src = imgs[selected].dataURL;
  im.style.transform = `rotate(${imgs[selected].rotation}deg)`;
  previewBox.appendChild(im);
}

pageSize.addEventListener('change', () => {
  customBox.style.display = pageSize.value === 'custom' ? 'flex' : 'none';
});

async function makePDF() {
  if (imgs.length === 0) { alert('Add images first'); return; }

  const pdf = new jsPDF({
    unit: 'px',
    format: pageSize.value === 'a4' ? [595, 842] :
            pageSize.value === 'letter' ? [612, 792] :
            [parseInt(wPx.value) || 600, parseInt(hPx.value) || 800],
    orientation: orientation.value
  });

  for (let i = 0; i < imgs.length; i++) {
    const imgEl = await loadImage(imgs[i].dataURL, imgs[i].rotation);
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(w / imgEl.width, h / imgEl.height);
    const iw = imgEl.width * ratio;
    const ih = imgEl.height * ratio;
    const x = (w - iw) / 2; const y = (h - ih) / 2;
    if (i > 0) pdf.addPage();
    pdf.addImage(imgEl, 'JPEG', x, y, iw, ih, undefined, 'FAST');
  }
  pdf.save(outName.value || 'images.pdf');
}

function loadImage(url, rotation) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      if (rotation % 360 === 0) { res(img); return; }
      const c = document.createElement('canvas'); const ctx = c.getContext('2d');
      if (rotation % 180 !== 0) { c.width = img.height; c.height = img.width; }
      else { c.width = img.width; c.height = img.height; }
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rimg = new Image();
      rimg.onload = () => res(rimg);
      rimg.src = c.toDataURL('image/png');
    };
    img.onerror = rej;
    img.src = url;
  });
}

createBtn.addEventListener('click', makePDF);
