const express = require('express');
const db_bewsie = require('../db/db_bewise');
const register_exam_router = express.Router();
const verifyToken = require('../functions/auth');
const user_data_router = require('./user_data_router');

register_exam_router.post('/register', verifyToken, async (req, res) => {
    const { format, constructFrom } = require('date-fns');

    const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss'); // 🟢 Generate current timestamp
    const query_check = 'SELECT id_customer FROM dataregister_2026_april_r1 WHERE id_customer = ?';
    const { id_customer, city, idcard, prefix, dataname, surname, prefix_eng, dataname_eng, surname_eng, datanickname, datanickname_eng,
        dataage, gender, datanation, datatel, dataidline, dataemail, dataadd,
        districts, amphurs, provinces, zip_code, dataschool, gpax, gpax_eng, provinces_school, datalevel,
        dataparent, dataparenttel, dataparentrelationship, regis_type_to, regis_buy, code_branch, databd, file_idcard, file_gpa } = req.body;

    db_bewsie.query(query_check, [id_customer], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ message: 'error', err });
        }
        if (results.length > 0) {
            return res.status(200).json({ message: 'เคยสมัครรอบนี้ไปแล้ว!' });
        }

        const query_exam_register = `INSERT INTO dataregister_2026_april_r1 (
        id_customer, city, idcard, prefix, dataname, surname, prefix_eng, dataname_eng, surname_eng, 
        datanickname, datanickname_eng, dataage, gender, datanation, datatel, dataidline, dataemail, dataadd, 
        districts, amphures, provinces, zip_code, dataschool, gpax, gpax_eng, provinces_school, datalevel, 
        dataparent, dataparenttel, dataparentrelationship, regis_type_to, regis_buy, date_regis, branch, databd, file_idcard, file_gpa
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`;

        db_bewsie.query(query_exam_register, [id_customer, city, idcard, prefix, dataname, surname, prefix_eng, dataname_eng, surname_eng,
            datanickname, datanickname_eng, dataage, gender, datanation, datatel, dataidline, dataemail, dataadd,
            districts, amphurs, provinces, zip_code, dataschool, gpax, gpax_eng, provinces_school, datalevel,
            dataparent, dataparenttel, dataparentrelationship, regis_type_to, regis_buy, formattedDate, code_branch, databd, file_idcard, file_gpa], (err, results) => {
                if (err) {
                    console.error('Error inserting register exam:', err);
                    return res.status(500).json({ message: 'error', err });
                }
                //! get ตรงนี้ แล้ว retuernid, branch ไว้ใว่ที่ id_cardSTD
                const quey_getPayment = 'SELECT id, branch, city, id_customer FROM dataregister_2026_april_r1 WHERE id_customer = ?';
                //!
                db_bewsie.query(quey_getPayment, [id_customer], (err, resultsGet) => {
                    if (err) {
                        console.error('Error inserting register exam:', err);
                        return res.status(500).json({ message: 'error', err });
                    }
                    const formattedResult = {
                        ...resultsGet[0],
                        id: String(resultsGet[0].id).padStart(4, '0') // Ensures id has 4 digits
                    };

                    return res.status(201).json({
                        message: 'สมัครสอบสำเร็จ',
                        data:
                            formattedResult
                    });

                });
                //!


            });
    });
});


register_exam_router.put('/update_afterslip', verifyToken, (req, res) => {
    //! อัปเดทรหัส นร ไปยัง data 
    const userId = req.user.userId;
    const { idcard_std } = req.body;

    // console.log(idcard_std);
    const query_update_payment = `
            UPDATE dataregister_2026_april_r1 
                SET 
                    idcard_std = ?    
        WHERE id_customer = ?`;

    db_bewsie.query(query_update_payment, [idcard_std, userId], (err, result) => {
        if (err) {
            console.error('UPDATE after payment ERROR --->', err.message);
            return res.status(500).json({ message: 'Internal Server Error during after payment' });
        }
        return res.status(200).json({
            message: `อัปเดทหลังชำระเงินเรียบร้อยแล้ว: ${userId}`,
            data: idcard_std
        });
    });
});

