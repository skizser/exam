let API_URL = 'http://exam-2020-1-api.std-900.ist.mospolytech.ru/api/';
let API_GET_TABLE = 'data1';
let ONPAGE_LIMIT = 10;
let PAGES_TO_IDS = new Map();
let TOTAL_COST = 0;
let GIFT = false;
let DOUBLE_TRIGGER = false;

//
window.onload = () => {
    let handleAdditionalPositionsToogle = () => {
        recountPrice();
        updateModalAdditionalPositions()
    };
    document.getElementById('gift-up').addEventListener('click', handleAdditionalPositionsToogle);
    document.getElementById('double-up').addEventListener('click', handleAdditionalPositionsToogle);

    getRestAll().then(rests => {
        let areas = new Set(['-']);
        let districts = new Set(['-']);
        let restTypes = new Set(['-']);

        for (let rest of rests) {
            areas.add(rest.admArea);
            districts.add(rest.district);
            restTypes.add(rest.typeObject);
        }


        let updateSelector = (value, selector) => {
            let newOption = document.createElement('option');
            newOption.value = value;
            newOption.text = value;
            selector.add(newOption);
        }

        let areaFilter = document.querySelector('select[name="area-filter"]');
        let districtFilter = document.querySelector('select[name="district-filter"]');
        let restFilter = document.querySelector('select[name="rest-type-filter"]');

        areas.forEach(value => updateSelector(value, areaFilter));
        districts.forEach(value => updateSelector(value, districtFilter));
        restTypes.forEach(value => updateSelector(value, restFilter));


        sortRests(rests);
        updatePages(rests);
        loadPage(1);
    })
}



function updatePages(rests) {
    let pageTotal = Math.ceil(rests.length / ONPAGE_LIMIT)
    PAGES_TO_IDS.clear()
    for (let page = 0; page < pageTotal; page++) {
        let start = page * ONPAGE_LIMIT;
        let pageRests = rests.slice(start, start + ONPAGE_LIMIT)
            .map(rest => rest.id);
        PAGES_TO_IDS.set(page + 1, pageRests);
    }
}

function loadPage(targetPage) {
    let paginationGroup = document.querySelector('ul.rest-pages');
    paginationGroup.innerHTML = ''

    let previousPage = document.createElement('li');
    previousPage.classList.add('page-item');
    let previousPageButton = document.createElement('button');
    previousPageButton.classList.add('page-link')
    previousPageButton.innerText = 'Предыдущая страница';
    let redrawForActiveWithStep = (step) => {
        let active = Array.from(paginationGroup.childNodes)
            .find(item => item.classList.contains('active'))
            .lastElementChild;
        loadPage(+active.innerHTML + step)
    }
    if (targetPage === 1) {
        previousPage.classList.add('disabled');
    } else {
        previousPage.addEventListener('click', () => redrawForActiveWithStep(-1));
    }
    previousPage.appendChild(previousPageButton);
    paginationGroup.appendChild(previousPage);


    if (PAGES_TO_IDS.size > 5) {

        let firstPage = createPageItem(1);
        paginationGroup.appendChild(firstPage);
        if (targetPage < 3) {
            let secondPage = createPageItem(2);
            paginationGroup.appendChild(secondPage)

            let thirdPage = createPageItem(3);
            paginationGroup.appendChild(thirdPage);

            let dotPage = createPageItem('...');
            dotPage.classList.add('disabled');
            paginationGroup.appendChild(dotPage);
        } else if (PAGES_TO_IDS.size - targetPage < 2) {
            let dotPage = createPageItem('...');
            dotPage.classList.add('disabled');
            paginationGroup.appendChild(dotPage);

            let penultimatePage1 = createPageItem(PAGES_TO_IDS.size - 2);
            paginationGroup.appendChild(penultimatePage1);

            let penultimatePage2 = createPageItem(PAGES_TO_IDS.size - 1);
            paginationGroup.appendChild(penultimatePage2);
        } else {
            let dotPage = createPageItem('...');
            dotPage.classList.add('disabled');
            paginationGroup.appendChild(dotPage);

            let previousPage = createPageItem(targetPage - 1);
            paginationGroup.appendChild(previousPage);

            let target = createPageItem(targetPage);
            paginationGroup.appendChild(target);

            let nextPage = createPageItem(targetPage + 1);
            paginationGroup.appendChild(nextPage);

            let dotPage2 = createPageItem('...');
            dotPage2.classList.add('disabled');
            paginationGroup.appendChild(dotPage2);
        }
        let lastPage = createPageItem(PAGES_TO_IDS.size);
        paginationGroup.appendChild(lastPage);
    } else if (PAGES_TO_IDS.size > 0) {
        PAGES_TO_IDS.forEach((ids, page) => {
            let currentPage = createPageItem(page);
            paginationGroup.appendChild(currentPage);
        });
    } else {
        let currentPage = createPageItem(1);
        paginationGroup.appendChild(currentPage);
    }

    let nextPage = document.createElement('li');
    nextPage.classList.add('page-item');
    let nextPageButton = document.createElement('button');
    nextPageButton.classList.add('page-link')
    nextPageButton.innerText = 'Следующая страница';
    if (targetPage === PAGES_TO_IDS.size) {
        nextPage.classList.add('disabled');
    } else {
        nextPageButton.addEventListener('click', () => redrawForActiveWithStep(1));
    }
    nextPage.appendChild(nextPageButton);
    paginationGroup.appendChild(nextPage);

    Array.from(paginationGroup.childNodes)
        .find(item => +item.lastElementChild.innerText === targetPage)
        .classList
        .add('active')

    getRest(PAGES_TO_IDS.get(targetPage))
        .then(rests => {
                 sortRests(rests);
                redrawTable(rests)
            }
        );
}

