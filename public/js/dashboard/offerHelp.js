import { HEADER } from '../helpers/authHeader';
import { DATA } from './loadData';
import { MODAL } from '../helpers/modal';
import { PREVIEW } from '../helpers/preview';
import { toast } from '../lib/toast';

// store areas selected
const AREAS = [];
let calendarDate = {
    start: undefined,
    from: undefined
}

window.onload = initialize;

function initialize() {

    // prepeare areas to select
    initializeAreas();

    // load calendar
    loadCalendar();

    // initialize textarea and chracter counter
    document.querySelector('textarea').addEventListener('keyup', characterCounter);

    // initialize preview
    document.querySelector('#offer-btn').addEventListener('click', validate);

}

function characterCounter(e) {

    const helper = document.querySelector('#character-count');
    helper.innerHTML = `Characters: ${e.target.value.length} / 200`;
}

function initializeAreas() {

    const areas =  Array.from(document.querySelector('#areas').querySelectorAll('.column'));
    areas.forEach(area => {
        area.addEventListener('click', () => {

            // add area
            AREAS.push(area.cloneNode(true));
            area.className = 'selected-area';
            fadeAreas();
            setSelectedArea(area);
            area.style.display = 'none';
        });
    });
}

function fadeAreas() {
    document.querySelector('#areas').className = 'columns animated fadeIn';
    setTimeout(() => {
        document.querySelector('#areas').className = 'columns';
    }, 600);
}

function setSelectedArea(area) {

    // add area

    // parent cont and status ele
    const selectedStatus = document.querySelector('#selected-status');
    const selectedCont = document.querySelector('#selected');

    // create selected area 
    const selected = document.createElement('h5');
    selected.innerHTML = area.querySelector('span').innerHTML;

    // add event to element
    selected.addEventListener('click', () => {

        fadeAreas();

        // display area
        area.className = `column ${selected.innerHTML.toLowerCase().split(' ').join('-')} animated fadeIn`;
        area.style.display = 'block';
        
        // remove selected element
        selected.remove();
        AREAS.splice(AREAS.indexOf(area), 1);
        selectedCont.className = 'column';

        // check if empty cont
        if (Array.from(selectedCont.querySelectorAll('h5')).length === 0) {
            selectedStatus.innerHTML = 'No Areas Selected';
        }
    });

    // append to parent
    selectedCont.appendChild(selected);

    // change status to selected
    selectedStatus.innerHTML = 'Areas Selected';

    // if all options selected, move cont upwards
    if (Array.from(selectedCont.querySelectorAll('h5')).length === 3) {
        selectedCont.className = 'all-selected';
    }
}

function loadCalendar() {

    // get todays date
    const today = new Date().toLocaleDateString();

    // initialize calendar into type date input
    const options = {
        displayMode: 'inline',
        labelFrom: 'Available From',
        labelTo: 'Available To',
        isRange: true,
        startDate: new Date(today),
        minDate: today
    };

    // attatch calendar to input
    const calendars = bulmaCalendar.attach('[type="date"]', options);
    calendars.forEach(calendar => {
        calendar.on('date:selected', date => {
            calendarDate = date;
        });
    });

}

function validate() {

    // check areas
    if (AREAS.length === 0) {
        document.querySelector('#areas').scrollIntoView(false);
        window.scrollBy(0, 200);
        toast('Please select atleast one area to help', false, 4000);
        return;
    }

    // check time
    if (!calendarDate.start || !calendarDate.end) {
        document.querySelector('#select-time').scrollIntoView();
        window.scrollBy(0, -50);
        toast('Please select the date(s) you are available to help', false, 4000);
        return;
    }

    // check bio
    const bio = document.querySelector('textarea');
    if (bio.value.length < 100 || bio.value.length > 200) {
        bio.scrollIntoView(false);
        window.scrollBy(0, 150);
        bio.focus();
        toast('Please write atleast description between 100 - 200 characters.', false, 4000);
        return;
    }

    openPreview();
}

let img;
let cover;
function openPreview() {

    PREVIEW.initAnimateCover(AREAS);

    // set preview cover image
    const data = JSON.parse(localStorage.getItem("user_data"));
    img = `url('data:image/png;base64,${data.avatar}')`;
    cover = document.querySelector('#preview-cover');
    
    cover.style.background = `
        linear-gradient(
        rgba(255, 255, 255, 0.3), 
        rgba(255, 255, 255, 1)),
        ${img}
    `; 
    cover.style.backgroundPosition = '0% 30%';
    cover.style.backgroundSize = 'cover';

    // set name
    DATA.setName(data, 'preview-name');

    // set time
    document.querySelector('#preview-date').innerHTML = 
    `<span>From</span>
    <br>
    ${calendarDate.start.toLocaleDateString()}
    <br>
    <span>To</span>
    <br>
    ${calendarDate.end.toLocaleDateString()}
     `;

     // set price
     let price = document.querySelector('input[type="number"]').value;
     if (price) {
        price = parseInt(price).toFixed(2);
     }

     else {
        price = 'FREE';
     }
     document.querySelector('#preview-amount').innerHTML = price;

    // set areas after resetting
    const areaCont = document.querySelector('#preview-areas');
    areaCont.innerHTML = '';
    AREAS.forEach(area => {
        area.style.display = 'block';
        area.className = `column preview-area ${area.querySelector('span').innerHTML.toLowerCase().split(' ').join('-')}`;
        areaCont.appendChild(area);
    });

    // set description
    document.querySelector('#preview-description').innerHTML = document.querySelector('textarea').value;

    MODAL.open('offer');

    // initialize confirm preview
    document.querySelector('#confirm-offer').addEventListener('click', confirmOffer);
}

function getAreas() {

    // instantiate area new area object
    const areas = {
        childcare: 0,
        eldercare: 0,
        animalcare: 0
    };

    // fill up area object
    for (let i = 0; i < AREAS.length; i++) {
        const areaCategory = AREAS[i].querySelector('span').innerHTML.split(' ').join('').toLowerCase();
        areas[areaCategory] = true;
    }

    // return area object
    return areas;
}

function formatDate(date) {
    date = date.toLocaleDateString().split('/').reverse();
    return `${date[0]}-${date[2]}-${date[1]}`;
}

async function confirmOffer() {

    // create offer data object
    const userData = await DATA.loadUserData();
    const offerData = {
        id: userData.user_id,
        ...getAreas(),
        start: formatDate(calendarDate.start),
        end: formatDate(calendarDate.end),
        description: document.querySelector('textarea').value,
        price: document.querySelector('input[type="number"]').value
    }

    console.log(offerData);

    // send POST request offer data endpoint
    const response = await fetch('/api/offerHelp/offerHelp.php', {
        method: 'POST',
        mode: 'same-origin',
        credentials: 'same-origin',
        headers: {
            ...HEADER(),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(offerData)
    });

    // get response data
    let data = await response.json();

    if (data.success) {
        window.location.replace('/dashboard/overview');
    }

    else {
        
        // display response message
        toast(data.message, data.success, 3000);
    }
}