register_exam_router.put('/update_docs2/:check', verifyToken, (req, res) => {
    //! อัปเดทส่งเอกสารรอบ 2 

    const userID = req.user.userId;
    const { gpa_name, id_name } = req.body;
    var query_update_docs2 = '';
    var values = [];
    if (req.params.check == "gpa") {
        query_update_docs2 = `
        UPDATE dataregister_2026_april_r1 
            SET
             file_gpa = ?
            WHERE id_customer = ?`;
        values = [gpa_name, userID];
    } else if (req.params.check == "id") {


        query_update_docs2 = `
        UPDATE dataregister_2026_april_r1 
            SET
                file_idcard = ?
            WHERE id_customer = ?`;

        values = [id_name, userID];
    }

    else {
        query_update_docs2 = `
        UPDATE dataregister_2026_april_r1 
            SET 
                file_idcard = ?, file_gpa = ?
            WHERE id_customer = ?`;

        values = [id_name, gpa_name, userID];
    }

    db_bewsie.query(query_update_docs2, values, (err, result) => {
        if (err) {
            console.error('UPDATE 2nd docs ERROR --->', err.message);
            return res.status(500).json({ message: 'Internal Server Error during after payment' });
        }
        return res.status(200).json({
            message: `อัปเดทเอกสารแล้ว: ${req.params.check}`,
        });

    });
});


register_exam_router.post('/insert_payment/:id', verifyToken, (req, res) => {
    //! insert ลง table การชำระเงิน

    const customer_id = req.params.id;
    const { payment_time, payment_date, payment_amount } = req.body;
    const query_checkRole = "SELECT id_customer, dataschool, datatel, datanickname, dataname, idcard, idcard_std, city, branch FROM dataregister_2026_april_r1 WHERE id_customer = ? ";
    db_bewsie.query(query_checkRole, [customer_id], (err, results1) => {
        if (err) {
            console.error('ERROR QUERY ---> ', err.message);
            res.status(500).send('error');
            return;
        }

        const query_exam_register = `INSERT INTO datapayment_2026_april_r1 (
            id_customer, dataschool, datatel, datanickname, dataname, idcard, idcard_std, city, branch, payment_bank, payment_status,
            payment_time, payment_date, payment_amount
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);`;

        db_bewsie.query(query_exam_register, [results1[0].id_customer, results1[0].dataschool, results1[0].datatel, results1[0].datanickname,
        results1[0].dataname, results1[0].idcard, results1[0].idcard_std, results1[0].city, results1[0].branch, "QR Payment", "ชำระแล้ว",
            payment_time, payment_date, payment_amount
        ], (err, results2) => {
            if (err) {
                console.error('Error inserting register exam:', err);
                return res.status(500).json({ message: 'error', err });
            }
            res.status(200).json({
                data: results2
            });
            //!
        });
    });
});




//? get to check เอกสาร, ชำระเงิน

register_exam_router.get('/check_docs/:type_check', verifyToken, (req, res) => {
    const check = req.params.type_check;
    const userId = req.user.userId;// Extract userId from token

    //! เช็ค docs
    if (check == 'docs') {


        const queryCheckDocs = 'SELECT file_idcard, file_gpa FROM dataregister_2026_april_r1 WHERE id_customer = ?';

        db_bewsie.query(queryCheckDocs, [userId], (err, results) => {

            if (err) {
                return res.status(400).json({ error: 'เช็คเอกสาร error ' + err.message });
            }
            else {
                const idcard = results[0].file_idcard;
                const gpa = results[0].file_gpa;
                if (!idcard && !gpa) {
                    return res.status(200).json({ message: 'ยังไม่อัปไฟล์เอกสารทั้งสอง', "code": "2" });
                } else if (!idcard) {
                    return res.status(200).json({ message: 'ยังไม่อัปโหลดไฟล์บัตรประชาชน', "code": "1-id" });
                } else if (!gpa) {
                    return res.status(200).json({ message: 'ยังไม่อัปโหลดไฟล์ GPA', "code": "1-gp a" });
                } else {
                    return res.status(200).json({ message: 'อัปโหลดไฟล์เอกสารครบแล้ว', "code": "0" });
                }
            }
        });
    }
    //! เช็คว่าจะไปหน้าไหน
    else if (check == 'register') {
        const queryCheckRegis = 'SELECT id_customer FROM dataregister_2026_april_r1 WHERE id_customer = ?';
        db_bewsie.query(queryCheckRegis, [userId], (err, results) => {
            if (results.length == 0) {
                return res.status(200).json({ message: 'no-register' });
            }

            else {
                const queryCheckPay = 'SELECT idcard_std FROM data_gb_prime_pay WHERE ref_no = ?';
                const { ref_no } = req.body;
                db_bewsie.query(queryCheckPay, [ref_no], (err, results) => {
                    if (err) {
                        return res.status(400).json({ error: 'เช็ค payment error ' + err.message });
                    }
                    else {

                        if (results.length == 0) {
                            return res.status(200).json({ message: 'not yet', "code": "payment-0", "data": "ยังไม่จ่ายเงิน" });
                        }
                        else {
                            return res.status(200).json({ message: 'paid', "code": "payment-1", "data": "จ่ายเงินแล้ว" });
                        }
                    }
                });
            }

            // else {
            //     const queryCheckPay = 'SELECT idcard_std, idcard_std FROM datapayment_2026_april_r1 WHERE id_customer = ?';
            //     db_bewsie.query(queryCheckPay, [userId], (err, results) => {
            //         if (err) {
            //             return res.status(400).json({ error: 'เช็ค payment error ' + err.message });
            //         }
            //         else {
            //             if (results.length == 0) {
            //                 return res.status(200).json({ message: 'ยังไม่จ่ายเงิน', "code": "payment-0" });
            //             }
            //             else {
            //                 return res.status(200).json({ message: 'จ่ายเงินแล้ว', "code": "payment-1" });
            //             }
            //         }
            //     });
            // }
        });
    }
});