function createPageItem(pageNum) {
    let pageNode = document.createElement('li');
    pageNode.classList.add('page-item');
    let button = document.createElement('button');
    button.classList.add('page-link')
    button.innerText = pageNum;

    button.addEventListener("click", () => loadPage(pageNum));

    pageNode.appendChild(button);
    return pageNode;
}

async function getRest(ids) {
    let rests = []
    if (!ids || ids.length < 1) {
        return []
    }
    for (let id of ids) {
        let response = await fetch(API_URL + API_GET_TABLE + `/${id}`);
        rests.push(await response.json());
    }
    return rests;
}

async function getRestAll() {
    let response = await fetch(API_URL + API_GET_TABLE)
    return await response.json();
}

function redrawTable(rests) {
    let currentData = document.querySelector('tbody.rests-list');
    currentData.innerHTML = '';

    rests.forEach((rest, i) => {
            if (i < ONPAGE_LIMIT) {
                let nameColumn = document.createElement('td');
                nameColumn.innerText = rest.name;

                let typeColumn = document.createElement('td');
                typeColumn.innerText = rest.typeObject;

                let areaColumn = document.createElement('td');
                areaColumn.innerText = rest.admArea;

                let districtColumn = document.createElement('td');
                districtColumn.innerText = rest.district;

                let addressColumn = document.createElement('td');
                addressColumn.innerText = rest.address;

                let rateColumn = document.createElement('td');
                rateColumn.innerText = rest.rate;

                let actionButton = document.createElement('button');
                actionButton.classList.add('btn');
                actionButton.classList.add('btn-primary');
                actionButton.addEventListener('click', () => btnRestSelect(rest))
                actionButton.innerText = 'Выбрать';
                let actionButtonColumn = document.createElement('td');
                actionButtonColumn.appendChild(actionButton)

                let newRow = document.createElement('tr');
                newRow.appendChild(nameColumn);
                newRow.appendChild(typeColumn);
                newRow.appendChild(areaColumn);
                newRow.appendChild(districtColumn);
                newRow.appendChild(addressColumn);
                newRow.appendChild(rateColumn);
                newRow.appendChild(actionButtonColumn);

                currentData.appendChild(newRow);
            }
        }
    )
}

