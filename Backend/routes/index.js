import express from 'express';
import {
    getHomepage,
    getNearbyHospitals,
    getNearbyPharmacy,
    getMedConnect,
    getPatientInfo,
    savePatientInfo,
    getPaymentPage,
    createCheckoutSession
} from '../controllers/mainController.js';

const router = express.Router();

router.get('/', getHomepage);
router.get('/nearbyHospital', getNearbyHospitals);
router.get('/nearbyPharmacy', getNearbyPharmacy);
router.get('/medConnect', getMedConnect);
router.get('/patientInfo', getPatientInfo);
router.post('/patientInfo', savePatientInfo);
router.get('/payment', getPaymentPage);
router.post('/create-checkout-session', createCheckoutSession);

export default router;