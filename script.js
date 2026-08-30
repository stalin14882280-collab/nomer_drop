const ALLOWED_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];
const DEFAULT_REGIONS = ['77', '99', '50', '90', '23', '93', '78', '98', '16', '116'];
const MAX_ATTEMPTS = 1000;

// Игровые базы данных в оперативной памяти
const usedPlates = new Set(); 
const inventory = []; // Список сохраненных объектов { main, region }
const historyLog = []; // Последние выпавшие номера

// Текущий сгенерированный, но еще не забранный номер
let lastGeneratedPlate = null;

// Элементы
const plate = document.getElementById('plate');
const plateMain = document.getElementById('plateMain');
const plateRegion = document.getElementById('plateRegion');
const spinButton = document.getElementById('spinButton');
const acceptButton = document.getElementById('acceptButton');
const counterText = document.getElementById('counterText');
const invCountText = document.getElementById('invCount');
const customRegionInput = document.getElementById('customRegion');

// Элементы вкладок
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const inventoryGrid = document.getElementById('inventoryGrid');
const historyList = document.getElementById('historyList');

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Запрет нецифрового ввода в инпут региона
customRegionInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});

// Навигация (переключение вкладок)
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        navButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');

        // Рендерим списки при переходе на вкладку
        if (targetTab === 'tab-inventory') renderInventory();
        if (targetTab === 'tab-history') renderHistory();
    });
});

// Функция создания разметки маленького гос номера (для списков)
function createMiniPlateHTML(main, region) {
    return `
        <div class="car-plate mini">
            <div class="plate-main">${main}</div>
            <div class="plate-region-box">
                <div class="region-number">${region}</div>
                <div class="rus-section">
                    <span class="rus-text">RUS</span>
                    <div class="flag"><div class="flag-red"></div></div>
                </div>
            </div>
        </div>
    `;
}

// Генерация номера
function generatePlate() {
    spinButton.disabled = true;
    acceptButton.classList.add('hidden'); // Прячем кнопку сохранения до конца прокрутки
    plate.classList.add('shake');

    setTimeout(() => {
        plate.classList.remove('shake');
        spinButton.disabled = false;

        let fullPlateCode = '';
        let letter1, letter2, letter3, digits, selectedRegion;
        let attempts = 0;

        const userRegion = customRegionInput.value.trim();
        
        do {
            letter1 = getRandomElement(ALLOWED_LETTERS);
            letter2 = getRandomElement(ALLOWED_LETTERS);
            letter3 = getRandomElement(ALLOWED_LETTERS);
            
            let luck = Math.random();
            if (luck > 0.85) {
                const singleDigit = Math.floor(Math.random() * 10);
                digits = `${singleDigit}${singleDigit}${singleDigit}`;
            } else if (luck > 0.70) {
                const d1 = Math.floor(Math.random() * 9) + 1;
                const d2 = Math.floor(Math.random() * 10);
                digits = `${d1}${d2}${d1}`;
            } else {
                digits = String(Math.floor(Math.random() * 900) + 100);
            }

            selectedRegion = userRegion !== '' ? userRegion : getRandomElement(DEFAULT_REGIONS);
            fullPlateCode = `${letter1}${digits}${letter2}${letter3}${selectedRegion}`;
            attempts++;

        } while (usedPlates.has(fullPlateCode) && attempts < MAX_ATTEMPTS);

        usedPlates.add(fullPlateCode);

        const mainText = `${letter1}${digits}${letter2}${letter3}`;
        
        // Запоминаем текущий дроп
        lastGeneratedPlate = { main: mainText, region: selectedRegion };

        // Добавляем в историю
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        historyLog.unshift({ ...lastGeneratedPlate, time });
        if (historyLog.length > 20) historyLog.pop(); // Храним только 20 последних

        // Отрисовка на главном экране
        plateMain.textContent = mainText;
        plateRegion.textContent = selectedRegion;
        counterText.textContent = `Выбито уникальных номеров: ${usedPlates.size}`;

        // Показываем кнопку «Забрать»
        acceptButton.classList.remove('hidden');

    }, 400);
}

// Добавление в инвентарь
function acceptPlate() {
    if (!lastGeneratedPlate) return;

    // Добавляем в инвентарь
    inventory.push(lastGeneratedPlate);
    
    // Обновляем счетчик инвентаря в навигации
    invCountText.textContent = inventory.length;

    // Скрываем кнопку, чтобы нельзя было забрать один номер дважды
    acceptButton.classList.add('hidden');
    lastGeneratedPlate = null;
}

// Отрисовка вкладки инвентаря
function renderInventory() {
    if (inventory.length === 0) {
        inventoryGrid.innerHTML = `<p class="empty-msg">В инвентаре пока пусто. Выбейте номер и заберите его!</p>`;
        return;
    }

    inventoryGrid.innerHTML = inventory.map(item => createMiniPlateHTML(item.main, item.region)).join('');
}

// Отрисовка вкладки истории
function renderHistory() {
    if (historyLog.length === 0) {
        historyList.innerHTML = `<p class="empty-msg">История пуста. Нажмите «Выбить номер».</p>`;
        return;
    }

    historyList.innerHTML = historyLog.map(item => `
        <div class="history-item">
            ${createMiniPlateHTML(item.main, item.region)}
            <span class="history-time">${item.time}</span>
        </div>
    `).join('');
}

// Слушатели событий
spinButton.addEventListener('click', generatePlate);
acceptButton.addEventListener('click', acceptPlate);
