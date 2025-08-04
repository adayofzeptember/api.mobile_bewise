const express = require('express');
const db_bewsie = require('../db/db_bewise');
const user_data_router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const randomString = require('../functions/random_string');
const verifyToken = require('../functions/auth');

//!
user_data_router.get('/get_branch', (req, res) => {
    const query_checkRole = "SELECT code_branch FROM branch WHERE code_branch = 'BWG_R1_APRIL_2026'";
    db_bewsie.query(query_checkRole, (err, results) => {
        if (err) {
            console.error('ERROR QUERY ---> ', err.message);
            res.status(500).send('error');
            return;
        }
        else {
            res.status(200).json({
                data: results[0]
                //! เอา [0]ออก   เป็น list
            });
            // res.json(results[0]);
        }

    });
});

user_data_router.get('/get_branchs', (req, res) => {
    const query_checkRole = "SELECT code_branch FROM branch'";
    db_bewsie.query(query_checkRole, (err, results) => {
        if (err) {
            console.error('ERROR QUERY ---> ', err.message);
            res.status(500).send('error');
            return;
        }
        else {
            res.status(200).json({
                data: results
                //! เอา [0]ออก   เป็น list
            });
            // res.json(results[0]);
        }

    });
});
//!
user_data_router.get('/getid_role', (req, res) => {
    const query_checkRole = "SELECT id_role FROM roles WHERE tag = 'mod_customer'";
    db_bewsie.query(query_checkRole, (err, results) => {
        if (err) {
            console.error('ERROR QUERY ---> ', err.message);

            res.status(500).send('error');
            return;
        } else {
            res.status(200).json({
                data: {
                    id: results[0].id_role
                }
            });
            // res.json(results[0]);
        }
    });
});


