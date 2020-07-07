const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        switch(file.fieldname){
            case 'thumbnail': cb(null, '/home/ubuntu/images/'); break;
            case 'video': cb(null, '/home/ubuntu/archives/'); break;
            default: cb(null, '/home/ubuntu/images/');
        }
        //cb(null, '/home/ubuntu/images/'); 
    },
    filename: (req, file, cb) => {
        switch(file.mimetype){
            case 'image/jpeg': cb(null, `${Date.now()}.jpg`); break;
            case 'image/png': cb(null, `${Date.now()}.png`); break;
            case 'video/mp4': cb(null, `${Date.now()}.mp4`); break;
            default: cb(null, `${Date.now()}`);
        }
    }
});
const fields = [
    {name: 'video', maxCount: 1}, 
    {name: 'thumbnail', maxCount: 1}
];

const checkAuth = require('../authMiddleWare/checkAuth');
const ResourceController = require('../controllers/resourceController');

const oneTimeUpload = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/ubuntu//images/');
    },
    filename: (req, file, cb) => {
        cb(null, 'defaultThumbnail.jpg')
    }
})

router.get('/', checkAuth, ResourceController.resource_getAll);
router.get('/video/:filename', checkAuth, ResourceController.resource_serveVideo);
router.get('/image/:filename', checkAuth, ResourceController.resource_serveImage);
router.post('/new-resource', checkAuth, multer({ storage }).fields(fields), ResourceController.resource_createNew);
router.patch('/edit', checkAuth, ResourceController.resource_patch);
router.delete('/:resource_id/:filename', checkAuth, ResourceController.resource_delete);

router.post('/default-thumb', checkAuth, multer({ storage: oneTimeUpload }).single('default-thumbnail'), (req, res) => {
    res.status(200).json({
        message: 'thumbnail added'
    });
});




module.exports = router;