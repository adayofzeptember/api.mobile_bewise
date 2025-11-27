
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload_router = express.Router();
const currentYear = new Date().getFullYear();
const db_bewsie = require('../db/db_bewise');
const verifyToken = require('../functions/auth');
const import_config = require('../functions/config');

//! Path server   
const baseUploadDir = `/newdata/vhosts/bewise-global.com/httpdocs/uploads/${currentYear}/mod_customer`;
const fileUploadDir = `/newdata/vhosts/bewise-global.com/httpdocs/${import_config.file_upload_round}`;

//*localhost
// const baseUploadDir = path.join(__dirname, '..', 'uploads', `${currentYear}`, 'mod_customer');
// const fileUploadDir = path.join(__dirname, '..', '${import_config.file_upload_round}');

// if (!fs.existsSync(fileUploadDir)) {
//     fs.mkdirSync(fileUploadDir, { recursive: true });
// }


const storageProfileImage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(baseUploadDir)) {
            fs.mkdirSync(baseUploadDir, { recursive: true });
        }
        cb(null, baseUploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + file.fieldname + ext);
    }
});


// const storageFile = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, fileUploadDir);
//     },
//     filename: function (req, file, cb) {
//         const ext = path.extname(file.originalname);
//         const basename = path.basename(file.originalname, ext);
//         cb(null, Date.now() + '-' + basename + ext);
//     }
// });


const storageFile = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, fileUploadDir);
    },
    filename: function (req, file, cb) {
        // ใช้ชื่อไฟล์ที่ Flutter ส่งมาเลย
        cb(null, file.originalname);
    }
});

// Upload middlewares
const uploadImage = multer({
    storage: storageProfileImage,
    limits: { fileSize: 5 * 1024 * 1024 },
    // fileFilter: imageOnlyFilter,   //? เาอออกได้
});

const uploadFile = multer({
    storage: storageFile,
    limits: { fileSize: 5 * 1024 * 1024 },
    //fileFilter: imageAndPdfFilter,
});


upload_router.post('/upload_profile_pic', verifyToken, uploadImage.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "ไม่ได้อัปโหลดไฟล์" });
    }
    const { format } = require('date-fns');
    const formattedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const userID = req.user.userId;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${currentYear}/mod_customer/${req.file.filename}`;
    const filePath = `uploads/${currentYear}/mod_customer/${req.file.filename}`;
    const directory = filePath.substring(0, filePath.lastIndexOf('/') + 1);
    const filename = filePath.substring(filePath.lastIndexOf('/') + 1);

    const query_check_img_haveID = 'SELECT id_user FROM user_images WHERE id_user = ?';
    db_bewsie.query(query_check_img_haveID, [userID], (err, resCheck) => {
        if (err) {
            console.error('UPDATE ERROR --->', err.message);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (resCheck.length > 0) {
            const query_update_address = `
                UPDATE user_images
                SET name = ?, date = ?, directory = ?, type = ?
                WHERE id_user = ?`;
            db_bewsie.query(query_update_address, [filename, formattedDate, directory, 1, userID], (err) => {
                if (err) {
                    console.error('insert image ERROR --->', err.message);
                    return res.status(500).json({ message: 'Internal Server Error' });
                }
                return res.status(201).json({
                    message: "อัปโหลดรูปภาพใหม่แล้ว",
                    userID,
                    file: {
                        path: req.file.path,
                        filename: req.file.filename,
                        date: formattedDate,
                        for_database_insert: {
                            dir: directory,
                            name: filename
                        }
                    },
                });
            });
        } else {
            const query_insert_images = `
                INSERT INTO user_images (id_user, name, date, directory, type)
                VALUES (?, ?, ?, ?, ?)`;
            db_bewsie.query(query_insert_images, [userID, filename, formattedDate, directory, 1], (err) => {
                if (err) {
                    console.error('insert image ERROR --->', err.message);
                    return res.status(500).json({ message: 'Internal Server Error', why: err.message });
                }

                return res.status(201).json({
                    message: "อัปโหลดรูปภาพแล้ว",
                    userID,
                    file: {
                        path: req.file.path,
                        filename: req.file.filename,
                        url: fileUrl,
                        date: formattedDate,
                        for_database_insert: {
                            dir: directory,
                            name: filename
                        }
                    },
                });
            });
        }
    });
});




// Upload File
upload_router.post('/upload_file', verifyToken, uploadFile.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "ไม่ได้อัปโหลดไฟล์" });
    }
    const filePath = `${import_config.file_upload_round}/${req.file.filename}`;
    const directory = path.dirname(filePath) + '/';
    const filename = path.basename(filePath);


    res.json({
        message: "ไฟล์ถูกอัปโหลดแล้ว",
        file: {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            for_database_insert: {
                dir: directory,
                name: filename
            }

        },
    });
});



//? 
//*
//!
// Error handler
upload_router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: "ไฟล์ต้องไม่มีขนาดเกิน 2MB ..." });
        }
    } else if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
    }

    next(err);
});

module.exports = upload_router;
