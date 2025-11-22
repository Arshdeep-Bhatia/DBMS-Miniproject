DROP DATABASE IF EXISTS campus_event_mgmt;
CREATE DATABASE campus_event_mgmt;
USE campus_event_mgmt;

CREATE TABLE Department (
    dept_id INT PRIMARY KEY,
    d_name VARCHAR(100) NOT NULL,
    faculty_count INT
);

CREATE TABLE Organizer (
    org_id INT PRIMARY KEY,
    o_name VARCHAR(100),
    contact VARCHAR(50),
    dept_id INT,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
);

CREATE TABLE Sponsor (
    sponsor_id INT PRIMARY KEY,
    sp_name VARCHAR(100),
    s_amount DECIMAL(10,2)
);

CREATE TABLE Student (
    student_id INT PRIMARY KEY,
    s_name VARCHAR(100),
    email VARCHAR(100) UNIQUE
);

CREATE TABLE Payment (
    payment_id INT PRIMARY KEY,
    method VARCHAR(50),
    p_amount DECIMAL(10,2)
);

CREATE TABLE Venue (
    venue_id INT PRIMARY KEY,
    location VARCHAR(100),
    capacity INT
);

CREATE TABLE Event (
    event_id INT PRIMARY KEY,
    title VARCHAR(100),
    start_time DATETIME,
    description TEXT,
    org_id INT,
    sponsor_id INT,
    venue_id INT,
    FOREIGN KEY (org_id) REFERENCES Organizer(org_id),
    FOREIGN KEY (sponsor_id) REFERENCES Sponsor(sponsor_id),
    FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE Registration (
	reg_id INT,
    PRIMARY KEY (reg_id, event_id),
    status VARCHAR(50),
    event_id INT,
    student_id INT,
    FOREIGN KEY (event_id) REFERENCES Event(event_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id)
);

CREATE TABLE Ticket (
    ticket_id INT PRIMARY KEY,
    price DECIMAL(8,2),
    type VARCHAR(50),
    event_id INT,
    payment_id INT,
    FOREIGN KEY (event_id) REFERENCES Event(event_id),
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id)
);

CREATE TABLE Feedback (
    feedback_id INT PRIMARY KEY,
    comments TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    event_id INT,
    student_id INT,
    FOREIGN KEY (event_id) REFERENCES Event(event_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id)
);

CREATE TABLE Contact (
    org_id INT,
    contact INT(10),
    PRIMARY KEY (org_id, contact),
    FOREIGN KEY (org_id) REFERENCES Organizer(org_id)
);

CREATE TABLE Email (
    student_id INT,
    email VARCHAR(100),
    PRIMARY KEY (student_id, email),
    FOREIGN KEY (student_id) REFERENCES Student(student_id)
);

CREATE TABLE Method (
    payment_id INT,
    method VARCHAR(50),
    PRIMARY KEY (payment_id, method),
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id)
);

INSERT INTO Department VALUES
(1, 'Computer Science', 12),
(2, 'Mechanical', 8);

INSERT INTO Organizer VALUES
(101, 'Tech Club', 'techclub@college.edu', 1),
(102, 'Mech Assoc', 'mech@college.edu', 2);

INSERT INTO Sponsor VALUES
(601, 'TechCorp', 5000.00),
(602, 'AutoWorks', 3500.00);

INSERT INTO Venue VALUES
(201, 'Auditorium', 500),
(202, 'Lab Hall', 100);

INSERT INTO Event VALUES
(301, 'AI Workshop', '2025-10-20 10:00:00', 'Intro to AI and ML', 101, 601, 201),
(302, 'AutoCAD Seminar', '2025-10-25 14:00:00', 'Design Automation Session', 102, 602, 202);

INSERT INTO Student VALUES
(401, 'Arshdeep Bhatia', 'arsh@college.edu'),
(402, 'Arshia Jain', 'arshia@college.edu');

INSERT INTO Payment VALUES
(801, 'Credit Card', 100.00),
(802, 'Cash', 50.00);

INSERT INTO Ticket VALUES
(701, 100.00, 'VIP', 301, 801),
(702, 50.00, 'General', 302, 802);

