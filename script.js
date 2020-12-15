let API_URL = 'http://exam-2020-1-api.std-900.ist.mospolytech.ru/api/';
let API_GET_TABLE = 'data1';
let ONPAGE_LIMIT = 10
let PAGES_TO_IDS = new Map();


window.onload = () => {
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
                actionButton.classList.add('btn-light');
                //Обработать кнопку
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