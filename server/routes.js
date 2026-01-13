const express = require('express');
const router = express.Router();
const db = require('./db');
const fs = require('fs');
const path = require('path');

/* =========================
   AUTH MIDDLEWARE
   ========================= */
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

/* =========================
   CONTACT FORM (PUBLIC)
   ========================= */
router.post('/contact', (req, res) => {
  const { name, email, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send('Required fields missing.');
  }

  const sql = `
    INSERT INTO contacts (name, email, service, message)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, email, service, message], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error.');
    }

    res.redirect('/success');
  });
});

/* =========================
   ADMIN AUTH
   ========================= */
const ADMIN_PASSWORD = 'telmexadmin@2026'; // change before production

router.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-login.html'));
});

router.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin/contacts');
  }
  res.redirect('/admin/login');
});

router.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

/* =========================
   ADMIN DASHBOARD
   ========================= */
router.get('/admin/contacts', requireAdmin, (req, res) => {
  const search = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;

  const sql = `
    SELECT id, name, email, service, message, is_read, created_at
    FROM contacts
    WHERE name LIKE ? OR email LIKE ? OR message LIKE ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [like, like, like, limit, offset], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    let rows = '';
    results.forEach(row => {
      rows += `
        <tr ${row.is_read ? '' : 'style="font-weight:bold;"'}>
          <td>${new Date(row.created_at).toLocaleString()}</td>
          <td>${row.name}</td>
          <td>${row.email}</td>
          <td>${row.service || ''}</td>
          <td>${row.message}</td>
          <td>${row.is_read ? 'Read' : 'Unread'}</td>
          <td>
            <div class="action-buttons">
              ${row.is_read ? '' : `
                <form method="POST" action="/admin/contacts/read/${row.id}">
                  <button type="submit" class="btn btn-secondary">
                    Mark Read
                  </button>
                </form>
              `}
              <form method="POST" action="/admin/contacts/delete/${row.id}">
                <button type="submit" class="btn btn-danger"
                  onclick="return confirm('Delete this inquiry?')">
                  Delete
                </button>
              </form>
            </div>
          </td>
        </tr>
      `;
    });

    const filePath = path.join(__dirname, '../views/admin-contacts.html');
    let html = fs.readFileSync(filePath, 'utf8');

    html = html.replace(
      '{{rows}}',
      rows || '<tr><td colspan="7">No inquiries found.</td></tr>'
    );

    res.send(html);
  });
});

/* =========================
   ADMIN ACTIONS
   ========================= */
router.post('/admin/contacts/read/:id', requireAdmin, (req, res) => {
  db.query(
    'UPDATE contacts SET is_read = 1 WHERE id = ?',
    [req.params.id],
    err => {
      if (err) {
        console.error(err);
        return res.status(500).send('Database error');
      }
      res.redirect('/admin/contacts');
    }
  );
});

router.post('/admin/contacts/delete/:id', requireAdmin, (req, res) => {
  db.query(
    'DELETE FROM contacts WHERE id = ?',
    [req.params.id],
    err => {
      if (err) {
        console.error(err);
        return res.status(500).send('Database error');
      }
      res.redirect('/admin/contacts');
    }
  );
});

module.exports = router;
