const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT e.*, o.o_name as organizer_name, s.sp_name as sponsor_name, v.location, v.capacity
            FROM Event e
            LEFT JOIN Organizer o ON e.org_id = o.org_id
            LEFT JOIN Sponsor s ON e.sponsor_id = s.sponsor_id
            LEFT JOIN Venue v ON e.venue_id = v.venue_id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/events/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('CALL event_details(?)', [req.params.id]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/events/:id/registrations', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, s.s_name, s.email 
            FROM Registration r 
            JOIN Student s ON r.student_id = s.student_id 
            WHERE r.event_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/events/:id/stats', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        const [regResult] = await db.execute('SELECT total_registrations(?) as total_registrations', [eventId]);
        const [ratingResult] = await db.execute('SELECT avg_event_rating(?) as avg_rating', [eventId]);
        const [revenueResult] = await db.execute(`
            SELECT COALESCE(SUM(p.p_amount), 0) as total_revenue
            FROM Event e
            LEFT JOIN Ticket t ON e.event_id = t.event_id
            LEFT JOIN Payment p ON t.payment_id = p.payment_id
            WHERE e.event_id = ?
        `, [eventId]);

        res.json({
            total_registrations: regResult[0].total_registrations,
            avg_rating: ratingResult[0].avg_rating || 0,
            total_revenue: revenueResult[0].total_revenue
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/registrations', async (req, res) => {
    try {
        const { event_id, student_id, student_name, student_email } = req.body;
        
        await db.execute(
            'INSERT IGNORE INTO Student (student_id, s_name, email) VALUES (?, ?, ?)',
            [student_id, student_name, student_email]
        );

        const [result] = await db.execute(
            'INSERT INTO Registration (reg_id, event_id, student_id, status) VALUES (?, ?, ?, ?)',
            [Date.now(), event_id, student_id, 'Pending']
        );

        res.json({ success: true, message: 'Registration successful!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const { event_id, student_id, rating, comments } = req.body;
        
        const [result] = await db.execute(
            'INSERT INTO Feedback (feedback_id, event_id, student_id, rating, comments) VALUES (?, ?, ?, ?, ?)',
            [Date.now(), event_id, student_id, rating, comments]
        );

        res.json({ success: true, message: 'Feedback submitted!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Student');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/revenue-report', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT e.title, SUM(p.p_amount) AS total_revenue
            FROM Event e
            JOIN Ticket t ON e.event_id = t.event_id
            JOIN Payment p ON t.payment_id = p.payment_id
            GROUP BY e.event_id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