user_data_router.post('/register', async (req, res) => {
    // email ต้องบังคับใส่ @
    const { email, password, id_role } = req.body;
    const { firstname, lastname } = req.body;
    const random_for_id_user = randomString(35);
    const random_for_id_data_role = randomString(35);
    const hashedPassword = await bcrypt.hash(password, 10);

    const { format } = require('date-fns');
    const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const query_check_dup = 'SELECT user_email FROM users WHERE user_email = ?';

    db_bewsie.query(query_check_dup, [email], (err2, resCheckDup) => {
        if (err2) {
            console.error('Database query error:', err2);
            return;
        }
        if (resCheckDup.length > 0) {

            return res.status(400).json({ success: false, message: 'อีเมลนี้เคยลงทะเบียนไว้แล้ว' });
        } else {
            const insert_user_query = `INSERT INTO users 
            (id_user, user_name, user_password, user_email, id_role, create_datetime, id_data_role) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db_bewsie.query(insert_user_query, [random_for_id_user, email, hashedPassword, email, id_role, formattedDate, random_for_id_data_role], (err, results) => {
                if (err) {
                    console.error('Error inserting into users: ', err);
                    return res.status(500).json({ message: 'error', err });
                }

                const insert_mod_customer_query = `INSERT INTO mod_customer
                (id_customer, forename, surename, user_email, create_id, create_datetime) 
                VALUES (?, ?, ?, ?, ?, ?)`;

                db_bewsie.query(insert_mod_customer_query, [random_for_id_data_role, firstname, lastname, email, random_for_id_data_role, formattedDate], (err, results) => {
                    if (err) {
                        console.error('Error inserting into mod_customer :', err);
                        return res.status(500).json({ message: 'error', err });
                    }
                    //! อีเมล
                    //! 
                    return res.status(201).json({
                        message: 'สมัครสมาชิกเรียบร้อย',
                        data: {
                            id_user: random_for_id_user,
                            id_data_role: random_for_id_data_role,
                            user_name: email,
                            user_email: email,
                            id_role: id_role,
                            password: hashedPassword,
                            firstname: firstname,
                            lastname: lastname,
                            create_datetime: formattedDate,
                        }
                    });
                });
            });
        }
    });
});

user_data_router.post('/login', (req, res) => {
    const { user_name, user_password } = req.body;

    if (!user_name || !user_password) {
        return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    const query = `
        SELECT users.*, mod_customer.* 
        FROM users 
        JOIN mod_customer ON users.id_data_role = mod_customer.id_customer 
        WHERE user_name = ?`;

    db_bewsie.query(query, [user_name], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        }
        if (err || results.length === 0) {
            return res.status(401).json({ message: 'ไม่พบบัญชี' });
        }
        const user = results[0];
        bcrypt.compare(user_password, user.user_password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
            }

            
            //! Generate Token (Only Store userId)  userId จาก JWT ไว้เรียกใช้
            const token = jwt.sign(
                { userId: user.id_data_role }, // Only storing user ID
                process.env.JWT_SECRET,
                { expiresIn: '365d' }
            );
            res.status(200).json({
                message: 'เข้าสู่ระบบเสร็จสิ้น: ' + user_name,
                userInfo: {
                    id: user.id_data_role,
                    name: user.forename,
                    surename: user.surename,
                    statusEmail: user.status
                },
                token: token
            });
        });
    });
});



// Get Profile Route (Always Fetch Fresh Data)
user_data_router.get('/get_profile', verifyToken, (req, res) => {
    const userId = req.user.userId; // Extract userId from token

    const get_profile_query = `
    SELECT 
    users.user_email, 
    users.create_datetime,

    mod_customer.forename, 
    mod_customer.surename, 
    mod_customer.id_card,
    mod_customer.id_customer,
    
    user_address.address,
    user_address.district, 
    user_address.postcode,
    user_address.province,
    user_address.amphur,
    user_address.telephone,
    
    user_images.name,
    user_images.directory

    FROM users 
    JOIN mod_customer ON users.id_data_role = mod_customer.id_customer
    LEFT JOIN user_images ON users.id_data_role = user_images.id_user 
    LEFT JOIN user_address ON users.id_data_role = user_address.id_user 
    WHERE mod_customer.id_customer = ?`;


    db_bewsie.query(get_profile_query, [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0]; // Get fresh user info

        res.status(200).json({
            message: 'Access granted',
            data: {
                user: {
                    id_customer: user.id_customer,
                    email: user.user_email,
                    create_datetime: user.create_datetime,
                    forename: user.forename,
                    surename: user.surename,
                    pic: {
                        name: user.name || "no-pic",
                        directory: user.directory || "no-dir found",
                    },
                    id_card: user.id_card,
                    address: user.address || "", // If address is null, return empty string
                    district: user.district || "",
                    postcode: user.postcode || "",
                    province: user.province || "",
                    amphur: user.amphur || "",
                    telephone: user.telephone || ""
                }
            }
        });
    });
});



user_data_router.put('/update_user/:id', verifyToken, (req, res) => {
    const userId = req.params.id;
    const { firstname, lastname, telephone, address, district, amphur, province, postcode } = req.body;

    const query_check_addres = 'SELECT id_user FROM user_address WHERE id_user = ?';

    db_bewsie.query(query_check_addres, [userId], (err, resultCheck) => {
        if (err) {
            console.error('UPDATE ERROR --->', err.message);
            return res.status(500).json({ message: 'Internal Server Error get iduser' });
        }

        if (resultCheck.length > 0) {
            const query_update_address = `
                UPDATE user_address 
                SET
                    address = ?, 
                    district = ?, 
                    amphur = ?, 
                    province = ?, 
                    postcode = ?, 
                    telephone = ?
                WHERE id_user = ?`;

            db_bewsie.query(query_update_address, [address, district, amphur, province, postcode, telephone, userId], (err, resultUpdate) => {
                if (err) {
                    console.error('UPDATE user_address ERROR --->', err.message);
                    return res.status(500).json({ message: 'Internal Server Error during address update' });
                }
                const query_update_modcus = `UPDATE mod_customer SET forename = ?, surename = ?, telephone = ? WHERE id_customer = ?`;
                const values = [firstname, lastname, telephone, userId];
                db_bewsie.query(query_update_modcus, values, (err, resultInsert_mc) => {
                    if (err) {
                        console.error('UPDATE mod_customer ERROR --->', err.message);
                        return res.status(500).json({ message: 'Internal Server Error during mod_customer update' });
                    }

                    return res.status(200).json({
                        message: 'update เรียบร้อย id:' + userId,
                        data: {
                            id_user:
                                userId,
                            firstname,
                            lastname,
                            telephone,
                            address,
                            district,
                            amphur,
                            province,
                            postcode
                        }
                    });
                });
            });
        } else {
            const query_insert_address = `INSERT INTO user_address 
                (id_user, address, district, amphur, province, postcode, telephone) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db_bewsie.query(query_insert_address, [userId, address, district, amphur, province, postcode, telephone], (err, resultInsert) => {
                if (err) {
                    console.error('INSERT user_address ERROR --->', err.message);
                    return res.status(500).json({ message: 'Internal Server Error INSERT user_address ERROR' });
                } else {

                    const query_update_modcus = `UPDATE mod_customer SET forename = ?, surename = ?, telephone = ? WHERE id_customer = ?`;
                    const values = [firstname, lastname, telephone, userId];

                    db_bewsie.query(query_update_modcus, values, (err, resultInsert_mc) => {
                        if (err) {
                            console.error('UPDATE mod_customer ERROR --->', err.message);
                            return res.status(500).json({ message: 'Internal Server Error UPDATE mod_customer ERROR' });
                        }
                        return res.status(201).json({
                            message: 'insert ข้อมูลใหม่เรียบร้อย id:' + userId,
                            data: {
                                id_user: userId,
                                firstname,
                                lastname,
                                telephone,
                                address,
                                district,
                                amphur,
                                province,
                                postcode
                            }
                        });
                    });
                }
            });
        }
    });
});

