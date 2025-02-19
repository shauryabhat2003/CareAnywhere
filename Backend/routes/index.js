import express from 'express';
import { getHomepage, getNearbyHospitals, getNearbyPharmacy, getMedConnect } from '../controllers/mainController.js';

const router = express.Router();

router.get('/', getHomepage);
router.get('/nearbyHospital', getNearbyHospitals);
router.get('/nearbyPharmacy', getNearbyPharmacy);
router.get('/medConnect', getMedConnect);

export default router;