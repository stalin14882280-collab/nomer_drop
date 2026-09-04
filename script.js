const ALLOWED_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];
const DEFAULT_REGIONS = ['77', '99', '50', '90', '23', '93', '78', '98', '16', '116'];
const MAX_ATTEMPTS = 1000;

let balance = 100;
let currentSpinCost = 10;
let rating = 10;
let commonSoldCount = 0; 

const usedPlates = new Set(); 
const inventory = []; 
const historyLog = []; 

let lastGeneratedPlate = null;

const plate = document.getElementById('plate');
const plateMain = document.getElementById('plateMain');
const plateRegion = document.getElementById('plateRegion');
const acceptButton = document.getElementById('acceptButton');
const counterText = document.getElementById('counterText');
const invCountText = document.getElementById('invCount');
const balanceText = document.getElementById('balanceText');
const rarityBadge = document.getElementById('rarityBadge');

const ratingText = document.getElementById('ratingText');
const spamCountText = document.getElementById('spamCountText');
const spamLine = document.getElementById('spamLine');
const navDropBtn = document.getElementById('navDropBtn');

// Элементы ввода фильтров
const filterL1 = document.getElementById('filterL1');
const filterDigits = document.getElementById('filterDigits');
const filterL23 = document.getElementById('filterL23');
const customRegionInput = document.getElementById('customRegion');

const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const inventoryGrid = document.getElementById('inventoryGrid');
const historyList = document.getElementById('historyList');

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function validateLettersInput(inputElement) {
    inputElement.value = inputElement.value.toUpperCase();
    let cleanValue = "";
    for (let char of inputElement.value) {
        if (ALLOWED_LETTERS.includes(char)) {
            cleanValue += char;
        }
    }
    inputElement.value = cleanValue;
}

filterL1.addEventListener('input', (e) => validateLettersInput(e.target));
filterL23.addEventListener('input', (e) => validateLettersInput(e.target));
filterDigits.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
customRegionInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });

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
// Главная функция генерации (mode: 'letters' или 'digits')
function generatePlate(mode) {
    if (balance < currentSpinCost) {
        alert(`Недостаточно денег! Нужно ${currentSpinCost}$.`);
        return;
    }

    balance -= currentSpinCost;
    balanceText.textContent = balance;

    // Блокируем кнопки во время анимации
    document.getElementById('spinLettersBtn').disabled = true;
    document.getElementById('spinDigitsBtn').disabled = true;
    acceptButton.classList.add('hidden');
    rarityBadge.classList.add('hidden');
    plate.classList.add('shake');

    setTimeout(() => {
        plate.classList.remove('shake');
        document.getElementById('spinLettersBtn').disabled = false;
        document.getElementById('spinDigitsBtn').disabled = false;

        let fullPlateCode = '';
        let letter1, letter2, letter3, digits, selectedRegion;
        let attempts = 0;
        let type = 'common'; 
        let price = 3;       

        const userL1 = filterL1.value.trim();
        const userDigits = filterDigits.value.trim();
        const userL23 = filterL23.value.trim();
        const userRegion = customRegionInput.value.trim();
        
        do {
            // ЛОГИКА ДЛЯ РЕЖИМА "КРУТИТЬ БУКВЫ"
            if (mode === 'letters') {
                letter1 = getRandomElement(ALLOWED_LETTERS);
                letter2 = getRandomElement(ALLOWED_LETTERS);
                letter3 = getRandomElement(ALLOWED_LETTERS);
                // Цифры фиксируем из инпута (если пусто — ставим 000)
                digits = userDigits !== '' ? userDigits.padStart(3, '0') : '000';
            } 
            // ЛОГИКА ДЛЯ РЕЖИМА "КРУТИТЬ ЦИФРЫ"
            else if (mode === 'digits') {
                // Буквы фиксируем из инпута (если пусто — ставим дефолт 'А' и 'АА')
                letter1 = userL1 !== '' ? userL1 : 'А';
                letter2 = userL23.length >= 1 ? userL23[0] : 'А';
                letter3 = userL23.length === 2 ? userL23[1] : 'А';
                
                // Цифры крутим рандомно со старой проверкой на редкость
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
            }

            // Автоопределение типа и цены получившихся цифр для оценки стоимости продажи
            if (digits[0] === digits[1] && digits[1] === digits[2]) {
                type = 'triple';
                price = 50;
            } else if (digits[0] === digits[2]) {
                type = 'mirror';
                price = 15;
            } else {
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

function sellPlate(id, price, type) {
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return;

    inventory.splice(index, 1);
    balance += price;
    
    if (type === 'common') {
        commonSoldCount++;
        if (commonSoldCount > 10 && rating === 10) {
            rating = 9;
            currentSpinCost = 15;
            ratingText.textContent = rating;
            spamLine.classList.add('danger');
            
            // Обновляем текст цен на кнопках
            document.getElementById('spinLettersBtn').textContent = `Купить буквы (${currentSpinCost}$)`;
            document.getElementById('spinDigitsBtn').textContent = `Купить цифры (${currentSpinCost}$)`;
            navDropBtn.textContent = `Кейс (${currentSpinCost}$)`;
            alert("⚠️ Внимание! Вы продали слишком много обычных номеров. Ваш авторитет упал, цена прокрутов теперь 15$!");
        }
        spamCountText.textContent = commonSoldCount;
    }

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
            <button class="sell-btn" onclick="sellPlate('${item.id}', ${item.price}, '${item.type}')">Продать за ${item.price}$</button>
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

// Привязываем кнопки к новым режимам
document.getElementById('spinLettersBtn').addEventListener('click', () => generatePlate('letters'));
document.getElementById('spinDigitsBtn').addEventListener('click', () => generatePlate('digits'));
document.getElementById('acceptButton').addEventListener('click', acceptPlate);

// Стартовая инициализация текста цен на кнопках
document.getElementById('spinLettersBtn').textContent = `Купить буквы (${currentSpinCost}$)`;
document.getElementById('spinDigitsBtn').textContent = `Купить цифры (${currentSpinCost}$)`;
