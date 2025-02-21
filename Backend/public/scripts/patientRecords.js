// filepath: /c:/Users/shaur/OneDrive/Desktop/PROJECTS/CareAnywhere 1.0/CareAnywhere/Backend/public/scripts/patientRecords.js
document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        patientName: document.getElementById('patientName').value,
        dob: document.getElementById('dob').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        medications: document.getElementById('medications').value
    };

    try {
        const response = await fetch('/patientInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Record saved successfully');
            location.reload();
        } else {
            throw new Error('Failed to save record');
        }
    } catch (error) {
        alert('Error saving record: ' + error.message);
    }
});