//This file here is our entry point
//This file here is more to really get data from User Interface and then delegate the action
console.log('Hello from Parcel. Dari public/js/index.js');
import '@babel/polyfill';//Polyfill will make some of the newer js features works in older browser
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//DOM element

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

if(mapBox) {//if in the page there is an id called map...

    const locations = JSON.parse(mapBox.dataset.locations);
    //dataset adalah cara utk mengambil data dari backend menggunakan java sript
    //connect dgn file tour.pug > #map(data-locations=`${JSON.stringify(tour.locations)}`)
    //di json parse yaitu convert ke json file, krn wkt di tempel di tour.pug dia di convert ke string

    displayMap(locations);
}

if(loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();//this prevents from loading any other page
    
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
    
        login(email, password);
    });
}

if(logOutBtn) logOutBtn.addEventListener('click', logout);
// document.querySelector('.nav__el--logout').addEventListener('click', e => {
//     console.log('ccccc');
// })

if(userDataForm) userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSettings({name, email}, 'data');

    const form = new FormData();//ini built-in multipart form data dari js karena kita mau upload image
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
        //files is an array, so bcoz we only upload one photo, .files[0]

    updateSettings(form, 'data');
});

if(userPasswordForm) userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';
    
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
});

if(bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';//Ingat, e.target menunjukkan element yg di klik

        const { tourId } = e.target.dataset;// const tourId = e.target.dataset.tourId
        
        bookTour(tourId);
    })