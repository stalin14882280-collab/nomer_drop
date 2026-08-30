// Строго 12 букв, разрешенных ГОСТом РФ для автомобильных номеров
const ALLOWED_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];
const DEFAULT_REGIONS = ['77', '99', '50', '90', '23', '93', '78', '98', '16', '116'];
const MAX_ATTEMPTS = 1000;

const usedPlates = new Set(); 

const plate = document.getElementById('plate');
const plateMain = document.getElementById('plateMain');
const plateRegion = document.getElementById('plateRegion');
const spinButton = document.getElementById('spinButton');
const counterText = document.getElementById('counterText');
const customRegionInput = document.getElementById('customRegion');

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

customRegionInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});

function generatePlate() {
    spinButton.disabled = true;
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

        plateMain.textContent = `${letter1}${digits}${letter2}${letter3}`;
        plateRegion.textContent = selectedRegion;
        counterText.textContent = `Выбито уникальных номеров: ${usedPlates.size}`;

    }, 400);
}

spinButton.addEventListener('click', generatePlate);
