import mongoose from 'mongoose';

const patientRecordSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    medicalHistory: {
        type: String,
        required: true
    },
    medications: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export default mongoose.model('PatientRecord', patientRecordSchema);