const SHEET_ID = "1qFPrdYf5nwRYiG-eVwNMJcrhFCcQB-10Z7Zm6Z3mBIw";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

let sheetData = [];
let currentCode = [null, null, null, null, null];
let currentPosition = 0;
let fallbackVideos = [];

// Input methods
const INPUT_METHODS = ['numbers', 'dice', 'spots'];

async function loadSheetData() {
  try {
    const response = await fetch(CSV_URL);
    const csv = await response.text();
    const rows = csv.split('\n').filter(row => row.trim());

    for (let i = 1; i < rows.length; i++) {
      const cells = parseCSVRow(rows[i]);
      if (cells.length >= 5 && cells[0].trim()) {
        sheetData.push({
          name: cells[0].trim(),
          passcode: cells[1].trim(),
          videoLink: cells[2].trim(),
          fallback1: cells[3].trim(),
          fallback2: cells[4].trim(),
          fallback3: cells[5]?.trim() || cells[4].trim()
        });
      }
    }

    // Extract fallback videos from first row
    if (sheetData.length > 0) {
      fallbackVideos = [
        sheetData[0].fallback1,
        sheetData[0].fallback2,
        sheetData[0].fallback3
      ].filter(link => link);
    }

    initializeApp();
  } catch (error) {
    console.error('Error loading sheet:', error);
    document.querySelector('.container').innerHTML = '<p style="color: white; text-align: center;">Error loading data</p>';
  }
}

function parseCSVRow(row) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function initializeApp() {
  setActiveBox(0);
  attachBoxListeners();
}

function attachBoxListeners() {
  document.querySelectorAll('.input-box').forEach(box => {
    box.addEventListener('click', () => {
      const position = parseInt(box.dataset.position);
      openOptionsModal(position);
    });
  });
}

function setActiveBox(position) {
  document.querySelectorAll('.input-box').forEach(box => {
    box.classList.remove('active');
  });
  document.querySelector(`[data-position="${position}"]`).classList.add('active');
  currentPosition = position;
}

function openOptionsModal(position) {
  setActiveBox(position);

  const inputMethod = INPUT_METHODS[Math.floor(Math.random() * INPUT_METHODS.length)];
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  const numbers = [1, 2, 3, 4, 5];
  const shuffled = shuffle(numbers);

  if (inputMethod === 'numbers') {
    shuffled.forEach(num => {
      const option = document.createElement('div');
      option.className = 'option';
      option.innerHTML = `<div class="option-number">${num}</div>`;
      option.addEventListener('click', () => selectNumber(position, num));
      container.appendChild(option);
    });
  } else if (inputMethod === 'dice') {
    shuffled.forEach(num => {
      const option = document.createElement('div');
      option.className = 'option';
      option.innerHTML = generateDiceFace(num);
      option.addEventListener('click', () => selectNumber(position, num));
      container.appendChild(option);
    });
  } else if (inputMethod === 'spots') {
    shuffled.forEach(num => {
      const option = document.createElement('div');
      option.className = 'option';
      option.innerHTML = generateSpots(num);
      option.addEventListener('click', () => selectNumber(position, num));
      container.appendChild(option);
    });
  }

  document.getElementById('optionsModal').classList.remove('hidden');
}

function generateDiceFace(num) {
  const patterns = {
    1: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    2: [[1, 0, 0], [0, 0, 0], [0, 0, 1]],
    3: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    4: [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
    5: [[1, 0, 1], [0, 1, 0], [1, 0, 1]]
  };

  const pattern = patterns[num];
  let html = '<div class="option-dice">';
  pattern.forEach(row => {
    row.forEach(cell => {
      html += cell ? '<div class="dot"></div>' : '<div class="dot empty"></div>';
    });
  });
  html += '</div>';
  return html;
}

function generateSpots(num) {
  const positions = {
    1: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    2: [[1, 0, 0], [0, 0, 0], [0, 0, 1]],
    3: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    4: [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
    5: [[1, 0, 1], [0, 1, 0], [1, 0, 1]]
  };

  const pattern = positions[num];
  let html = '<div class="option-dice">';
  pattern.forEach(row => {
    row.forEach(cell => {
      html += cell ? '<div class="dot"></div>' : '<div class="dot empty"></div>';
    });
  });
  html += '</div>';
  return html;
}

function selectNumber(position, num) {
  currentCode[position] = num;
  updateBoxDisplay(position, num);
  document.getElementById('optionsModal').classList.add('hidden');

  // Show submit button when all boxes are filled
  if (currentCode.every(val => val !== null)) {
    document.getElementById('submitBtn').classList.remove('hidden');
  }

  // Move to next unfilled box or stay if all filled
  if (position < 4 && currentCode[position + 1] === null) {
    setActiveBox(position + 1);
  }
}

function updateBoxDisplay(position, num) {
  const box = document.querySelector(`[data-position="${position}"] .box-value`);
  box.textContent = num;
  box.classList.remove('empty');
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function extractFileId(driveLink) {
  const match = driveLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function getEmbedUrl(driveLink) {
  const fileId = extractFileId(driveLink);
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
}

document.getElementById('submitBtn').addEventListener('click', checkCode);

function checkCode() {
  const enteredCode = currentCode.join('-');

  // Find matching passcode in sheet data
  const match = sheetData.find(row => row.passcode === enteredCode);

  if (match) {
    // Correct code - show their video
    playVideo(match.videoLink, match.name);
  } else {
    // Wrong code - show random fallback
    const randomFallback = fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
    playVideo(randomFallback, 'Oops! Wrong code');
  }
}

function playVideo(driveLink, title) {
  const embedUrl = getEmbedUrl(driveLink);
  
  if (!embedUrl) {
    alert('Error: Could not load video');
    return;
  }

  // Hide main content
  document.querySelector('.container').style.display = 'none';

  // Create video player modal
  const videoModal = document.createElement('div');
  videoModal.id = 'videoModal';
  videoModal.className = 'video-modal';
  videoModal.innerHTML = `
    <div class="video-container">
      <h2>${title}</h2>
      <div class="video-wrapper">
        <iframe 
          src="${embedUrl}" 
          allow="autoplay"
          frameborder="0"
          style="width: 100%; height: 100%;">
        </iframe>
      </div>
      <button id="tryAgainBtn" class="try-again-btn">Try Again</button>
    </div>
  `;

  document.body.appendChild(videoModal);

  // Try Again button resets everything
  document.getElementById('tryAgainBtn').addEventListener('click', () => {
    videoModal.remove();
    document.querySelector('.container').style.display = 'block';
    resetGame();
  });
}

function resetGame() {
  currentCode = [null, null, null, null, null];
  document.querySelectorAll('.box-value').forEach(box => {
    box.textContent = '-';
    box.classList.add('empty');
  });
  document.getElementById('submitBtn').classList.add('hidden');
  setActiveBox(0);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', loadSheetData);
