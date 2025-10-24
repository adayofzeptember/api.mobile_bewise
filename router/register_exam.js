const express = require('express');
const db_bewsie = require('../db/db_bewise');
const register_exam_router = express.Router();
const verifyToken = require('../functions/auth');


const axios = require('axios');
require('dotenv').config(); // โหลดตัวแปรจากไฟล์ .env

register_exam_router.post('/register', verifyToken, async (req, res) => {
    const { format, constructFrom } = require('date-fns');

    const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss'); // 🟢 Generate current timestamp
    const query_check = 'SELECT id_customer FROM dataregister_2026_april_r4 WHERE id_customer = ?';
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
            return res.status(200).json({ message: 'ข้อมูลของคุณมีอยู่ในระบบแล้ว! กรุณาตรวจสอบข้อมูลของคุณอีกครั้ง สอบถามเพิ่มเติมได้ที่ Line OA @bewise' });
        }

        const query_exam_register = `INSERT INTO dataregister_2026_april_r4 (
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
                const quey_getPayment = 'SELECT id, branch, city, id_customer FROM dataregister_2026_april_r4 WHERE id_customer = ?';
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


                    const query_update_idcard_tomod = `
                            UPDATE mod_customer 
                                SET 
                                id_card = ?    
                            WHERE id_customer = ?`;

                    db_bewsie.query(query_update_idcard_tomod, [idcard, id_customer], (err) => {
                        if (err) {
                            console.error('Error inserting register exam:', err);
                            return res.status(500).json({ message: 'error', err });
                        }


                        return res.status(201).json({
                            message: 'สมัครสอบสำเร็จ',
                            data:
                                formattedResult
                        });

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
            UPDATE dataregister_2026_april_r4 
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
                UPDATE dataregister_2026_april_r4 
                    SET
                    file_gpa = ?, status_file_gpa = '', remark_file_gpa = ''
                    WHERE id_customer = ?`;
        values = [gpa_name, userID];
    } else if (req.params.check == "id") {
        query_update_docs2 = `
            UPDATE dataregister_2026_april_r4 
                SET
                    file_idcard = ?, status_file_id = '', remark_file_id = ''
                WHERE id_customer = ?`;

        values = [id_name, userID];
    }

    else {
        query_update_docs2 = `
            UPDATE dataregister_2026_april_r4 
                SET 
                    file_idcard = ?, file_gpa = ?, status_file_id = '', remark_file_id = '', status_file_gpa = '', remark_file_gpa = ''
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
    const query_checkRole = "SELECT id_customer, dataschool, datatel, datanickname, dataname, idcard, idcard_std, city, branch FROM dataregister_2026_april_r4 WHERE id_customer = ? ";
    db_bewsie.query(query_checkRole, [customer_id], (err, results1) => {
        if (err) {
            console.error('ERROR QUERY ---> ', err.message);
            res.status(500).send('error');
            return;
        }

        const query_exam_register = `INSERT INTO datapayment_2026_april_r3 (
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

//? เช็คสมัครรึยัง
register_exam_router.get('/check_register', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const queryCheckRegis = 'SELECT * FROM dataregister_2026_april_r4 WHERE id_customer = ?';
    db_bewsie.query(queryCheckRegis, [userId], (err, results) => {
        if (results.length == 0) {
            return res.status(200).json({ message: 'ยังไม่สมัคร', status: 0 });
        }
        return res.status(200).json({ message: 'สมัครแล้ว', status: 1 });

    });

});

//? get to check เอกสาร, ชำระเงิน
register_exam_router.get('/check_docs/:type_check', verifyToken, (req, res) => {
    const check = req.params.type_check;
    const userId = req.user.userId;// Extract userId from token

    //! เช็ค docs
    if (check == 'docs') {
        const queryCheckDocs = 'SELECT file_idcard, status_file_id ,status_file_gpa,  file_gpa, remark_file_id, remark_file_gpa FROM dataregister_2026_april_r4 WHERE id_customer = ?';

        db_bewsie.query(queryCheckDocs, [userId], (err, results) => {

            if (err) {
                return res.status(400).json({ error: 'เช็คเอกสาร error ' + err.message });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({ message: 'ไม่พบข้อมูลเอกสารของผู้ใช้' });
            }

            else {
                const idcard = results[0].file_idcard;
                const gpa = results[0].file_gpa;

                const statusGpa = results[0].status_file_gpa;
                const statusID = results[0].status_file_id;
                const remarkGPA = results[0].remark_file_gpa;
                const remarkID = results[0].remark_file_id;

                if (!idcard && !gpa) {
                    return res.status(200).json({
                        message: 'ยังไม่อัปโหลดบัตรประชาชนและผลการเรียน',
                        code: "2"
                    });
                } else if (!idcard) {
                    return res.status(200).json({
                        message: 'ยังไม่อัปโหลดไฟล์บัตรประชาชน',
                        code: "1-id"
                    });
                } else if (!gpa) {
                    return res.status(200).json({
                        message: 'ยังไม่อัปโหลดไฟล์ผลการเรียน',
                        code: "1-gpa"
                    });
                } else {
                    // เอกสารอัปโหลดครบ
                    if (statusGpa == "doc_correct" && statusID == "doc_correct") {
                        return res.status(200).json({
                            code: "0",
                            message: "เอกสารผ่านการตรวจสอบแล้ว",
                            docs: [
                                { name: "สำเนาบัตรประชาชน", status: "เอกสารผ่านเกณฑ์", remark: "" },
                                { name: "ผลการเรียน", status: "เอกสารผ่านเกณฑ์", remark: "" },
                            ]
                        });
                    }

                    // ❗ ต้องเช็ก "ไม่ผ่าน" ก่อน "รอตรวจสอบ" เสมอ
                    if (statusGpa === "doc_not_passed" || statusID === "doc_not_passed") {
                        return res.status(200).json({
                            code: "refund",
                            message: 'คุณสมบัติไม่ผ่านเกณฑ์ของโครงการ',
                            docs: [
                                { name: "สำเนาบัตรประชาชน", status: "x", remark: remarkID },
                                { name: "ผลการเรียน", status: "x", remark: remarkGPA },
                            ]
                        });
                    }

                    if (statusID === "doc_incomplete" && statusGpa === "doc_incomplete") {
                        return res.status(200).json({
                            code: "both_incomplete",
                            message: "เอกสารไม่สมบูรณ์, อัปโหลดใหม่",
                            docs: [
                                { name: "สำเนาบัตรประชาชน", status: "เอกสารไม่สมบูรณ์", remark: remarkID },
                                { name: "ผลการเรียน", status: "เอกสารไม่สมบูรณ์", remark: remarkGPA },
                            ]
                        });
                    }

                    if (statusGpa === "doc_incomplete" && statusID === "doc_correct") {
                        return res.status(200).json({
                            code: "gpa_incomplete",
                            message: 'ผลการเรียน ไม่สมบูรณ์, อัปโหลดใหม่',
                            docs: [
                                { name: "สำเนาบัตรประชาชน", status: "เอกสารผ่านเกณฑ์", remark: "" },
                                { name: "ผลการเรียน", status: "เอกสารไม่สมบูรณ์", remark: remarkGPA },
                            ]
                        });
                    }

                    if (statusID === "doc_incomplete" && statusGpa === "doc_correct") {
                        return res.status(200).json({
                            code: "id_incomplete",
                            message: 'สำเนาบัตรประชาชนไม่สมบูรณ์ ',
                            docs: [
                                { name: "สำเนาบัตรประชาชน", status: "เอกสารไม่สมบูรณ์", remark: remarkID },
                                { name: "ผลการเรียน", status: "เอกสารผ่านเกณฑ์", remark: "" },

                            ]
                        });
                    }

                    // รอตรวจสอบ
                    if (statusID === "" || statusGpa === "") {
                        return res.status(200).json({
                            code: "w8",
                            message: 'เอกสารรอตรวจสอบ',
                            docs: [
                                { name: "สำเนาบัตรประชาชน", status: "รอตรวจสอบ", remark: remarkID },
                                { name: "ผลการเรียน", status: "รอตรวจสอบ", remark: remarkGPA },
                            ]
                        });
                    }

                    return res.status(200).json({
                        code: "ไม่เข้าเงื่อนไข",
                        message: 'x',

                    });

                }
            }
        });
    }
    //! เช็คว่าจะไปหน้าไหน
    else if (check == 'register') {
        const queryCheckRegis = 'SELECT id_customer FROM dataregister_2026_april_r4 WHERE id_customer = ?';
        db_bewsie.query(queryCheckRegis, [userId], (err, results) => {
            if (results.length == 0) {
                return res.status(200).json({ message: 'no-register' });
            }

            else {
                const queryCheckPay = 'SELECT idcard_std FROM data_gb_prime_pay WHERE idcard_std = ?';
                const { idcard_std } = req.body;
                db_bewsie.query(queryCheckPay, [idcard_std], (err, results) => {
                    if (err) {
                        return res.status(400).json({ error: 'เช็ค payment error ' + err.message });
                    }
                    else {

                        return res.status(200).json({ length: results.length });
                        // if (results.length == 0) {
                        //     return res.status(200).json({ message: 'not yet', "code": "payment-0", "data": "ยังไม่จ่ายเงิน" });
                        // }
                        // else {
                        //     return res.status(200).json({ message: 'paidh', "code": "payment-1", "data": "จ่ายเงินแล้ว" });
                        // }
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
            UPDATE dataregister_2026_april_r4 
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
          datatel,
          dataschool,
          provinces_school,
          datalevel,
          gpax,
          gpax_eng,
          dataparent,
          dataparenttel
        FROM dataregister_2026_april_r4 
        WHERE id_customer = ?
    `;

    db_bewsie.query(queryCheckRegis, [userId], (err, results) => {
        if (err) {
            return res.status(400).json({ error: 'error: ' + err.message });
        }
        if (results.length === 0) {
            return res.status(200).json({
                data: null,
                message: 'No registration data found'
            });
        }

        // if (results.length === 0) {
        //     return res.status(404).json({ error: 'No registration data cccccc found' });
        // }

        const data = results[0];
        data.datetime = {
            date: '23 พฤศจิกายน 2568',
            time: '12.00 - 15.30 น.'
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

    const { idcard_std } = req.query;
    const check_gb_pay = 'SELECT status, idcard_std FROM data_gb_prime_pay WHERE idcard_std = ?';

    db_bewsie.query(check_gb_pay, [idcard_std], (err, results) => {
        if (err || results.length == 0) {
            return res.status(200).json({
                status_code: '0',
                message: 'ยังไม่จ่ายด'

            });
        }
        else if (results[0].status == "00" || results.length > 0) {
            return res.status(200).json({
                status_code: '1',
                message: 'จ่ายแล้ว',

            });
        }

    });

});


//อัปเดทเลขบัตรไป mod_ หลังสมัคร
register_exam_router.put('/update_idcard_afterRegis', verifyToken, (req, res) => {
    //! อัปเดทรหัส นร ไปยัง data 
    const userId = req.user.userId;
    const { idcard } = req.body;


    const query_update_payment = `
            UPDATE mod_customer 
                SET 
                    id_card = ?    
        WHERE id_customer = ?`;

    db_bewsie.query(query_update_payment, [idcard, userId], (err, result) => {
        if (err) {
            console.error('UPDATE idcard ERROR --->', err.message);
            return res.status(500).json({ message: 'Internal Server Error during after payment' });
        }
        return res.status(200).json({
            message: `อัปเดท idcard: ${userId}`,
            data: idcard
        });
    });
});


register_exam_router.post('/generate-qr', async (req, res) => {
    try {

        const {
            referenceNo,
            detail,
            customerAddress,
            customerEmail,
            customerTelephone,
            merchantDefined1,
            merchantDefined2
        } = req.body;

        // 2. ดึง Token ลับมาจาก .env (ปลอดภัย 100%)
        const apiToken = process.env.GBPRIMEPAY_TOKEN;

        // 3. เตรียมข้อมูลที่จะส่งไป GBPrimePay
        const dataToSend = new URLSearchParams(); // GBPrimePay รับ Content-Type 'x-www-form-urlencoded'
        dataToSend.append('token', 'KeNIJ50Gg0FL7lALnLRaHeGpGZZug/fubn1OhCcnHd7v+QFLGkklaNdE3M6jnUn9HikOt11vRiHQ3KeCxKJvWW7mlbNAotkgwCOqfUTVYIyac10zHuYUIX8YwPLtTg+TiBUyizWpUwXCQcz2NdYjEKWTlno=');
        dataToSend.append('amount', '30.00'); // เช่น '300.00'
        dataToSend.append('backgroundUrl', 'https://bewise-global.com/gbprimepay/promptpay/webhook_gb_pp_full_final');
        //*
        dataToSend.append('referenceNo', referenceNo);
        dataToSend.append('detail', detail);
        dataToSend.append('customerAddress', customerAddress);
        dataToSend.append('customerEmail', customerEmail);
        dataToSend.append('customerTelephone', customerTelephone);
        dataToSend.append('merchantDefined1', merchantDefined1);
        dataToSend.append('merchantDefined2', merchantDefined2);

        console.log('Sending data to GBPrimePay:', dataToSend);

        // 4. ยิง API ไปหา GBPrimePay จากหลังบ้าน
        const gbResponse = await axios.post(
            'https://api.gbprimepay.com/v3/qrcode',
            dataToSend,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                responseType: 'arraybuffer', // ❗️ สำคัญมาก: บอก axios ให้รับข้อมูลเป็น 'bytes'
            }
        );

        // 5. ส่ง QR Code (ที่เป็น 'bytes') กลับไปให้ Flutter
        console.log('Successfully got QR from GBPrimePay!');
        res.setHeader('Content-Type', 'image/png'); // บอก Flutter ว่านี่คือไฟล์ภาพ
        res.send(gbResponse.data);

    } catch (error) {
        console.error('--- ❌ GBPrimePay Error (NodeJS) ---');
        if (error.response) {
            const errorData = Buffer.from(error.response.data, 'binary').toString('utf8');
            console.error('Status:', error.response.status);
            console.error('Data:', errorData);
            res.status(500).json({ error: 'GBPrimePay Error', details: errorData });
        } else {
            console.error('Error:', error.message);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }
});


register_exam_router.post('/favorite', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const { fav } = req.body;

    if (!fav) {
        return res.status(400).json({ message: 'กรุณาส่ง favorite_name' });
    }

    // ตรวจสอบว่ามีอยู่แล้วหรือไม่
    const checkQuery = `
        SELECT * FROM favorite
        WHERE id_customer = ? AND favorite_name = ?;
    `;

    db_bewsie.query(checkQuery, [userId, fav], (err, results) => {
        if (err) {
            console.error('Error checking favorite:', err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาด', err });
        }

        if (results.length > 0) {
            // พบแล้ว → ไม่เพิ่มซ้ำ
            return res.status(409).json({ message: 'รายการโปรดนี้มีอยู่แล้ว' });
        }

        // ยังไม่มี → ทำการ insert
        const insertQuery = `
            INSERT INTO favorite (id_customer, favorite_name)
            VALUES (?, ?);
        `;

        db_bewsie.query(insertQuery, [userId, fav], (err2, results2) => {
            if (err2) {
                console.error('Error inserting favorite:', err2);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาด', err: err2 });
            }

            return res.status(200).json({ message: 'เพิ่มรายการโปรดแล้ว' });
        });
    });
});



register_exam_router.get('/favorite', verifyToken, (req, res) => {
    const userId = req.user.userId;

    const query = `
        SELECT id, favorite_name 
        FROM favorite
        WHERE id_customer = ?;
    `;

    db_bewsie.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching favorites:', err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาด', err });
        }

        return res.status(200).json({
            message: 'success',
            favorites: results.map(row => ({
                id: row.id,
                favorite_name: row.favorite_name
            }))
        });
    });
});

register_exam_router.delete('/favorite/:id', verifyToken, (req, res) => {
    const userId = req.user.userId;
    const favoriteId = req.params.id;

    const query = `
        DELETE FROM favorite 
        WHERE id = ? AND id_customer = ?;
    `;

    db_bewsie.query(query, [favoriteId, userId], (err, results) => {
        if (err) {
            console.error('Error deleting favorite:', err);
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่จะลบ' });
        }

        return res.status(200).json({
            success: true,
            message: 'ลบรายการโปรดเรียบร้อยแล้ว'
        });
    });
});




register_exam_router.get('/zoom', verifyToken, (req, res) => {

    const get_zoomq = 'SELECT * FROM zoom_table';

    db_bewsie.query(get_zoomq, (err, results) => {
        if (err) {
            return res.status(500).json({ err });
        }

        return res.status(200).json({
            status: 1,
            data: results[0],

        });


    });


    // const userId = req.user.userId;
    // const queryCheckRegis = 'SELECT * FROM dataregister_2026_april_r4 WHERE id_customer = ?';
    // db_bewsie.query(queryCheckRegis, [userId], (err, results) => {
    //     if (results.length == 0) {
    //         return res.status(200).json({
    //             status: 0,
    //             message: 'ยังไม่สมัคร'
    //         });
    //     }

    //     const get_zoomq = 'SELECT * FROM zoom_table';

    //     db_bewsie.query(get_zoomq, (err, results) => {
    //         if (err) {
    //             return res.status(500).json({ err });
    //         }

    //         return res.status(200).json({
    //             status: 1,
    //             data: results[0],

    //         });


    //     });


    // });



});


module.exports = register_exam_router;


// register_exam_router.get('/check_docs/:type_check', verifyToken, (req, res) => {
//     const check = req.params.type_check;
//     const userId = req.user.userId;// Extract userId from token

//     //! เช็ค docs
//     if (check == 'docs') {
//         const queryCheckDocs = 'SELECT file_idcard, status_file_id ,status_file_gpa,  file_gpa, remark_file_id, remark_file_gpa FROM dataregister_2026_april_r4 WHERE id_customer = ?';

//         db_bewsie.query(queryCheckDocs, [userId], (err, results) => {

//             if (err) {
//                 return res.status(400).json({ error: 'เช็คเอกสาร error ' + err.message });
//             }

//             if (!results || results.length === 0) {
//                 return res.status(404).json({ message: 'ไม่พบข้อมูลเอกสารของผู้ใช้' });
//             }

//             else {
//                 const idcard = results[0].file_idcard;
//                 const gpa = results[0].file_gpa;

//                 const statusGpa = results[0].status_file_gpa;
//                 const statusID = results[0].status_file_id;
//                 const remarkGPA = results[0].remark_file_gpa;
//                 const remarkID = results[0].remark_file_id;

//                 if (!idcard && !gpa) {
//                     return res.status(200).json({ message: 'ยังไม่อัปโหลดบัตรประชาชนและ GPA', code: "2", remark: "ยังไม่อัปโหลดบัตรประชาชนและ GPA" });
//                 } else if (!idcard) {
//                     return res.status(200).json({ message: 'ยังไม่อัปโหลดไฟล์บัตรประชาชน', code: "1-id", remark: "" });
//                 } else if (!gpa) {
//                     return res.status(200).json({ message: 'ยังไม่อัปโหลดไฟล์ GPA', code: "1-gpa", remark: "" });
//                 } else {
//                     // อัปครบ
//                     if (statusGpa == "doc_correct" && statusID == "doc_correct") {

//                         return res.status(200).json({ message: 'เอกสารผ่านการตรวจสอบแล้ว', code: "0", remark: "" });
//                     } else {
//                         if (
//                             (statusGpa === "doc_not_passed" || statusGpa === "doc_incomplete") &&
//                             (statusID === "doc_not_passed" || statusID === "doc_incomplete")
//                         ) {
//                             return res.status(200).json({
//                                 code: "both_not_passed",
//                                 message: 'เอกสารทั้งสองไม่ผ่านการตรวจสอบ',
//                                 remark: results[0].remark_file_id + ", " + results[0].remark_file_gpa
//                             });
//                         }

//                         // GPA ไม่ผ่าน
//                         if (statusGpa === "doc_not_passed" || statusGpa === "doc_incomplete") {
//                             return res.status(200).json({
//                                 code: "gpa_not_passed",
//                                 message: 'เอกสาร GPA ไม่ผ่านการตรวจสอบ',
//                                 remark: results[0].remark_file_gpa 
//                             });
//                         }

//                         // ID card ไม่ผ่าน
//                         if (statusID === "doc_not_passed" || statusID === "doc_incomplete") {
//                             return res.status(200).json({
//                                 code: "id_not_pass",
//                                 message: 'สำเนาบัตรประชาชนไม่ผ่านการตรวจสอบ',
//                                 remark: results[0].remark_file_id
//                             });
//                         }


//                     }

//                     return res.status(200).json({ message: 'รอตรวจสอบ', "code": "w8", "remark": "" });



//                 }
//             }
//         });
//     }