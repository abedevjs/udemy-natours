import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe('pk_test_51I4DnQD2A9uBKNptzLZUt7nYMBaPyctGxrQQpjHDxFmgwsei2A4O8vGMUu0uHSV8FOWVeurFLuv5TCa1M1RupFdF00QEw1jnFl');

export const bookTour = async tourId => {

    try {
        //1. Get checkout session from API 
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);

        console.log(session);

        //2. Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
                //Remember how the session was inside of data 
                //so there was a data object created in there by axios
                //so that is then all response itself
        })

    } catch (err) {
        console.log(err);
        showAlert('error', err)
    }
    

};