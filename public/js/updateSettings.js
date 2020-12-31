import axios from 'axios';
import { showAlert } from './alert';

//Type is either 'data' or 'password'
export const updateSettings = async (data, type) => {
    
    try {
        const url = type  === 'password' ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:3000/api/v1/users/updateMe';
            //dari userController

        const res = await axios({
            method: 'PATCH',
            url,
            data
        });

        if(res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully`);
            // window.setTimeout(() => {
            //     location.assign('/me');
            // }, 1000)
        }

    } catch (err) {

        showAlert('error', err.response.data.message)
            //the err here is automatically built-in created in the try block when something goes wrong
            //the message property is the one that we are defining on the server whenever there is an error
    }
};

// export const updateSettings = async (name, email) => {
//     try {
//         const res = await axios({
//             method: 'PATCH',
//             url: 'http://127.0.0.1:3000/api/v1/users/updateMe',//dari userController
//             data: {
//                 name,
//                 email
//             }
//         });

//         if(res.data.status === 'success') {
//             showAlert('success', 'Data is successfully updated');
//             // window.setTimeout(() => {
//             //     location.assign('/me');
//             // }, 1000)
//         }

//     } catch (err) {

//         showAlert('error', err.response.data.message)
//             //the err here is automatically built-in created in the try block when something goes wrong
//             //the message property is the one that we are defining on the server whenever there is an error
//     }
// };