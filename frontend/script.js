const API_BASE = 'http://localhost:3000/api';

let currentEventId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    loadEventsForRegistration();
    loadAnalytics();
    setupModal();
});

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    event.target.classList.add('active');
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        const events = await response.json();
        
        const eventsList = document.getElementById('events-list');
        eventsList.innerHTML = events.map(event => `
            <div class="event-card">
                <h3>${event.title}</h3>
                <p><strong>Description:</strong> ${event.description}</p>
                <p><strong>Organizer:</strong> ${event.organizer_name}</p>
                <p><strong>Sponsor:</strong> ${event.sponsor_name || 'None'}</p>
                <p><strong>Venue:</strong> ${event.location} (Capacity: ${event.capacity})</p>
                <div class="event-meta">
                    <span>📅 ${new Date(event.start_time).toLocaleString()}</span>
                    <div>
                        <button class="btn btn-primary" onclick="viewEventDetails(${event.event_id})">
                            View Details
                        </button>
                        <button class="btn btn-secondary" onclick="showFeedbackForm(${event.event_id})">
                            Give Feedback
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

async function loadEventsForRegistration() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        const events = await response.json();
        
        const eventSelect = document.getElementById('event-select');
        eventSelect.innerHTML = '<option value="">Choose an event...</option>' +
            events.map(event => `
                <option value="${event.event_id}">${event.title}</option>
            `).join('');
    } catch (error) {
        console.error('Error loading events for registration:', error);
    }
}

async function viewEventDetails(eventId) {
    try {
        const [eventResponse, registrationsResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE}/events/${eventId}`),
            fetch(`${API_BASE}/events/${eventId}/registrations`),
            fetch(`${API_BASE}/events/${eventId}/stats`)
        ]);

        const event = (await eventResponse.json())[0];
        const registrations = await registrationsResponse.json();
        const stats = await statsResponse.json();

        document.getElementById('modal-title').textContent = event.title;
        document.getElementById('modal-content').innerHTML = `
            <div class="event-details">
                <p><strong>Description:</strong> ${event.description}</p>
                <p><strong>Organizer:</strong> ${event.organizer}</p>
                <p><strong>Sponsor:</strong> ${event.sponsor}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                
                <div class="stats" style="margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 5px;">
                    <h4>Event Statistics</h4>
                    <p>Total Registrations: ${stats.total_registrations}</p>
                    <p>Average Rating: ${stats.avg_rating ? stats.avg_rating.toFixed(1) + ' ⭐' : 'No ratings yet'}</p>
                    <p>Total Revenue: $${stats.total_revenue}</p>
                </div>
                
                <div class="registrations">
                    <h4>Registrations (${registrations.length})</h4>
                    ${registrations.length > 0 ? `
                        <table style="width: 100%; margin-top: 10px;">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${registrations.map(reg => `
                                    <tr>
                                        <td>${reg.s_name}</td>
                                        <td>${reg.email}</td>
                                        <td>
                                            <span style="color: ${reg.status === 'Confirmed' ? 'green' : 'orange'};">
                                                ${reg.status}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No registrations yet.</p>'}
                </div>
            </div>
        `;

        document.getElementById('event-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading event details:', error);
    }
}

function showFeedbackForm(eventId) {
    currentEventId = eventId;
    
    document.getElementById('modal-title').textContent = 'Submit Feedback';
    document.getElementById('modal-content').innerHTML = `
        <form id="feedback-form" class="feedback-form">
            <div class="form-group">
                <label for="feedback-student-id">Student ID:</label>
                <input type="number" id="feedback-student-id" required>
            </div>
            <div class="form-group">
                <label>Rating:</label>
                <div class="rating-stars" id="rating-stars">
                    <span onclick="setRating(1)">★</span>
                    <span onclick="setRating(2)">★</span>
                    <span onclick="setRating(3)">★</span>
                    <span onclick="setRating(4)">★</span>
                    <span onclick="setRating(5)">★</span>
                </div>
                <input type="hidden" id="rating-value" required>
            </div>
            <div class="form-group">
                <label for="comments">Comments:</label>
                <textarea id="comments" rows="4" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 5px;"></textarea>
            </div>
            <button type="submit" style="width: 100%; padding: 12px; background: #48bb78; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Submit Feedback
            </button>
        </form>
    `;

    document.getElementById('event-modal').style.display = 'block';
    
    document.getElementById('feedback-form').addEventListener('submit', submitFeedback);
}

function setRating(rating) {
    const stars = document.querySelectorAll('#rating-stars span');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
    document.getElementById('rating-value').value = rating;
}

async function submitFeedback(event) {
    event.preventDefault();
    
    const formData = {
        event_id: currentEventId,
        student_id: document.getElementById('feedback-student-id').value,
        rating: document.getElementById('rating-value').value,
        comments: document.getElementById('comments').value
    };

    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        alert(result.message);
        document.getElementById('event-modal').style.display = 'none';
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback');
    }
}

document.getElementById('registration-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = {
        event_id: document.getElementById('event-select').value,
        student_id: document.getElementById('student-id').value,
        student_name: document.getElementById('student-name').value,
        student_email: document.getElementById('student-email').value
    };

    try {
        const response = await fetch(`${API_BASE}/registrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (result.success) {
            alert('Registration successful!');
            this.reset();
        } else {
            alert('Registration failed: ' + result.error);
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Error during registration');
    }
});

async function loadAnalytics() {
    try {
        const [eventsResponse, revenueResponse] = await Promise.all([
            fetch(`${API_BASE}/events`),
            fetch(`${API_BASE}/revenue-report`)
        ]);

        const events = await eventsResponse.json();
        const revenueData = await revenueResponse.json();
        const statsPromises = events.map(event => 
            fetch(`${API_BASE}/events/${event.event_id}/stats`).then(r => r.json())
        );
        const stats = await Promise.all(statsPromises);
        const statsGrid = document.getElementById('stats-grid');
        statsGrid.innerHTML = events.map((event, index) => `
            <div class="stat-card">
                <h3>${stats[index].total_registrations}</h3>
                <p>Registrations for ${event.title}</p>
                <p>Rating: ${stats[index].avg_rating ? stats[index].avg_rating.toFixed(1) + ' ⭐' : 'N/A'}</p>
                <p>Revenue: $${stats[index].total_revenue}</p>
            </div>
        `).join('');

        const revenueTable = document.querySelector('#revenue-table tbody');
        revenueTable.innerHTML = revenueData.map(item => `
            <tr>
                <td>${item.title}</td>
                <td>$${item.total_revenue}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function setupModal() {
    const modal = document.getElementById('event-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}