INSERT INTO Registration VALUES
(501, 'Confirmed', 301, 401),
(502, 'Pending', 302, 402);

INSERT INTO Feedback VALUES
(901, 'Great event!', 5, 301, 401),
(902, 'Could be better organized', 3, 302, 402);

INSERT INTO Contact VALUES
(101, '1234567890'),
(102, '1023456789');

INSERT INTO Email VALUES
(401, 'arsh@college.edu'),
(402, 'arshia@college.edu');

INSERT INTO Method VALUES
(801, 'Credit Card'),
(802, 'Cash');

SELECT * FROM Department;
SELECT * FROM Event;
SELECT * FROM Organizer;
SELECT * FROM Student;
SELECT * FROM Payment;
SELECT * FROM Feedback;
SELECT * FROM Ticket;
SELECT * FROM Sponsor;
SELECT * FROM Registration;
SELECT * FROM Venue;
SELECT * FROM Contact;
SELECT * FROM Email;
SELECT * FROM Method;

DELIMITER //

CREATE TRIGGER trg_update_registration_status
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
  UPDATE Registration
  SET status = 'Confirmed'
  WHERE student_id IN (
    SELECT s.student_id
    FROM Student s
    JOIN Ticket t ON t.payment_id = NEW.payment_id
    JOIN Event e ON e.event_id = t.event_id
    JOIN Registration r ON r.event_id = e.event_id AND r.student_id = s.student_id
  );
END;
//

CREATE TRIGGER trg_check_capacity
BEFORE INSERT ON Registration
FOR EACH ROW
BEGIN
  DECLARE reg_count INT;
  DECLARE venue_cap INT;
  DECLARE venue_id_temp INT;

  SELECT venue_id INTO venue_id_temp FROM Event WHERE event_id = NEW.event_id;
  SELECT COUNT(*) INTO reg_count FROM Registration WHERE event_id = NEW.event_id;
  SELECT capacity INTO venue_cap FROM Venue WHERE venue_id = venue_id_temp;

  IF reg_count >= venue_cap THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Venue capacity full, cannot register.';
  END IF;
END;
//

DELIMITER ;

DELIMITER //

CREATE FUNCTION total_registrations(eid INT)
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE total INT;
  SELECT COUNT(*) INTO total FROM Registration WHERE event_id = eid;
  RETURN total;
END;
//

CREATE FUNCTION avg_event_rating(eid INT)
RETURNS DECIMAL(4,2)
DETERMINISTIC
BEGIN
  DECLARE avg_rating DECIMAL(4,2);
  SELECT AVG(rating) INTO avg_rating FROM Feedback WHERE event_id = eid;
  RETURN avg_rating;
END;
//

DELIMITER ;

DELIMITER //

CREATE PROCEDURE event_details(IN eid INT)
BEGIN
  SELECT e.title, e.description, o.o_name AS organizer, s.sp_name AS sponsor, v.location AS venue
  FROM Event e
  JOIN Organizer o ON e.org_id = o.org_id
  JOIN Sponsor s ON e.sponsor_id = s.sponsor_id
  JOIN Venue v ON e.venue_id = v.venue_id
  WHERE e.event_id = eid;
END;
//

DELIMITER ;

SELECT e.title, s.sp_name AS Sponsor, v.location AS Venue
FROM Event e
JOIN Sponsor s ON e.sponsor_id = s.sponsor_id
JOIN Venue v ON e.venue_id = v.venue_id;

SELECT s.s_name, s.email, r.status
FROM Registration r
JOIN Student s ON r.student_id = s.student_id
WHERE r.event_id = 301;

SELECT e.title, s.s_name, f.rating, f.comments
FROM Feedback f
JOIN Event e ON f.event_id = e.event_id
JOIN Student s ON f.student_id = s.student_id;

SELECT e.title, SUM(p.p_amount) AS total_revenue
FROM Event e
JOIN Ticket t ON e.event_id = t.event_id
JOIN Payment p ON t.payment_id = p.payment_id
GROUP BY e.event_id;

SELECT d.d_name, e.title
FROM Department d
JOIN Organizer o ON d.dept_id = o.dept_id
JOIN Event e ON e.org_id = o.org_id
ORDER BY d.d_name;