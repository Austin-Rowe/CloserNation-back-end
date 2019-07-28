const express = require('express');
const router = express.Router();
const multer = require('multer');

const checkAuth = require('../authMiddleWare/checkAuth');
const ResourceController = require('../controllers/resourceController');

router.get('/', checkAuth, ResourceController.resource_getAll);
router.get('/:filename', checkAuth, ResourceController.resource_serveVideo);
router.post('/new-resource', checkAuth, multer().single('video'), ResourceController.resource_createNew);
router.patch('/edit', checkAuth, ResourceController.resource_patch);
router.delete('/:resource_id', checkAuth, ResourceController.resource_delete);



module.exports = router;