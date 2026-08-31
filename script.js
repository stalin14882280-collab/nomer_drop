const ALLOWED_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];
const DEFAULT_REGIONS = ['77', '99', '50', '90', '23', '93', '78', '98', '16', '116'];
const MAX_ATTEMPTS = 1000;

let balance = 100;
const SPIN_COST = 10;

const usedPlates = new Set(); 
const inventory = []; 
const historyLog = []; 

let lastGeneratedPlate = null;

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

function generatePlate() {
    if (balance < SPIN_COST) {
        alert("Недостаточно денег для выбивания номера! Нужно 10$.");
        return;
    }

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
        let type = 'common'; 
        let price = 2;       

        const userRegion = customRegionInput.value.trim();
        
        do {
            letter1 = getRandomElement(ALLOWED_LETTERS);
            letter2 = getRandomElement(ALLOWED_LETTERS);
            letter3 = getRandomElement(ALLOWED_LETTERS);
            
            let luck = Math.random();
            if (luck > 0.85) {
                const singleDigit = Math.floor(Math.random() * 10);
                digits = `${singleDigit}${singleDigit}${singleDigit}`;
                type = 'triple';
                price = 50; 
            } else if (luck > 0.70) {
                const d1 = Math.floor(Math.random() * 9) + 1;
                const d2 = Math.floor(Math.random() * 10);
                digits = `${d1}${d2}${d1}`;
                type = 'mirror';
                price = 15; 
            } else {
                digits = String(Math.floor(Math.random() * 900) + 100);
                type = 'common';
                price = 3;  
            }

            selectedRegion = userRegion !== '' ? userRegion : getRandomElement(DEFAULT_REGIONS);
            fullPlateCode = `${letter1}${digits}${letter2}${letter3}${selectedRegion}`;
            attempts++;

        } while (usedPlates.has(fullPlateCode) && attempts < MAX_ATTEMPTS);

        usedPlates.add(fullPlateCode);
        const mainText = `${letter1}${digits}${letter2}${letter3}`;
        const id = Date.now() + Math.random().toString(36).substr(2, 5);

        lastGeneratedPlate = { id, main: mainText, region: selectedRegion, type, price };

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        historyLog.unshift({ ...lastGeneratedPlate, time });
        if (historyLog.length > 20) historyLog.pop();

        plateMain.textContent = mainText;
        plateRegion.textContent = selectedRegion;
        counterText.textContent = `Выбито уникальных номеров: ${usedPlates.size}`;

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

function acceptPlate() {
    if (!lastGeneratedPlate) return;
    inventory.push(lastGeneratedPlate);
    invCountText.textContent = inventory.length;
    acceptButton.classList.add('hidden');
    lastGeneratedPlate = null;
}

function sellPlate(id, price) {
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return;

    inventory.splice(index, 1);
    balance += price;
    
    balanceText.textContent = balance;
    invCountText.textContent = inventory.length;

    renderInventory();
}

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
