const ALLOWED_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];
const DEFAULT_REGIONS = ['77', '99', '50', '90', '23', '93', '78', '98', '16', '116'];
const MAX_ATTEMPTS = 1000;

// Игровая экономика
let balance = 100;
const SPIN_COST = 10;

const usedPlates = new Set(); 
const inventory = []; 
const historyLog = []; 

let lastGeneratedPlate = null;

// Элементы DOM
const plate = document.getElementById('plate');
const plateMain = document.getElementById('plateMain');
const plateRegion = document.getElementById('plateRegion');
const spinButton = document.getElementById('spinButton');
const acceptButton = document.getElementById('acceptButton');
const counterText = document.getElementById('counterText');
const invCountText = document.getElementById('invCount');
const balanceText = document.getElementById('balanceText');
const customRegionInput = document.getElementById('customRegion');
const rarityBadge = document.getElementById('rarityBadge');

const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const inventoryGrid = document.getElementById('inventoryGrid');
const historyList = document.getElementById('historyList');

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

customRegionInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});

// Навигация
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        navButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');

        if (targetTab === 'tab-inventory') renderInventory();
        if (targetTab === 'tab-history') renderHistory();
    });
});

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
    // Проверка баланса перед круткой
    if (balance < SPIN_COST) {
        alert("Недостаточно денег для выбивания номера! Нужно 10$.");
        return;
    }

    // Снимаем деньги за прокрут
    balance -= SPIN_COST;
    balanceText.textContent = balance;

    spinButton.disabled = true;
    acceptButton.classList.add('hidden');
    rarityBadge.classList.add('hidden');
    plate.classList.add('shake');

    setTimeout(() => {
        plate.classList.remove('shake');
        spinButton.disabled = false;

        let fullPlateCode = '';
        let letter1, letter2, letter3, digits, selectedRegion;
        let attempts = 0;
        let type = 'common'; // тип редкости: common, mirror, triple
        let price = 2;       // базовая цена продажи

        const userRegion = customRegionInput.value.trim();
        
        do {
            letter1 = getRandomElement(ALLOWED_LETTERS);
            letter2 = getRandomElement(ALLOWED_LETTERS);
            letter3 = getRandomElement(ALLOWED_LETTERS);
            
            let luck = Math.random();
            if (luck > 0.85) {
                // Три одинаковые (например, 777)
                const singleDigit = Math.floor(Math.random() * 10);
                digits = `${singleDigit}${singleDigit}${singleDigit}`;
                type = 'triple';
                price = 50; // Стоит дорого
            } else if (luck > 0.70) {
                // Зеркалка (например, 101)
                const d1 = Math.floor(Math.random() * 9) + 1;
                const d2 = Math.floor(Math.random() * 10);
                digits = `${d1}${d2}${d1}`;
                type = 'mirror';
                price = 15; // Окупает прокрут
            } else {
                // Обычный номер
                digits = String(Math.floor(Math.random() * 900) + 100);
                type = 'common';
                price = 3;  // Дешевый дефолт
            }

            selectedRegion = userRegion !== '' ? userRegion : getRandomElement(DEFAULT_REGIONS);
            fullPlateCode = `${letter1}${digits}${letter2}${letter3}${selectedRegion}`;
            attempts++;

        } while (usedPlates.has(fullPlateCode) && attempts < MAX_ATTEMPTS);

        usedPlates.add(fullPlateCode);
        const mainText = `${letter1}${digits}${letter2}${letter3}`;
        
        // Уникальный ID для последующего удаления из инвентаря при продаже
        const id = Date.now() + Math.random().toString(36).substr(2, 5);

        lastGeneratedPlate = { id, main: mainText, region: selectedRegion, type, price };

        // Добавляем в историю
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        historyLog.unshift({ ...lastGeneratedPlate, time });
        if (historyLog.length > 20) historyLog.pop();

        // Отрисовка
        plateMain.textContent = mainText;
        plateRegion.textContent = selectedRegion;
        counterText.textContent = `Выбито уникальных номеров: ${usedPlates.size}`;

        // Настройка плашки редкости
        rarityBadge.className = 'rarity-badge';
        if (type === 'triple') {
            rarityBadge.textContent = `Легендарный (Цена: ${price}$)`;
            rarityBadge.classList.add('rare-triple');
        } else if (type === 'mirror') {
            rarityBadge.textContent = `Редкая зеркалка (Цена: ${price}$)`;
            rarityBadge.classList.add('rare-mirror');
        } else {
            rarityBadge.textContent = `Обычный (Цена: ${price}$)`;
            rarityBadge.classList.add('rare-common');
        }
        rarityBadge.classList.remove('hidden');

        acceptButton.classList.remove('hidden');

    }, 400);
}

// Забрать в инвентарь
function acceptPlate() {
    if (!lastGeneratedPlate) return;
    inventory.push(lastGeneratedPlate);
    invCountText.textContent = inventory.length;
    acceptButton.classList.add('hidden');
    lastGeneratedPlate = null;
}

// Продать номер из инвентаря
function sellPlate(id, price) {
    // Находим индекс нужного предмета по ID
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return;

    // Удаляем из инвентаря
    inventory.splice(index, 1);

    // Добавляем деньги на баланс
    balance += price;
    
    // Обновляем тексты
    balanceText.textContent = balance;
    invCountText.textContent = inventory.length;

    // Перерисовываем сетку инвентаря
    renderInventory();
}

// Отрисовка инвентаря с кнопками продажи
function renderInventory() {
    if (inventory.length === 0) {
        inventoryGrid.innerHTML = `<p class="empty-msg">В инвентаре пока пусто. Выбейте номер и заберите его!</p>`;
        return;
    }

    inventoryGrid.innerHTML = inventory.map(item => `
        <div class="inventory-item">
            ${createMiniPlateHTML(item.main, item.region)}
            <button class="sell-btn" onclick="sellPlate('${item.id}', ${item.price})">Продать за ${item.price}$</button>
        </div>
    `).join('');
}

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

spinButton.addEventListener('click', generatePlate);
acceptButton.addEventListener('click', acceptPlate);
