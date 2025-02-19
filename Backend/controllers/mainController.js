import fetch from 'node-fetch';
import { config } from '../config/config.js';

const latitude = 20.3488963;
const longitude = 85.8157988;
let radius = 4 * 1000;

export const getHomepage = async (req, res) => {
    try {
        const requestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${config.googleApiKey}&type=hospital`;

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

export const getNearbyHospitals = async (req, res) => {
    try {
        const requestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${config.googleApiKey}&type=hospital`;

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
        const requestUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${config.googleApiKey}&type=pharmacy`;

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