async function getFindRest() {
    let areaFilterValue = document.querySelector('select[name="area-filter"]').value;
    let districtFilterValue = document.querySelector('select[name="district-filter"]').value;
    let restFilterValue = document.querySelector('select[name="rest-type-filter"]').value;

    let filteredRests = (await getRestAll()).filter(rest =>
        (rest.admArea === areaFilterValue || areaFilterValue === '-') &&
        (rest.district === districtFilterValue || districtFilterValue === '-') &&
        (rest.typeObject === restFilterValue || restFilterValue === '-'));

    sortRests(filteredRests);
    updatePages(filteredRests);
    loadPage(1);
}

function  sortRests(rests) {
    rests.sort((first, second) => {
        if (first.rate < second.rate) {
            return 1;
        } else if (first.rate > second.rate) {
            return -1;
        } else {
            return 0;
        }
    })
}

function btnRestSelect(rest) {
    let menu = document.querySelector('div.menu-list');
    let currentAmounts = document.querySelectorAll('input[class*=set]')
    let setToAmount = new Map()
    for (let i = 0; i < currentAmounts.length; i++) {
        setToAmount.set(`set_${i + 1}`, currentAmounts[i].value);
    }
    menu.innerHTML = '';
    fetch("http://webdev-exam-2020-1-lg83f.std-1229.ist.mospolytech.ru/sets.json")
        .then(response => response.json())
        .then(sets => sets.forEach(set => {
            let menuItem = createMenuItem(set.id, set.img, set.name, set.description, set.price, setToAmount.get(set.id))
                menu.appendChild(menuItem);
        }))

    let restNameNode = document.createElement('span');
    restNameNode.innerText = rest.name
    let restNameContainer = document.querySelector('div.order-rest-name');
    restNameContainer.innerHTML = '';
    restNameContainer.appendChild(restNameNode);
    
    let restAreaNode = document.createElement('span');
    restAreaNode.innerText = rest.admArea
    let restAreaContainer = document.querySelector('div.order-rest-area');
    restAreaContainer.innerHTML = '';
    restAreaContainer.appendChild(restAreaNode);

    let restDistrictNode = document.createElement('span');
    restDistrictNode.innerText = rest.district
    let restDistrictContainer = document.querySelector('div.order-rest-district');
    restDistrictContainer.innerHTML = '';
    restDistrictContainer.appendChild(restDistrictNode);

    let restAddressNode = document.createElement('span');
    restAddressNode.innerText = rest.address
    let restAddressContainer = document.querySelector('div.order-rest-address');
    restAddressContainer.innerHTML = '';
    restAddressContainer.appendChild(restAddressNode);

    let restRateNode = document.createElement('span');
    restRateNode.innerText = rest.rate
    let restRateContainer = document.querySelector('div.order-rest-rate');
    restRateContainer.innerHTML = '';
    restRateContainer.appendChild(restRateNode);
}