user_data_router.get('/get_log_login', verifyToken, (req, res) => {
    const userId = req.user.userId;

    const get_log_query = `
        SELECT create_datetime, ip_address, browser
        FROM user_bwg_log_login 
        WHERE id_user_bwg = ?`;

    db_bewsie.query(get_log_query, [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'ไม่มี log' });
        }
        res.status(200).json({
            data: {
                results
            }
        });
    });
});


user_data_router.post('/log_login', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const ip_address = req.body.ip_address;
    const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const insert_log_login = `INSERT INTO user_bwg_log_login 
        (id_user_bwg, create_datetime, ip_address, browser) 
        VALUES (?, ?, ?, ?)`;

    db_bewsie.query(insert_log_login, [userId, formattedDate, ip_address, 'Bewise Mobile Application'], (err, results) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.status(200).json({
            message: 'log inserted successfully',
            data: results
        });
    });
});

// user_data_router.get('/get_history_participate', verifyToken, (req, res) => {
//     const userId = req.user.userId;
//     const query = `
//         SELECT
//         c                               
//             d.id_customer, 
//             d.idcard_std, 
//             d.city, 
//             d.branch, 
//             b.name_th AS branch_name, 
//             d.date_regis
//         FROM (
//             SELECT id_customer, idcard_std, city, branch, date_regis FROM dataregister_2025_april_r1
//             UNION ALL
//             SELECT id_customer, idcard_std, city, branch, date_regis FROM dataregister_2025_april_r2
//             UNION ALL
//             SELECT id_customer, idcard_std, city, branch, date_regis FROM dataregister_2025_april_r3
//             UNION ALL
//             SELECT id_customer, idcard_std, city, branch, date_regis FROM dataregister_2025_april_r4
//             UNION ALL
//             SELECT id_customer, idcard_std, city, branch, date_regis FROM dataregister_2025_july_r1
//             UNION ALL
//             SELECT id_customer, idcard_std, city, branch, date_regis FROM dataregister_2025_july_r2
//             UNION ALL
//             SELECT id_customer, idcard_std, city, branch, date_regis FROM dataregister_2026_april_r2
//         ) AS d
//         LEFT JOIN branch AS b 
//         ON d.branch COLLATE utf8_unicode_ci = b.code_branch COLLATE utf8_unicode_ci
//         WHERE d.id_customer = ?
//         ORDER BY d.date_regis ASC;`;

//     db_bewsie.query(query, [userId], (err, results) => {
//         if (err) {
//             return res.status(500).json({ message: err });
//         }
//         if (results.length === 0) {

//             return res.status(404).json({ message: "ไม่พบประวัติการเข้าร่วม" });
//         }
//         res.status(200).json({
//             message: 'Access granted',
//             data: results
//         });
//     });
// });


module.exports = user_data_router;