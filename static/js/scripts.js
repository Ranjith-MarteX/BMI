document.addEventListener('DOMContentLoaded', () => {
    const bmiForm = document.getElementById('bmiForm');
    const resultDiv = document.getElementById('result');
    const bmiValue = document.getElementById('bmiValue');
    const bmiCategory = document.getElementById('bmiCategory');
    const errorDiv = document.getElementById('error');
    const historyList = document.getElementById('historyList');
    const ctx = document.getElementById('bmiChart').getContext('2d');
    let bmiChart;

    const fetchHistory = async () => {
        try {
            const response = await fetch('/history');
            const history = await response.json();

            historyList.innerHTML = ''; // Clear existing history
            let bmiData = [];
            let categoryData = [];
            let labels = [];

            if (history.length === 0) {
                historyList.innerHTML = '<li class="list-group-item">No previous BMI results.</li>';
                return;
            }

            history.forEach(entry => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');
                listItem.innerHTML = `
                    <strong>BMI:</strong> ${entry.bmi} 
                    <strong>Category:</strong> <span style="color: ${entry.color}">${entry.category}</span> 
                    <strong>Date:</strong> ${entry.timestamp}
                `;
                historyList.appendChild(listItem);

                // Collect data for the chart
                bmiData.push(entry.bmi);
                labels.push(entry.timestamp); // Assuming timestamp is a string; you can format this
            });

            // Update the chart with new data
            updateChart(labels, bmiData);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const updateChart = (labels, data) => {
        if (bmiChart) {
            bmiChart.destroy(); // Destroy the existing chart before creating a new one
        }

        bmiChart = new Chart(ctx, {
            type: 'line', // Choose the chart type (line, bar, etc.)
            data: {
                labels: labels,
                datasets: [{
                    label: 'BMI Over Time',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            }
        });
    };

    // Initial fetch of history when the page loads
    fetchHistory();

    bmiForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent form from submitting the traditional way

        // Reset previous results and errors
        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';

        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;

        // Basic client-side validation
        if (weight <= 0 || height <= 0) {
            errorDiv.textContent = 'Please enter positive numbers for weight and height.';
            errorDiv.style.display = 'block';
            return;
        }

        const data = {
            weight: weight,
            height: height
        };

        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                bmiValue.textContent = result.bmi;
                bmiCategory.textContent = result.category;
                bmiCategory.style.color = result.color;
                resultDiv.style.display = 'block';

                // Fetch and update history
                fetchHistory();
            } else {
                errorDiv.textContent = result.error;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            errorDiv.textContent = 'An error occurred while calculating BMI.';
            errorDiv.style.display = 'block';
        }
    });
});
