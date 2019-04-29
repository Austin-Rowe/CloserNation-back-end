const express = require('express');
const router = express.Router();

const checkAuth = require('../authMiddleWare/checkAuth');
const ResourceController = require('../controllers/resourceController');

router.get('/', checkAuth, ResourceController.resource_getAll);
router.post('/new-resource', checkAuth, ResourceController.resource_createNew);
router.patch('/edit', checkAuth, ResourceController.resource_patch);
router.delete('/:resource_id', checkAuth, ResourceController.resource_delete);



module.exports = router;