//! ใส่ไว้ใน update after slip

register_exam_router.put('/update_idcard_std', verifyToken, (req, res) => {
    //! อัปเดทรหัส นร ไปยัง data 
    const userId = req.user.userId;
    const { idcard_std } = req.body;

    // console.log(idcard_std);
    const query_update_payment = `
            UPDATE dataregister_2026_april_r1 
                SET 
                    idcard_std = ?    
        WHERE id_customer = ?`;

    db_bewsie.query(query_update_payment, [idcard_std, userId], (err, result) => {
        if (err) {
            console.error('UPDATE idcard_std ERROR --->', err.message);
            return res.status(500).json({ message: 'Internal Server Error during after payment' });
        }
        return res.status(200).json({
            message: `อัปเดท idcard_std: ${userId}`,
            data: idcard_std
        });
    });
});

//! 
register_exam_router.get('/register_info', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const queryCheckRegis = `
        SELECT 
          id_customer, 
          idcard_std,
          dataname, 
          surname, 
          idcard_std,
          dataadd, districts, amphures, provinces, zip_code,
          city,
          idcard, 
          LPAD(id, 4, '0') AS id,
          date_regis, 
          branch, 
          dataemail, 
          datatel 
        FROM dataregister_2026_april_r1 
        WHERE id_customer = ?
    `;

    db_bewsie.query(queryCheckRegis, [userId], (err, results) => {
        if (err) {
            return res.status(400).json({ error: 'error: ' + err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No registration data cccccc found' });
        }

        const data = results[0];
        data.datetime = {
            date: '04 พฤษภาคม 2568',
            time: '12.00 - 14.30 น.'
        };

        data.address = {
            address: data.dataadd,
            district: data.districts,
            amphure: data.amphures,
            province: data.provinces,
            zip_code: data.zip_code
        };

        delete data.dataadd;
        delete data.districts;
        delete data.amphures;
        delete data.provinces;
        delete data.zip_code;

        return res.status(200).json({ data });
    });
});
//* gbpay check 
register_exam_router.get('/gbpayCheck', verifyToken, (req, res) => {

    const { idcard_std } = req.body;
    const check_gb_pay = 'SELECT status, idcard_std FROM data_gb_prime_pay WHERE idcard_std = ?';

    db_bewsie.query(check_gb_pay, [idcard_std], (err, results) => {
        if (err || results.length == 0) {
            return res.status(200).json({
                status_code: '0',
                message: 'ยังไม่จ่าย'

            });
        }


        else if (results[0].status == "00" || results.length > 0) {
          return res.status(200).json({
                status_code: '1',
                message: 'จ่ายแล้ว',

            });
        }

    });

    // db_bewsie.query(check_gb_pay, [ref], (err, results) => {
    //     if (err || results.length === 0) {
    //         return res.status(200).json({
    //             status_code: '0',
    //             message: 'ยังไม่จ่าย',
    //         });
    //     } 
    //     res.status(200).json({
    //         status_code: '1',
    //         message: 'จ่ายแล้ว',
    //         //  data: results[0]
    //     });
    // });
});

module.exports = register_exam_router;