function createMenuItem(id, source, name, description, price, amount = 0) {
    let menuItem = document.createElement('div');
    menuItem.className = 'col-3 border border-warning m-2';

    let imageContainer = document.createElement('div');
    imageContainer.className = 'row';
    let itemImage = document.createElement('img');
    itemImage.className = 'img-fluid';
    itemImage.src = source;
    imageContainer.appendChild(itemImage);
    menuItem.appendChild(imageContainer);

    let nameContainer = document.createElement('div');
    nameContainer.className = 'row justify-content-md-center mt-2';
    let itemName = document.createElement('h4');
    itemName.innerText = name;
    nameContainer.appendChild(itemName);
    menuItem.appendChild(nameContainer);

    let descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'row justify-content-md-center';
    let itemDescription = document.createElement('span');
    itemDescription.innerText = description;
    descriptionContainer.appendChild(itemDescription);
    menuItem.appendChild(descriptionContainer);

    let priceContainer = document.createElement('div');
    priceContainer.className = `row justify-content-md-center mt-2 ${id}-price`;
    let itemPrice = document.createElement('h4');
    itemPrice.innerText = `${price}р.`;
    priceContainer.appendChild(itemPrice);
    menuItem.appendChild(priceContainer);

    let controlPanelContainer = document.createElement('div');
    controlPanelContainer.className = 'row justify-content-md-center mt-2 mb-2 amount-panel';
    let itemAmount = document.createElement('input');
    itemAmount.className = `form-control w-50 text-center ${id}-amount`;
    itemAmount.type = 'number';
    itemAmount.readOnly = true;
    itemAmount.min = 0;
    itemAmount.value = amount;

    let changeAmount = (value) => {
        let currentAmount = document.querySelector(`input.${id}-amount`);
        currentAmount.value = +currentAmount.value + value
        if (currentAmount.value == 0) {
            document.querySelector(`button.${id}-decrease-button`).disabled = true;
        } else {
            document.querySelector(`button.${id}-decrease-button`).disabled = false;
        }
        recountPrice();
        redrawModalPositions();
    }

    let decreaseButton = document.createElement('button');
    decreaseButton.className = `btn btn-primary ml-1 mr-1 ${id}-decrease-button`;
    decreaseButton.innerText = '-';
    decreaseButton.disabled = (amount == 0);
    decreaseButton.addEventListener('click', () => changeAmount(-1));

    let increaseButton = document.createElement('button');
    increaseButton.className = 'btn btn-primary ml-1 mr-1';
    increaseButton.innerText = '+';
    increaseButton.addEventListener('click', () => changeAmount(1));

    
    checkoutBtn = document.querySelector('button.place-an-order');
    checkoutBtn.addEventListener('click', () => recountPrice());


    controlPanelContainer.appendChild(decreaseButton);
    controlPanelContainer.appendChild(itemAmount);
    controlPanelContainer.appendChild(increaseButton);
    menuItem.appendChild(controlPanelContainer);
    return menuItem;
}

function recountPrice() {
    let menuItems = document.querySelector('div.menu-list').children;
    
    TOTAL_COST = 0;
    for (let menuItem of menuItems) {
        let priceText = menuItem.children[3].lastElementChild.innerText;
        let amountValue = menuItem.children[4].children[1].value;
        if (+amountValue > 0) {
            TOTAL_COST += parseInt(priceText) * amountValue
        }
    }
    if (document.querySelector('input.double-up').checked) {
        TOTAL_COST = Math.round(TOTAL_COST * 1.6);
    }
    
    if (TOTAL_COST === 0) {
        document.querySelector('div.total-cost').lastElementChild.innerText = `Сумма заказа не может быть равна ${TOTAL_COST} руб.
        Что бы совершить заказ, добавьте товары в корзину.`;
        document.getElementById('gift-up').disabled = true;
        document.getElementById('double-up').disabled = true;
        document.querySelectorAll('input[type="checkbox"]').checked = true;
    } else {
        document.getElementById('gift-up').disabled = false;
        document.getElementById('double-up').disabled = false;
        document.querySelector('button.place-an-order').setAttribute("data-target", "#orderModal");
        document.querySelector('div.total-cost').lastElementChild.innerText = `Итого ${TOTAL_COST} руб.`;
        document.querySelector('div.order-total').lastElementChild.innerText = `${TOTAL_COST} руб.`;
    }
}

function redrawModalPositions() {
    let orderContainer = document.querySelector('div.order-positions');
    orderContainer.innerHTML = '';

    let menuItems = document.querySelector('div.menu-list').children;

    for (let menuItem of menuItems) {
        let amountValue = menuItem.children[4].children[1].value;
        if (amountValue == 0) {
            continue;
        }
        
        orderContainer.appendChild(redrawModalPositionBox(menuItem, amountValue));
    }
}


