import fetch from 'node-fetch';
import { config } from '../config/config.js';
import PatientRecord from '../models/PatientRecord.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Default coordinates (fallback)
let coordinates = {
    latitude: 20.3488963,
    longitude: 85.8157988
};

let radius = 4 * 1000;

// Add new controller for updating coordinates
export const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        coordinates = { latitude, longitude };
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ success: false });
    }
};

export const getHomepage = async (req, res) => {
    try {
        const requestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.latitude},${coordinates.longitude}&radius=${radius}&key=${config.googleApiKey}&type=hospital`;

        const response = await fetch(requestUrl);
        const nearbyHospitals = await response.json();

        if (!nearbyHospitals.results || nearbyHospitals.results.length === 0) {
            throw new Error('No hospitals found');
        }

        const places = await Promise.all(
            nearbyHospitals.results.map(async (hospital) => {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hospital.place_id}&key=${config.googleApiKey}`;
                const detailsRes = await fetch(detailsUrl);
                const details = await detailsRes.json();
                const contactInfo = details.result.formatted_phone_number || 'Contact information not available';
                const photoReference = details.result.photos && details.result.photos[0].photo_reference;
                const imageUrl = photoReference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${config.googleApiKey}` : '/path/to/placeholder-image.jpg';

                return {
                    placeName: hospital.name,
                    contactInfo: contactInfo,
                    imageUrl: imageUrl,
                };
            })
        );

        res.render('Homepage', { places });
    } catch (error) {
        console.error('Error fetching place details:', error.message);
        res.status(500).send({
            status: 'error',
            message: 'Error fetching place details',
        });
    }
};

// Update other controller methods to use coordinates object
export const getNearbyHospitals = async (req, res) => {
    try {
        const requestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.latitude},${coordinates.longitude}&radius=${radius}&key=${config.googleApiKey}&type=hospital`;

        const response = await fetch(requestUrl);
        const nearbyHospitals = await response.json();

        if (!nearbyHospitals.results || nearbyHospitals.results.length === 0) {
            throw new Error('No hospitals found');
        }

        const places = await Promise.all(
            nearbyHospitals.results.map(async (hospital) => {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hospital.place_id}&key=${config.googleApiKey}`;
                const detailsRes = await fetch(detailsUrl);
                const details = await detailsRes.json();
                const contactInfo = details.result.formatted_phone_number || 'Contact information not available';
                const photoReference = details.result.photos && details.result.photos[0].photo_reference;
                const imageUrl = photoReference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${config.googleApiKey}` : '/path/to/placeholder-image.jpg';

                return {
                    placeName: hospital.name,
                    contactInfo: contactInfo,
                    imageUrl: imageUrl,
                };
            })
        );

        res.render('nearbyHospitals', { places });
    } catch (error) {
        console.error('Error fetching hospital details:', error.message);
        res.status(500).send({
            status: 'error',
            message: 'Error fetching hospital details',
        });
    }
};

export const getNearbyPharmacy = async (req, res) => {
    try {
        const requestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.latitude},${coordinates.longitude}&radius=${radius}&key=${config.googleApiKey}&type=pharmacy`;

        const response = await fetch(requestUrl);
        const nearbyPharmacies = await response.json();

        if (!nearbyPharmacies.results || nearbyPharmacies.results.length === 0) {
            throw new Error('No pharmacies found');
        }

        const places = await Promise.all(
            nearbyPharmacies.results.map(async (pharmacy) => {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pharmacy.place_id}&key=${config.googleApiKey}`;
                const detailsRes = await fetch(detailsUrl);
                const details = await detailsRes.json();
                const contactInfo = details.result.formatted_phone_number || 'Contact information not available';
                const photoReference = details.result.photos && details.result.photos[0].photo_reference;
                const imageUrl = photoReference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${config.googleApiKey}` : '/path/to/placeholder-image.jpg';

                return {
                    placeName: pharmacy.name,
                    contactInfo: contactInfo,
                    imageUrl: imageUrl,
                };
            })
        );

        res.render('nearbyPharmacy', { places });
    } catch (error) {
        console.error('Error fetching pharmacy details:', error.message);
        res.status(500).send({
            status: 'error',
            message: 'Error fetching pharmacy details',
        });
    }
};

export const getMedConnect = (req, res) => {
    res.render('medConnect');
};

export const getPatientInfo = async (req, res) => {
    try {
        const records = await PatientRecord.find().sort({ createdAt: -1 });
        res.render('patientInfo', { records });
    } catch (error) {
        res.status(500).send('Error fetching records');
    }
};

export const savePatientInfo = async (req, res) => {
    try {
        console.log('Received form data:', req.body); // Debug log

        const newRecord = new PatientRecord({
            patientName: req.body.patientName,
            dateOfBirth: new Date(req.body.dob),
            medicalHistory: req.body.medicalHistory,
            medications: req.body.medications ? req.body.medications.split(',') : []
        });

        console.log('Created new record:', newRecord); // Debug log

        const savedRecord = await newRecord.save();
        console.log('Saved record:', savedRecord); // Debug log

        res.status(200).json({
            status: 'success',
            data: savedRecord
        });
    } catch (error) {
        console.error('Error saving patient record:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Add these new controller functions
export const getPaymentPage = (req, res) => {
    res.render('payment', {
        stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
};

export const createCheckoutSession = async (req, res) => {
    try {
        const { name, email, date, time } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Medical Consultation',
                            description: `Appointment on ${date} at ${time}`,
                        },
                        unit_amount: 5000, // $50.00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/payment`,
            customer_email: email,
            metadata: {
                name,
                appointmentDate: date,
                appointmentTime: time,
            },
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};