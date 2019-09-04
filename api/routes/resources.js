const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(file.fieldname = 'thumbnail'){
            cb(null, '/home/ubuntu//images/');
        } else if(file.fieldname = 'video') {
            cb(null, '/home/ubuntu/archives/');
        } else {
            console.log("Whilst trying to upload a file the fieldname was not one of the specified options.")
        }
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
router.delete('/:resource_id', checkAuth, ResourceController.resource_delete);

router.post('/default-thumb', checkAuth, multer({ storage: oneTimeUpload }).single('default-thumbnail'), (req, res) => {
    res.status(200).json({
        message: 'thumbnail added'
    });
});




module.exports = router;