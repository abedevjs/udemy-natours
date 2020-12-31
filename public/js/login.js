import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
    
    try {
        // console.log(email, password);//Ini diaktifkan waktu production
        const res = await axios({//Send a data using http request using axios
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',//dari userController
            data: {
                email,
                password
            }
        });
        //console.log(res.data);
        if(res.data.status === 'success') {//this is the data of our JSON response from controllers
            showAlert('success', 'Logged in successfully');//tp harus di klik dulu baru reload sendiri :(
            window.setTimeout(() => {//this is how we tell browser to reload the page automatically
                location.assign('/')//the page reloaded automatically and will be sent to this route
            }, 1500)//after 1500 miliseconds or 1.5 seconds
        }

    } catch(err) {
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {

    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout'
        });

        if((res.data.status = 'success')) location.reload(true); //it will force the page browser to reload
            //from the server and not from browser cache

    } catch (err) {
        showAlert('error', 'Logout failed. Please try again');
    }
};