function updateModalAdditionalPositions() {
    let additionPositionsContainer = document.querySelector('div.order-additional-positions');
    let giftChecked = document.getElementById('gift-up').checked;
    let doubleUpChecked = document.getElementById('double-up').checked;
    additionPositionsContainer.innerHTML = '';
    if (giftChecked || doubleUpChecked) {
        let header = document.createElement('h2');
        header.innerText = 'Дополнительные опции:';
        additionPositionsContainer.appendChild(header);
    }
    if (giftChecked) {
        let randomElement = getRandomElement(document.querySelector('div.menu-list').children);
        let randomElementImg = randomElement.children[0].lastElementChild.src
        let randomElementName = randomElement.children[1].lastElementChild.innerText
        let orderContainer = document.querySelector('div.order-positions');
        let modalItems = orderContainer.children;
        let counter = 0;
        for (modalItem of modalItems) {
            let quantity = modalItem.children[2].children[0].innerText;
            modalItemImg = modalItem.children[0].children[0].src;
            counter += 1;
            if (modalItem.children[0].children[0].src == randomElementImg && quantity > 0) {
                quantity = `${parseInt(quantity) + 1}`;
                break;
            }else if (counter == modalItems.length) {
                orderContainer.appendChild(redrawModalPositionBox(randomElement));
            }
        }
        additionPositionsContainer.appendChild(addModalAdditionRows('Выбран подарок', randomElementName));
    }
    if (doubleUpChecked) {
        let modalItems = document.querySelector('div.order-positions').children;
        for (modalItem of modalItems) {
            let quantity = modalItem.children[2].children[0];
            let itemCost = modalItem.children[3].children[0];
            quantity.innerText = `${parseInt(quantity.innerText) * 2}`;
            itemCost.innerText = `${Math.round(parseInt(itemCost.innerText) * 2)}р.`;
        }
        additionPositionsContainer.appendChild(addModalAdditionRows('Заказ удвоен, скидка:', `${Math.round(parseInt(TOTAL_COST) / 160 * 40)}р.`));
    }
}

function redrawModalPositionBox(menuItem, amountValue = 1) {
    let imgSource = menuItem.children[0].lastElementChild.src;
    let name = menuItem.children[1].lastElementChild.innerText;
    let priceText = menuItem.children[3].lastElementChild.innerText;

    let itemRow = document.createElement('div');
    itemRow.className = 'row border border-dark mt-2 align-items-center';

    let imgColumn = document.createElement('div');
    imgColumn.className = 'col-2';
    let imgNode = document.createElement('img');
    imgNode.src = imgSource
    imgNode.className = 'img-thumbnail';
    imgColumn.appendChild(imgNode);
    itemRow.appendChild(imgColumn);

    let nameColumn = document.createElement('div');
    nameColumn.className = 'col-3';

    let nameNode = document.createElement('span');
    nameNode.innerText = name;
    nameColumn.appendChild(nameNode);
    itemRow.appendChild(nameColumn);

    let sumDetailsColumn = document.createElement('div');
    sumDetailsColumn.className = 'col-5 text-center';

    let sumDetailsQuantity = document.createElement('span');
    sumDetailsQuantity.innerText = `${amountValue}`;
    sumDetailsColumn.appendChild(sumDetailsQuantity);
    itemRow.appendChild(sumDetailsColumn);

    let sumDetailsInfo = document.createElement('span');
    sumDetailsInfo.innerText = `*${priceText}`;
    sumDetailsColumn.appendChild(sumDetailsInfo);
    itemRow.appendChild(sumDetailsColumn);

    let itemSumColumn = document.createElement('div');
    itemSumColumn.className = 'col-2'; 
    let itemSumInfo = document.createElement('span');
    itemSumInfo.innerText = `${amountValue * parseInt(priceText)}р.`;
    itemSumColumn.appendChild(itemSumInfo);
    itemRow.appendChild(itemSumColumn);

    return itemRow
}

function getRandomElement(arr) {
    let randIndex = Math.floor(Math.random() * arr.length);
    return arr[randIndex];
}

function addModalAdditionRows(text, amountText) {
    let addRow = document.createElement('div');
    addRow.className = 'row';
    let addTextNode = document.createElement('div');
    addTextNode.className = 'col-6';
    let addText = document.createElement('span');
    addText.innerText = `${text}`;
    addTextNode.appendChild(addText);
    addRow.appendChild(addTextNode);
    let addAmountNode = document.createElement('div');
    addAmountNode.className = 'col-6';
    let addAmount = document.createElement('span');
    addAmount.innerText = `${amountText}`;
    addAmountNode.appendChild(addAmount);
    addRow.appendChild(addAmountNode);
    return addRow;
}