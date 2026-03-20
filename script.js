const firebaseConfig = {
    apiKey: "AIzaSyC0dGVelN-EGphekfBcQjLCMSjBH4OJwDw",
    authDomain: "milk-tracker-5e003.firebaseapp.com",
    databaseURL: "https://milk-tracker-5e003-default-rtdb.firebaseio.com",
    projectId: "milk-tracker-5e003",
    storageBucket: "milk-tracker-5e003.firebasestorage.app",
    messagingSenderId: "828518466706",
    appId: "1:828518466706:web:39d26bc788291556e8924b"
};

// Initialize Firebase (Compat)
let app, db;
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} catch (e) {
    console.error("Firebase Init Error:", e);
}

// Data store (synced with Firebase)
let mockData = {};

let currentDate = new Date();
let selectedDateString = null;

const welcomeScreen = document.getElementById('welcome-screen');
const mainApp = document.getElementById('main-app');
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');

    // Open today's modal automatically
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const day = new Date().getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setTimeout(() => {
        openInputModal(dateStr, day);
    }, 150);
});

const calendarEl = document.getElementById('calendar');
const monthLabel = document.getElementById('current-month-label');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');

// Modals
const overlay = document.getElementById('modal-overlay');
const inputModal = document.getElementById('input-modal');
const moodModal = document.getElementById('mood-modal');

const closeBtn = document.getElementById('close-modal');
const nextToMoodBtn = document.getElementById('next-to-mood-btn');
const moodBtns = document.querySelectorAll('.mood-btn');

function renderCalendar() {
    calendarEl.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthLabel.textContent = `${year}年 ${month + 1}月`;

    // Headers (Sun - Sat)
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    daysOfWeek.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        if (day === '六') header.classList.add('saturday');
        if (day === '日') header.classList.add('sunday');
        header.textContent = day;
        calendarEl.appendChild(header);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty slots before 1st day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        calendarEl.appendChild(emptyCell);
    }

    // Days
    const todayObj = new Date();
    const isCurrentMonth = (year === todayObj.getFullYear() && month === todayObj.getMonth());

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;

        // 今日の日付を強調
        if (isCurrentMonth && day === todayObj.getDate()) {
            cell.classList.add('today-marker');
        }

        // YYYY-MM-DD string
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Apply dummy data colors
        applyHeatColor(cell, dateStr);

        // 気分（mood）を反映
        applyMoodEmoji(cell, dateStr);

        cell.addEventListener('click', () => openInputModal(dateStr, day));
        calendarEl.appendChild(cell);
    }

    // カレンダーの高さが月によって変動するのを防ぐため、常に6行（42マス）になるよう空マスで埋める
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        calendarEl.appendChild(emptyCell);
    }
}

function applyHeatColor(cell, dateStr) {
    const data = mockData[dateStr];
    let total = 0;
    if (data) {
        total = (data.morning || 0) + (data.noon || 0) + (data.night || 0);
    }

    // Clean classes
    cell.classList.remove('heat-1', 'heat-2', 'heat-3');

    if (total > 0 && total <= 200) {
        cell.classList.add('heat-1');
    } else if (total > 200 && total <= 500) {
        cell.classList.add('heat-2');
    } else if (total > 500) {
        cell.classList.add('heat-3');
    }
}

function applyMoodEmoji(cell, dateStr) {
    const data = mockData[dateStr];
    if (data && data.mood) {
        const emojiMap = {
            'good': '😊',
            'neutral': '😐',
            'bad': '🤢'
        };
        const emojiEl = document.createElement('span');
        emojiEl.className = 'mood-indicator';
        emojiEl.textContent = emojiMap[data.mood] || '';
        cell.appendChild(emojiEl);
    }
}

// Modal flow
function openInputModal(dateStr, day) {
    selectedDateString = dateStr;
    document.getElementById('modal-date-label').textContent = `${currentDate.getMonth() + 1}月${day}日的紀錄`;

    // Prefill existing
    const data = mockData[dateStr] || { morning: '', noon: '', night: '' };
    document.getElementById('morning-amount').value = data.morning;
    document.getElementById('noon-amount').value = data.noon;
    document.getElementById('night-amount').value = data.night;

    overlay.classList.remove('hidden');
    inputModal.classList.remove('hidden');
    moodModal.classList.add('hidden');
}

function closeModal() {
    overlay.classList.add('hidden');
}

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
});

nextToMoodBtn.addEventListener('click', () => {
    // Save input internally
    const morning = parseInt(document.getElementById('morning-amount').value) || 0;
    const noon = parseInt(document.getElementById('noon-amount').value) || 0;
    const night = parseInt(document.getElementById('night-amount').value) || 0;

    const total = morning + noon + night;
    if (total <= 0) {
        alert('請輸入大於0mlの份量！🥛');
        return;
    }

    if (!mockData[selectedDateString]) {
        mockData[selectedDateString] = {};
    }
    mockData[selectedDateString].morning = morning;
    mockData[selectedDateString].noon = noon;
    mockData[selectedDateString].night = night;

    inputModal.classList.add('hidden');
    moodModal.classList.remove('hidden');
});

moodBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mood = e.currentTarget.dataset.mood;
        mockData[selectedDateString].mood = mood; 

        // --- Firebaseへ保存 ---
        if (db) {
            db.ref('records/' + selectedDateString).set(mockData[selectedDateString]);
        }

        // Update color on grid
        renderCalendar();

        // Auto close
        closeModal();
    });
});

// Navigation
prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// --- Secret Delete Feature (5 taps) ---
const illustration = document.getElementById('bottom-illustration');
const deleteModal = document.getElementById('delete-modal');
const closeDeleteBtn = document.getElementById('close-delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

let tapCount = 0;
let tapTimeout;

illustration.addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapTimeout);

    if (tapCount >= 5) {
        tapCount = 0;
        // 開いている他のモーダルを裏で隠して削除モーダルを開く
        overlay.classList.remove('hidden');
        inputModal.classList.add('hidden');
        moodModal.classList.add('hidden');
        deleteModal.classList.remove('hidden');
    } else {
        // 1秒以内に連続タップしない場合はカウントをリセット
        tapTimeout = setTimeout(() => {
            tapCount = 0;
        }, 1000);
    }
});

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    overlay.classList.add('hidden');
}

closeDeleteBtn.addEventListener('click', closeDeleteModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

confirmDeleteBtn.addEventListener('click', () => {
    // データを全削除 (Firebaseのルート要素ごと削除)
    mockData = {};
    if (db) {
        db.ref('records').set(null);
    }

    renderCalendar();
    closeDeleteModal();
    alert('所有紀錄資料已刪除。');
});

// --- Init (Load Data from Firebase) ---
if (db) {
    db.ref('records').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            mockData = snapshot.val();
        } else {
            mockData = {};
        }
        renderCalendar(); // データを取得した後に描画
    }).catch((error) => {
        console.error("Firebase Read Error:", error);
        renderCalendar(); // エラー時もとりあえず描画はする
    });
} else {
    renderCalendar();
}
